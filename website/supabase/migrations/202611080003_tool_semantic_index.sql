-- Server-only semantic retrieval index for the researched tool catalogue.
-- Apply after 202611070002_discovery_phase1.sql.
create extension if not exists vector with schema extensions;

create table if not exists public.tool_retrieval_documents (
  tool_id uuid primary key references public.ai_tools(id) on delete cascade,
  content text not null check (length(trim(content)) > 0),
  content_hash text not null,
  embedding_model text not null,
  embedding extensions.vector(1536) not null,
  updated_at timestamptz not null default now()
);

alter table public.tool_retrieval_documents enable row level security;
revoke all on public.tool_retrieval_documents from anon, authenticated;

-- The catalogue is currently tiny, so exact cosine search is preferable to an
-- approximate index: it is deterministic and avoids filtered-index recall loss.
create or replace function public.match_tool_retrieval_documents(
  query_embedding extensions.vector(1536),
  required_capabilities text[] default '{}',
  match_count integer default 20
)
returns table(tool_id uuid, semantic_similarity double precision)
language sql
stable
security invoker
set search_path = ''
as $$
  select d.tool_id, 1 - (d.embedding OPERATOR(extensions.<=>) query_embedding) as semantic_similarity
  from public.tool_retrieval_documents d
  join public.ai_tools t on t.id=d.tool_id
  where t.catalog_status <> 'rejected'
    and (
      cardinality(required_capabilities)=0
      or exists (
        select 1 from public.tool_capabilities tc
        where tc.tool_id=d.tool_id
          and tc.capability_id=any(required_capabilities)
      )
    )
  order by d.embedding OPERATOR(extensions.<=>) query_embedding
  limit least(greatest(match_count,1),100);
$$;

revoke all on function public.match_tool_retrieval_documents(extensions.vector,text[],integer) from public, anon, authenticated;
