import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "resend";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Contact {
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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const resend = new Resend(RESEND_API_KEY);
    const { contacts, shareTokens, sharerName, triggeredBy }: SOSNotificationRequest = await req.json();

    if (!contacts || contacts.length === 0) {
      throw new Error("No contacts provided");
    }

    if (!shareTokens || shareTokens.length === 0) {
      throw new Error("No share tokens provided");
    }

    const baseUrl = req.headers.get("origin") || "https://aeroabantu.lovable.app";
    const results: { email?: string; success: boolean; error?: string }[] = [];

    // Send email notifications to each contact
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const token = shareTokens[i] || shareTokens[0];
      const trackingLink = `${baseUrl}/track/${token}`;

      if (contact.email) {
        try {
          const alertType = triggeredBy === 'sos' ? '🚨 EMERGENCY SOS ALERT' : 
                           triggeredBy === 'voice' ? '⚠️ Voice-Activated Alert' : 
                           '📍 Location Sharing';

          const emailResponse = await resend.emails.send({
            from: "AeroAbantu Alerts <onboarding@resend.dev>",
            to: [contact.email],
            subject: `${alertType} from ${sharerName}`,
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
                      Hi ${contact.name},
                    </p>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                      <strong>${sharerName}</strong> has ${triggeredBy === 'sos' ? 'triggered an emergency SOS alert' : 'shared their live location with you'}. 
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
          results.push({ email: contact.email, success: true });
        } catch (emailError) {
          console.error(`Failed to send email to ${contact.email}:`, emailError);
          results.push({ 
            email: contact.email, 
            success: false, 
            error: emailError instanceof Error ? emailError.message : "Unknown error" 
          });
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`SOS notifications sent: ${successCount}/${results.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
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
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
