import hashlib,json,re

def retrieval_document(product):
 parts=[
  'Product: '+product.get('name',''),
  'Description: '+(product.get('short_description') or ''),
  'Capabilities: '+', '.join(cap.replace('_',' ') for cap in product.get('matched_capabilities',[])),
 ]
 for evidence in product.get('evidence',[]):
  value=evidence.get('claim_value')
  if isinstance(value,(dict,list)):value=json.dumps(value,sort_keys=True,separators=(',',':'))
  parts.append(f"{evidence.get('claim_key','claim').replace('_',' ').title()}: {value or ''}")
 for issue in product.get('issues',[]):parts.append('Limitation: '+issue)
 return re.sub(r'\s+',' ','\n'.join(parts)).strip()[:12000]

def content_hash(content):return hashlib.sha256(content.encode()).hexdigest()
