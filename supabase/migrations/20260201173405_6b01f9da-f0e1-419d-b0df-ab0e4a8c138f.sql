-- Add share_token column to location_shares for unique access links
ALTER TABLE public.location_shares 
ADD COLUMN share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');

-- Create index for fast token lookups
CREATE INDEX idx_location_shares_token ON public.location_shares(share_token);

-- Add RLS policy to allow public access via token
CREATE POLICY "Anyone can view share by token"
ON public.location_shares
FOR SELECT
USING (true);

-- Add policy to allow viewing live_locations via valid share
CREATE POLICY "Recipients can view shared locations"
ON public.live_locations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.location_shares ls
    WHERE ls.live_location_id = id
  )
);