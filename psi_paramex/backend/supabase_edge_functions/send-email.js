import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { to_email, subject, html_content, email_type = 'notification' } = await req.json()

    // Validate required fields
    if (!to_email || !subject || !html_content) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to_email, subject, html_content' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Option 1: Using SendGrid
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY')
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'ParameX <notifications@paramex.dev>'

    if (sendGridApiKey) {
      // Send email via SendGrid
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendGridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: to_email }],
              subject: subject,
            },
          ],
          from: { email: fromEmail.includes('<') ? fromEmail.match(/<(.+)>/)[1] : fromEmail },
          content: [
            {
              type: 'text/html',
              value: html_content,
            },
          ],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`SendGrid error: ${errorText}`)
      }

      // Log email to database
      const { error: logError } = await supabase
        .from('email_logs')
        .insert({
          to_email,
          subject,
          content: html_content,
          email_type,
          sent_at: new Date().toISOString(),
          status: 'sent',
          provider: 'sendgrid'
        })

      if (logError) {
        console.error('Failed to log email:', logError)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email sent successfully',
          message_id: `sendgrid_${Date.now()}`
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Option 2: Using Resend (if preferred)
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (resendApiKey) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to_email],
          subject: subject,
          html: html_content,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Resend error: ${errorText}`)
      }

      const result = await response.json()

      // Log email to database
      const { error: logError } = await supabase
        .from('email_logs')
        .insert({
          to_email,
          subject,
          content: html_content,
          email_type,
          sent_at: new Date().toISOString(),
          status: 'sent',
          provider: 'resend',
          external_id: result.id
        })

      if (logError) {
        console.error('Failed to log email:', logError)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email sent successfully',
          message_id: result.id
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Fallback: Just log to database (development mode)
    const { error: logError } = await supabase
      .from('email_logs')
      .insert({
        to_email,
        subject,
        content: html_content,
        email_type,
        sent_at: new Date().toISOString(),
        status: 'simulated',
        provider: 'development'
      })

    if (logError) {
      throw new Error(`Database error: ${logError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email simulated (development mode)',
        message_id: `dev_${Date.now()}`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/* To deploy this function:

1. Install Supabase CLI:
   npm install -g supabase

2. Login to Supabase:
   supabase login

3. Link your project:
   supabase link --project-ref your-project-ref

4. Deploy the function:
   supabase functions deploy send-email

5. Set environment variables:
   supabase secrets set SENDGRID_API_KEY=your_sendgrid_key
   supabase secrets set FROM_EMAIL="ParameX <notifications@yourdomain.com>"
   
   OR for Resend:
   supabase secrets set RESEND_API_KEY=your_resend_key

6. Test the function:
   curl -X POST 'https://your-project.supabase.co/functions/v1/send-email' \
     -H 'Authorization: Bearer your-anon-key' \
     -H 'Content-Type: application/json' \
     -d '{
       "to_email": "test@example.com",
       "subject": "Test Email",
       "html_content": "<h1>Hello World</h1>",
       "email_type": "test"
     }'
*/ 