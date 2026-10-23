-- Follow-up indexes suggested by Supabase Performance Advisor
create index if not exists posts_product_owner_fk_idx on public.posts(product_id,user_id);
create index if not exists job_logs_post_owner_fk_idx on public.job_logs(post_id,user_id);
