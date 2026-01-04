-- Create storage bucket for posts
insert into storage.buckets (id, name, public)
values ('posts', 'posts', true)
on conflict (id) do nothing;

-- Set up storage policies
create policy "Anyone can view post images"
on storage.objects for select
using (bucket_id = 'posts');

create policy "Authenticated users can upload post images"
on storage.objects for insert
with check (
  bucket_id = 'posts' 
  and auth.role() = 'authenticated'
);

create policy "Users can update their own post images"
on storage.objects for update
using (
  bucket_id = 'posts' 
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete their own post images"
on storage.objects for delete
using (
  bucket_id = 'posts' 
  and auth.uid()::text = (storage.foldername(name))[1]
);
