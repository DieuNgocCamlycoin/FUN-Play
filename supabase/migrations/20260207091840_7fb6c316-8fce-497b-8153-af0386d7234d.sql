-- Add images array column for multiple images (max 30)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';

-- Add gif_url column for celebration GIFs  
ALTER TABLE posts ADD COLUMN IF NOT EXISTS gif_url text;

-- Add post_type to distinguish manual posts vs donation receipts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS post_type text DEFAULT 'manual';

-- Add donation_transaction_id for linking donation posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS donation_transaction_id uuid REFERENCES donation_transactions(id);

-- Create bucket for post images
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for post-images bucket
CREATE POLICY "Anyone can view post images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'post-images');

CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'post-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own post images"
ON storage.objects FOR DELETE
USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);