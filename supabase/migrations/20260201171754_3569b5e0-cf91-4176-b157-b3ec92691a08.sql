-- Create table for live location sharing
CREATE TABLE public.live_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  is_active BOOLEAN NOT NULL DEFAULT true,
  triggered_by TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'sos', 'voice'
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.live_locations ENABLE ROW LEVEL SECURITY;

-- Users can manage their own location shares
CREATE POLICY "Users can insert their own location"
ON public.live_locations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own location"
ON public.live_locations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own location"
ON public.live_locations
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own location"
ON public.live_locations
FOR SELECT
USING (auth.uid() = user_id);

-- Create table for location share recipients
CREATE TABLE public.location_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  live_location_id UUID NOT NULL REFERENCES public.live_locations(id) ON DELETE CASCADE,
  sharer_user_id UUID NOT NULL,
  recipient_contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.location_shares ENABLE ROW LEVEL SECURITY;

-- Users can manage shares they created
CREATE POLICY "Users can insert their own shares"
ON public.location_shares
FOR INSERT
WITH CHECK (auth.uid() = sharer_user_id);

CREATE POLICY "Users can delete their own shares"
ON public.location_shares
FOR DELETE
USING (auth.uid() = sharer_user_id);

CREATE POLICY "Users can view shares they created"
ON public.location_shares
FOR SELECT
USING (auth.uid() = sharer_user_id);

-- Enable realtime for live location updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_locations;

-- Add trigger for updated_at
CREATE TRIGGER update_live_locations_updated_at
BEFORE UPDATE ON public.live_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();