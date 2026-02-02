import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Contact {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
}

interface SOSNotificationRequest {
  contacts: Contact[];
  shareTokens: string[];
  sharerName: string;
  triggeredBy: 'sos' | 'voice' | 'manual';
}

// Input validation helpers
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

const validatePhone = (phone: string): boolean => {
  // Allow digits, spaces, plus, dashes, parentheses
  const phoneRegex = /^[\d\s+\-()]+$/;
  return phoneRegex.test(phone) && phone.length >= 7 && phone.length <= 20;
};

const sanitizeString = (str: string, maxLength: number = 100): string => {
  return str.replace(/[<>\"'&]/g, '').trim().substring(0, maxLength);
};

// Format phone number to WhatsApp format (E.164 without +)
const formatPhoneForWhatsApp = (phone: string): string => {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');
  
  // If starts with 0, assume South African number and replace with 27
  if (digits.startsWith('0')) {
    digits = '27' + digits.substring(1);
  }
  
  return digits;
};

// Send WhatsApp message via Meta Cloud API
const sendWhatsAppMessage = async (
  phone: string,
  sharerName: string,
  trackingLink: string,
  triggeredBy: string,
  whatsappToken: string,
  phoneNumberId: string
): Promise<{ success: boolean; error?: string }> => {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  
  // Meta Cloud API endpoint
  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
  
  // In test mode, we must use the pre-approved "hello_world" template
  // For production with approved templates, you can use custom messages
  const isTestMode = true; // Change to false when you have approved templates
  
  let body;
  if (isTestMode) {
    // Test mode: Use hello_world template (pre-approved by Meta)
    body = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "template",
      template: {
        name: "hello_world",
        language: { code: "en_US" }
      }
    };
  } else {
    // Production mode: Use custom template (requires Meta approval)
    const alertType = triggeredBy === 'sos' ? '🚨 EMERGENCY SOS' : 
                     triggeredBy === 'voice' ? '⚠️ Voice Alert' : '📍 Location Share';
    body = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "template",
      template: {
        name: "sos_alert", // You'll need to create and get this approved
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: sharerName },
              { type: "text", text: alertType }
            ]
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [
              { type: "text", text: trackingLink }
            ]
          }
        ]
      }
    };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error(`WhatsApp API error for ${formattedPhone}:`, data);
      return { 
        success: false, 
        error: data.error?.message || `HTTP ${response.status}` 
      };
    }

    console.log(`WhatsApp message sent to ${formattedPhone}:`, data);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`WhatsApp send error for ${formattedPhone}:`, error);
    return { success: false, error: errorMessage };
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ============= AUTHENTICATION =============
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create authenticated Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify JWT and get user claims
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("JWT verification failed:", claimsError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = claimsData.claims.sub as string;
    console.log(`Authenticated user: ${userId}`);

    // ============= ENVIRONMENT VARIABLES =============
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const META_WHATSAPP_TOKEN = Deno.env.get("META_WHATSAPP_TOKEN");
    const META_WHATSAPP_PHONE_ID = Deno.env.get("META_WHATSAPP_PHONE_ID");
    
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const whatsappEnabled = !!(META_WHATSAPP_TOKEN && META_WHATSAPP_PHONE_ID);
    if (!whatsappEnabled) {
      console.log("WhatsApp not configured - will only send emails");
    }

    // ============= INPUT VALIDATION =============
    const requestBody = await req.json();
    const { contacts, shareTokens, sharerName, triggeredBy }: SOSNotificationRequest = requestBody;

    // Validate required fields
    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No contacts provided" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!shareTokens || !Array.isArray(shareTokens) || shareTokens.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No share tokens provided" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!sharerName || typeof sharerName !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid sharer name" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!['sos', 'voice', 'manual'].includes(triggeredBy)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid trigger type" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Sanitize inputs
    const sanitizedSharerName = sanitizeString(sharerName, 100);

    // Validate contacts format
    for (const contact of contacts) {
      if (!contact.name || typeof contact.name !== 'string') {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid contact name" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      if (contact.email && !validateEmail(contact.email)) {
        return new Response(
          JSON.stringify({ success: false, error: `Invalid email for contact: ${sanitizeString(contact.name)}` }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      if (contact.phone && !validatePhone(contact.phone)) {
        return new Response(
          JSON.stringify({ success: false, error: `Invalid phone for contact: ${sanitizeString(contact.name)}` }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // ============= AUTHORIZATION: Verify share ownership =============
    const { data: validShares, error: sharesError } = await supabase
      .from('location_shares')
      .select('share_token, sharer_user_id')
      .in('share_token', shareTokens)
      .eq('sharer_user_id', userId);

    if (sharesError) {
      console.error("Error verifying shares:", sharesError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to verify shares" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!validShares || validShares.length === 0) {
      console.error(`User ${userId} attempted to use unauthorized share tokens`);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized: Invalid share tokens" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Build a map of valid tokens
    const validTokenSet = new Set(validShares.map(s => s.share_token));
    const authorizedTokens = shareTokens.filter(t => validTokenSet.has(t));

    if (authorizedTokens.length === 0) {
      console.error(`User ${userId} has no valid share tokens`);
      return new Response(
        JSON.stringify({ success: false, error: "No valid share tokens found" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Verified ${authorizedTokens.length} share tokens for user ${userId}`);

    // ============= SEND NOTIFICATIONS =============
    const resend = new Resend(RESEND_API_KEY);
    const baseUrl = req.headers.get("origin") || "https://aeroabantu.lovable.app";
    
    interface NotificationResult {
      contact: string;
      email?: { success: boolean; error?: string };
      whatsapp?: { success: boolean; error?: string };
    }
    
    const results: NotificationResult[] = [];

    // Send notifications to each contact
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const token = authorizedTokens[i % authorizedTokens.length];
      const trackingLink = `${baseUrl}/track/${token}`;
      const sanitizedContactName = sanitizeString(contact.name, 100);
      
      const result: NotificationResult = { contact: sanitizedContactName };

      // Send Email
      if (contact.email) {
        try {
          const alertType = triggeredBy === 'sos' ? '🚨 EMERGENCY SOS ALERT' : 
                           triggeredBy === 'voice' ? '⚠️ Voice-Activated Alert' : 
                           '📍 Location Sharing';

          const emailResponse = await resend.emails.send({
            from: "AeroAbantu Alerts <onboarding@resend.dev>",
            to: [contact.email],
            subject: `${alertType} from ${sanitizedSharerName}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  
                  <!-- Header -->
                  <div style="background: ${triggeredBy === 'sos' ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)'}; padding: 32px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.1em;">
                      ${alertType}
                    </h1>
                  </div>
                  
                  <!-- Content -->
                  <div style="padding: 32px;">
                    <p style="color: #374151; font-size: 18px; margin: 0 0 16px 0;">
                      Hi ${sanitizedContactName},
                    </p>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                      <strong>${sanitizedSharerName}</strong> has ${triggeredBy === 'sos' ? 'triggered an emergency SOS alert' : 'shared their live location with you'}. 
                      ${triggeredBy === 'sos' ? 'They may need immediate assistance.' : ''}
                    </p>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                      Click the button below to view their real-time location on a map:
                    </p>
                    
                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${trackingLink}" 
                         style="display: inline-block; background: ${triggeredBy === 'sos' ? '#dc2626' : '#2563eb'}; color: #ffffff; padding: 16px 48px; font-size: 18px; font-weight: 700; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);">
                        📍 VIEW LIVE LOCATION
                      </a>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                      Or copy this link: <br>
                      <a href="${trackingLink}" style="color: #2563eb; word-break: break-all;">${trackingLink}</a>
                    </p>
                    
                    ${triggeredBy === 'sos' ? `
                    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-top: 24px;">
                      <p style="color: #991b1b; font-size: 14px; margin: 0; font-weight: 600;">
                        ⚠️ This is an emergency alert. If you believe this person is in danger, please contact local emergency services.
                      </p>
                    </div>
                    ` : ''}
                  </div>
                  
                  <!-- Footer -->
                  <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                      Sent by AeroAbantu Safety App
                    </p>
                  </div>
                  
                </div>
              </body>
              </html>
            `,
          });

          console.log(`Email sent to ${contact.email}:`, emailResponse);
          result.email = { success: true };
        } catch (emailError) {
          console.error(`Failed to send email to ${contact.email}:`, emailError);
          result.email = { success: false, error: "Email delivery failed" };
        }
      }

      // Send WhatsApp (if configured and contact has phone)
      if (whatsappEnabled && contact.phone) {
        const whatsappResult = await sendWhatsAppMessage(
          contact.phone,
          sanitizedSharerName,
          trackingLink,
          triggeredBy,
          META_WHATSAPP_TOKEN!,
          META_WHATSAPP_PHONE_ID!
        );
        result.whatsapp = whatsappResult;
      }
      
      results.push(result);
    }

    // Count successes
    const emailsSent = results.filter(r => r.email?.success).length;
    const whatsappSent = results.filter(r => r.whatsapp?.success).length;
    
    console.log(`Notifications sent by user ${userId}: ${emailsSent} emails, ${whatsappSent} WhatsApp messages`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: {
          email: emailsSent,
          whatsapp: whatsappSent,
        },
        total: results.length,
        results 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error in send-sos-notification function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "An error occurred processing your request" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
