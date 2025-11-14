// Supabase Edge Function to send feedback emails
// Deploy with: supabase functions deploy send-feedback-email

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { to, subject, message, userEmail } = await req.json()

    // Send email using Resend API (free tier: 100 emails/day)
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Core+ App <noreply@coreplus.app>',
        to: [to],
        subject: subject,
        text: message,
        reply_to: userEmail || 'noreply@coreplus.app',
      }),
    })

    const data = await res.json()

    if (res.ok) {
      return new Response(
        JSON.stringify({ success: true, data }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          status: 200,
        },
      )
    } else {
      throw new Error(data.message || 'Failed to send email')
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 400,
      },
    )
  }
})
