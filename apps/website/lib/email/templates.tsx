// Professional email templates for Fantikx with unified design

const FANTIKX_LOGO_URL = "https://fantikx.com/logo.png"
const BRAND_CYAN = "#00d4ff"
const BRAND_PURPLE = "#a855f7"
const BRAND_PINK = "#ec4899"

export const emailTemplates = {
  wrapper: (content: string, recipientName?: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Fantikx</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #f5f7fa 0%, #e5e7eb 100%);">
      <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f5f7fa 0%, #e5e7eb 100%); padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
              <!-- Header with gradient and logo -->
              <tr>
                <td style="background: linear-gradient(135deg, ${BRAND_CYAN} 0%, ${BRAND_PURPLE} 100%); padding: 40px 32px; text-align: center;">
                  <img src="${FANTIKX_LOGO_URL}" alt="Fantikx" style="height: 48px; margin-bottom: 8px;" />
                </td>
              </tr>
              <!-- Greeting -->
              ${
                recipientName
                  ? `
              <tr>
                <td style="padding: 32px 32px 0 32px;">
                  <p style="margin: 0; color: #1a1a1a; font-size: 18px; font-weight: 600;">Hi ${recipientName},</p>
                </td>
              </tr>
              `
                  : ""
              }
              <!-- Content -->
              <tr>
                <td style="padding: ${recipientName ? "24px" : "40px"} 32px 40px 32px;">
                  ${content}
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background: linear-gradient(135deg, #f9fafb 0%, #f5f7fa 100%); padding: 32px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">Fantikx</p>
                  <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 13px;">The platform for creators and fans</p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    <a href="https://fantikx.com" style="color: ${BRAND_CYAN}; text-decoration: none; font-weight: 500;">Visit Fantikx</a> · 
                    <a href="https://fantikx.com/settings" style="color: ${BRAND_CYAN}; text-decoration: none; font-weight: 500;">Settings</a> · 
                    <a href="https://fantikx.com/legal/privacy" style="color: ${BRAND_CYAN}; text-decoration: none; font-weight: 500;">Privacy</a>
                  </p>
                  <p style="margin: 16px 0 0 0; color: #9ca3af; font-size: 11px;">© ${new Date().getFullYear()} Fantikx. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,

  button: (text: string, url: string) => `
    <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, ${BRAND_CYAN} 0%, ${BRAND_PURPLE} 100%); color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3); transition: all 0.3s;">${text}</a>
  `,

  newFollower: (recipientName: string, followerName: string, followerHandle: string, followerAvatar?: string) => ({
    subject: `${followerName} started following you on Fantikx`,
    html: emailTemplates.wrapper(
      `
      <h2 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 24px; font-weight: 700;">You have a new follower!</h2>
      <p style="margin: 0 0 28px 0; color: #6b7280; font-size: 15px;">Someone just started following your content.</p>
      
      <div style="display: flex; align-items: center; padding: 20px; background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%); border-radius: 12px; margin-bottom: 32px; border: 1px solid #e5e7eb;">
        <img src="${followerAvatar || "https://fantikx.com/default-avatar.png"}" alt="${followerName}" style="width: 56px; height: 56px; border-radius: 50%; margin-right: 16px; border: 2px solid ${BRAND_CYAN};" />
        <div>
          <p style="margin: 0 0 4px 0; font-weight: 700; color: #1a1a1a; font-size: 16px;">${followerName}</p>
          <p style="margin: 0; color: ${BRAND_CYAN}; font-size: 14px; font-weight: 500;">@${followerHandle}</p>
        </div>
      </div>
      
      ${emailTemplates.button("View Profile", `https://fantikx.com/${followerHandle}`)}
    `,
      recipientName,
    ),
  }),

  newLike: (recipientName: string, likerName: string, postId: string, postPreview?: string) => ({
    subject: `${likerName} liked your post on Fantikx`,
    html: emailTemplates.wrapper(
      `
      <h2 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 24px; font-weight: 700;">Someone liked your content!</h2>
      <p style="margin: 0 0 28px 0; color: #6b7280; font-size: 15px;"><strong style="color: #1a1a1a;">${likerName}</strong> liked your post${postPreview ? `: "${postPreview.slice(0, 60)}..."` : "."}</p>
      
      <div style="padding: 20px; background: linear-gradient(135deg, #fef3f2 0%, #fee2e2 100%); border-radius: 12px; margin-bottom: 32px; border: 2px solid ${BRAND_PINK};">
        <p style="margin: 0; text-align: center; font-size: 48px;">❤️</p>
      </div>
      
      ${emailTemplates.button("View Post", `https://fantikx.com/post/${postId}`)}
    `,
      recipientName,
    ),
  }),

  newComment: (recipientName: string, commenterName: string, postId: string, commentPreview: string) => ({
    subject: `${commenterName} commented on your post`,
    html: emailTemplates.wrapper(
      `
      <h2 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 24px; font-weight: 700;">New Comment!</h2>
      <p style="margin: 0 0 28px 0; color: #6b7280; font-size: 15px;"><strong style="color: #1a1a1a;">${commenterName}</strong> left a comment on your post.</p>
      
      <div style="padding: 20px; background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%); border-radius: 12px; border-left: 4px solid ${BRAND_CYAN}; margin-bottom: 32px;">
        <p style="margin: 0 0 12px 0; color: #4b5563; font-size: 15px; line-height: 1.6; font-style: italic;">"${commentPreview.slice(0, 150)}${commentPreview.length > 150 ? "..." : ""}"</p>
        <p style="margin: 0; color: ${BRAND_CYAN}; font-size: 14px; font-weight: 600;">— ${commenterName}</p>
      </div>
      
      ${emailTemplates.button("View Comment", `https://fantikx.com/post/${postId}`)}
    `,
      recipientName,
    ),
  }),

  newMessage: (recipientName: string, senderName: string, senderHandle: string, messagePreview: string) => ({
    subject: `New message from ${senderName}`,
    html: emailTemplates.wrapper(
      `
      <h2 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 24px; font-weight: 700;">You have a new message!</h2>
      <p style="margin: 0 0 28px 0; color: #6b7280; font-size: 15px;"><strong style="color: #1a1a1a;">${senderName}</strong> sent you a message.</p>
      
      <div style="padding: 20px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 12px; margin-bottom: 32px; border: 2px solid ${BRAND_CYAN};">
        <p style="margin: 0; color: #1e40af; font-size: 15px; line-height: 1.6;">${messagePreview.slice(0, 100)}${messagePreview.length > 100 ? "..." : ""}</p>
      </div>
      
      ${emailTemplates.button("Reply", `https://fantikx.com/messages/${senderHandle}`)}
    `,
      recipientName,
    ),
  }),

  newPurchase: (recipientName: string, buyerName: string, postId: string, amount: number) => ({
    subject: `You made a sale! €${amount.toFixed(2)} from ${buyerName}`,
    html: emailTemplates.wrapper(
      `
      <h2 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 24px; font-weight: 700;">Congratulations!</h2>
      <p style="margin: 0 0 28px 0; color: #6b7280; font-size: 15px;">You just made a sale on Fantikx!</p>
      
      <div style="padding: 32px; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 16px; margin-bottom: 32px; text-align: center; border: 3px solid #059669;">
        <p style="margin: 0 0 12px 0; font-size: 56px; font-weight: 800; color: #059669;">€${amount.toFixed(2)}</p>
        <p style="margin: 0; color: #065f46; font-size: 16px; font-weight: 600;">from ${buyerName}</p>
      </div>
      
      ${emailTemplates.button("View Earnings", `https://fantikx.com/wallet`)}
    `,
      recipientName,
    ),
  }),

  weeklyDigest: (
    recipientName: string,
    stats: { newFollowers: number; totalLikes: number; totalEarnings: number; topPost?: string },
  ) => ({
    subject: `Your weekly Fantikx summary - ${stats.newFollowers} new followers!`,
    html: emailTemplates.wrapper(
      `
      <h2 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 24px; font-weight: 700;">Your Week on Fantikx</h2>
      <p style="margin: 0 0 32px 0; color: #6b7280; font-size: 15px;">Here's how your content performed this week.</p>
      
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
        <tr>
          <td style="padding: 24px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 12px; text-align: center; vertical-align: top;" width="31%">
            <p style="margin: 0; font-size: 36px; font-weight: 800; color: ${BRAND_CYAN};">${stats.newFollowers}</p>
            <p style="margin: 8px 0 0 0; color: #1e40af; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">New Followers</p>
          </td>
          <td width="3%"></td>
          <td style="padding: 24px; background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); border-radius: 12px; text-align: center; vertical-align: top;" width="31%">
            <p style="margin: 0; font-size: 36px; font-weight: 800; color: ${BRAND_PINK};">${stats.totalLikes}</p>
            <p style="margin: 8px 0 0 0; color: #9f1239; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Total Likes</p>
          </td>
          <td width="3%"></td>
          <td style="padding: 24px; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; text-align: center; vertical-align: top;" width="31%">
            <p style="margin: 0; font-size: 36px; font-weight: 800; color: #059669;">€${stats.totalEarnings.toFixed(0)}</p>
            <p style="margin: 8px 0 0 0; color: #065f46; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Earned</p>
          </td>
        </tr>
      </table>
      
      ${emailTemplates.button("View Dashboard", `https://fantikx.com/dashboard`)}
    `,
      recipientName,
    ),
  }),

  broadcast: (recipientName: string, title: string, message: string, ctaText?: string, ctaUrl?: string) => ({
    subject: title,
    html: emailTemplates.wrapper(
      `
      <h2 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 24px; font-weight: 700;">${title}</h2>
      <p style="margin: 0 0 32px 0; color: #4b5563; font-size: 15px; line-height: 1.7;">${message}</p>
      
      ${ctaText && ctaUrl ? emailTemplates.button(ctaText, ctaUrl) : emailTemplates.button("Explore Now", "https://fantikx.com/discover")}
    `,
      recipientName,
    ),
  }),

  welcome: (userName: string) => ({
    subject: `Welcome to Fantikx, ${userName}!`,
    html: emailTemplates.wrapper(
      `
      <h2 style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 28px; font-weight: 700;">Welcome to Fantikx! 🎉</h2>
      <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.7;">We're thrilled to have you join our community. Thank you for choosing a platform that values your freedom of expression.</p>
      
      <div style="padding: 28px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 14px; margin-bottom: 28px; border-left: 4px solid ${BRAND_CYAN};">
        <h3 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 19px; font-weight: 700;">Who We Are</h3>
        <p style="margin: 0 0 16px 0; color: #334155; font-size: 15px; line-height: 1.7;">Fantikx is a social network like TikTok, Instagram, and OnlyFans — but with complete freedom. We believe in your right to express yourself without shadow bans or arbitrary content restrictions.</p>
        <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.7;">The only exception? Highly sensitive 18+ content is blurred and age-restricted (our way of complying with global regulations while keeping creators free). Everything else? Fully open.</p>
      </div>
      
      <div style="padding: 24px; background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%); border-radius: 12px; margin-bottom: 32px; border: 1px solid #facc15;">
        <p style="margin: 0 0 12px 0; color: #854d0e; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">💫 Help us grow</p>
        <p style="margin: 0; color: #713f12; font-size: 15px; line-height: 1.6;">We'd be grateful if you shared Fantikx with friends, family, or anyone who values creative freedom. Together, we're building something special.</p>
      </div>
      
      ${emailTemplates.button("Start Creating", "https://fantikx.com/upload")}
      
      <p style="margin: 32px 0 0 0; color: #9ca3af; font-size: 14px; text-align: center; line-height: 1.6;">Need help? Just reply to this email — we read every message.</p>
    `,
      userName,
    ),
  }),
}
