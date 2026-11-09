"""Explicit paid operator command to index reviewed catalogue records in pgvector."""
import argparse,os
import httpx
from app.storage import PostgresStore
from app.retrieval import retrieval_document,content_hash

def vector_text(values):return '['+','.join(format(float(value),'.9g') for value in values)+']'

def main():
 parser=argparse.ArgumentParser()
 parser.add_argument('--paid-authorized',action='store_true')
 parser.add_argument('--batch-size',type=int,default=24)
 args=parser.parse_args()
 if not args.paid_authorized:raise SystemExit('Pass --paid-authorized only after paid embedding calls are authorized.')
 url=os.environ.get('DATABASE_URL');key=os.environ.get('OPENROUTER_API_KEY')
 model=os.environ.get('EMBEDDING_MODEL','openai/text-embedding-3-small')
 if not url or not key:raise SystemExit('DATABASE_URL and OPENROUTER_API_KEY are required in the private environment.')
 store=PostgresStore(url)
 with store.connect() as c:
  rows=c.execute("SELECT id,api_payload FROM public.ai_tools WHERE catalog_status IN ('seeded','confirmed') AND api_payload IS NOT NULL ORDER BY name").fetchall()
  existing={str(tool_id):(digest,indexed_model) for tool_id,digest,indexed_model in c.execute('SELECT tool_id,content_hash,embedding_model FROM public.tool_retrieval_documents').fetchall()}
 pending=[]
 for tool_id,product in rows:
  content=retrieval_document(product);digest=content_hash(content)
  if existing.get(str(tool_id))==(digest,model):continue
  pending.append((tool_id,content,digest))
 if not pending:
  print(f'Embedding index is current for {len(rows)} reviewed tools.');return
 total_tokens=0;reserved_total=0.0;actual_total=0.0
 client=httpx.Client(timeout=httpx.Timeout(60,connect=10))
 batch_size=max(1,min(args.batch_size,50))
 for start in range(0,len(pending),batch_size):
  batch=pending[start:start+batch_size];reserve=0.02
  if not store.reserve(reserve):raise SystemExit('Shared application spend limit reached before embedding index completed.')
  reserved_total+=reserve
  response=client.post('https://openrouter.ai/api/v1/embeddings',headers={'Authorization':f'Bearer {key}'},json={'model':model,'dimensions':1536,'input':[content for _,content,_ in batch],'input_type':'search_document','encoding_format':'float'})
  if response.status_code>=400:
   store.settle(reserve,0);response.raise_for_status()
  data=response.json();vectors=sorted(data.get('data',[]),key=lambda item:item.get('index',0))
  if len(vectors)!=len(batch) or any(len(item.get('embedding',[]))!=1536 for item in vectors):raise SystemExit('Embedding provider returned an unexpected batch shape.')
  reported=data.get('usage',{}).get('cost')
  if isinstance(reported,(int,float)) and reported>=0:store.settle(reserve,float(reported));actual_total+=float(reported)
  else:actual_total+=reserve
  total_tokens+=int(data.get('usage',{}).get('total_tokens',0) or 0)
  with store.connect() as c:
   for (tool_id,content,digest),item in zip(batch,vectors):
    c.execute('''INSERT INTO public.tool_retrieval_documents(tool_id,content,content_hash,embedding_model,embedding,updated_at) VALUES(%s,%s,%s,%s,%s::extensions.vector,now()) ON CONFLICT(tool_id) DO UPDATE SET content=excluded.content,content_hash=excluded.content_hash,embedding_model=excluded.embedding_model,embedding=excluded.embedding,updated_at=now()''',(tool_id,content,digest,model,vector_text(item['embedding'])))
 print(f'Indexed {len(pending)} reviewed tools with {model}; tokens={total_tokens}; accounted_usd={actual_total:.6f}.')

if __name__=='__main__':main()
