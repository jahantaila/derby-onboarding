-- Run this in the Supabase SQL editor to create the documents storage bucket
-- with a 10MB file size limit

INSERT INTO storage.buckets (id, name, file_size_limit, allowed_mime_types, public)
VALUES (
  'documents',
  'documents',
  10485760,  -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
  false
);

-- Allow authenticated uploads to the documents bucket
CREATE POLICY "Allow authenticated uploads"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

-- Allow authenticated reads from the documents bucket
CREATE POLICY "Allow authenticated reads"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');
