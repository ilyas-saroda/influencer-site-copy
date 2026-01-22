-- Add updated_at column to creators table
ALTER TABLE public.creators 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_creators_updated_at ON public.creators(updated_at);

-- Verify column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'creators' AND column_name = 'updated_at';
