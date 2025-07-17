-- Create email_logs table for tracking email sending
CREATE TABLE IF NOT EXISTS public.email_logs (
  id BIGSERIAL PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT,
  email_type TEXT DEFAULT 'notification',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'simulated'
  provider TEXT, -- 'sendgrid', 'resend', 'development', etc.
  external_id TEXT, -- ID from external email service
  error_message TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON public.email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON public.email_logs(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own email logs
CREATE POLICY "Users can view own email logs" ON public.email_logs
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'role' = 'service_role'
  );

-- RLS Policy: Only service role can insert email logs
CREATE POLICY "Service role can insert email logs" ON public.email_logs
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- RLS Policy: Only service role can update email logs
CREATE POLICY "Service role can update email logs" ON public.email_logs
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_email_logs_updated_at 
  BEFORE UPDATE ON public.email_logs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add some sample email types for reference
COMMENT ON COLUMN public.email_logs.email_type IS 'Types: notification, welcome, reminder, update, test, newsletter';
COMMENT ON COLUMN public.email_logs.status IS 'Status: pending, sent, failed, simulated';
COMMENT ON COLUMN public.email_logs.provider IS 'Email service provider: sendgrid, resend, development, etc.';

-- Grant permissions
GRANT ALL ON public.email_logs TO service_role;
GRANT SELECT ON public.email_logs TO authenticated; 