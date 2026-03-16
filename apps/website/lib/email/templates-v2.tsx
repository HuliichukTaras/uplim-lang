// Email Templates V2 - Modern digest templates for Fantikx
// Based on the notification system spec

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://fantikx.com"
const BRAND_ADDRESS = "Fantikx - Your Creator Platform"
const FANTIKX_LOGO_URL = "https://fantikx.com/logo.png"
const BRAND_CYAN = "#00d4ff"
const BRAND_PURPLE = "#a855f7"

export interface DailyDigestData {
  totalUpdates: number
  likesCount: number
  commentsCount: number
  followersCount: number
  subscribersCount: number
  highlights: { type: string; text: string }[]
  ctaUrl: string
  settingsUrl: string
  unsubscribeUrl: string
}

export interface WeeklyDigestData {
  weekSummaryTitle: string
  weeklyIntro: string
  weekLikes: number
  weekComments: number
  weekNewFollowers: number
  weekNewSubs: number
  weekEarnings?: number
  bestMomentText: string
  nextWeekTip: string
  ctaUrl: string
  settingsUrl: string
  unsubscribeUrl: string
}

export interface NewSubscriberData {
  subscriberName: string
  ctaUrl: string
  settingsUrl: string
  unsubscribeUrl: string
}

export interface WinbackData {
  missedPosts: {
    creatorName: string
    creatorHandle: string
    isSensitive: boolean
  }[]
  ctaUrl: string
  settingsUrl: string
  unsubscribeUrl: string
}

export interface ProductUpdateData {
  featureName: string
  featureDescription: string
  ctaUrl: string
  settingsUrl: string
  unsubscribeUrl: string
}

export function generateEmailUrls(unsubscribeToken: string) {
  return {
    settingsUrl: `${BASE_URL}/settings`,
    unsubscribeUrl: `${BASE_URL}/api/unsubscribe?token=${unsubscribeToken}`,
  }
}

function emailWrapper(content: string, settingsUrl: string, unsubscribeUrl: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Fantikx</title>
  </head>
  <body style="margin:0;padding:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:linear-gradient(135deg,#f5f7fa 0%,#e5e7eb 100%);">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f5f7fa 0%,#e5e7eb 100%);padding:40px 20px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <!-- Header with gradient and logo -->
            <tr>
              <td style="background:linear-gradient(135deg,${BRAND_CYAN} 0%,${BRAND_PURPLE} 100%);padding:40px 32px;text-align:center;">
                <img src="${FANTIKX_LOGO_URL}" alt="Fantikx" style="height:48px;margin-bottom:8px;" />
              </td>
            </tr>
            <!-- Content -->
            <tr>
              <td style="padding:32px;">
                ${content}
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background:linear-gradient(135deg,#f9fafb 0%,#f5f7fa 100%);padding:32px;text-align:center;border-top:1px solid #e5e7eb;">
                <p style="margin:0 0 12px 0;color:#1a1a1a;font-size:14px;font-weight:600;">Fantikx</p>
                <p style="margin:0 0 16px 0;color:#6b7280;font-size:13px;">The platform for creators and fans</p>
                <p style="margin:0;color:#9ca3af;font-size:12px;">
                  <a href="${settingsUrl}" style="color:${BRAND_CYAN};text-decoration:none;font-weight:500;">Settings</a> · 
                  <a href="${unsubscribeUrl}" style="color:${BRAND_CYAN};text-decoration:none;font-weight:500;">Unsubscribe</a> · 
                  <a href="${BASE_URL}/legal/privacy" style="color:${BRAND_CYAN};text-decoration:none;font-weight:500;">Privacy</a>
                </p>
                <p style="margin:16px 0 0 0;color:#9ca3af;font-size:11px;">© ${new Date().getFullYear()} Fantikx. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function brandedButton(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:linear-gradient(135deg,${BRAND_CYAN} 0%,${BRAND_PURPLE} 100%);color:#ffffff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 4px 12px rgba(0,212,255,0.3);">${text}</a>`
}

export function dailyDigestTemplate(data: DailyDigestData): { subject: string; html: string } {
  const highlightsList = data.highlights.map((h) => `• ${h.text}`).join("<br/>")

  const content = `
    <div style="font-size:22px;font-weight:800;line-height:1.2;">
      You have ${data.totalUpdates} new updates
    </div>
    <div style="margin-top:10px;color:#374151;font-size:14px;line-height:1.6;">
      Here's what happened since your last visit:
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:14px;">
      <tr>
        <td style="padding:10px 12px;background:#f9fafb;border-radius:12px;">
          <div style="font-size:14px;line-height:1.8;">
            <strong>${data.likesCount}</strong> new likes<br/>
            <strong>${data.commentsCount}</strong> new comments<br/>
            <strong>${data.followersCount}</strong> new followers<br/>
            <strong>${data.subscribersCount}</strong> new subscribers
          </div>
        </td>
      </tr>
    </table>

    ${data.highlights.length > 0
      ? `
    <div style="margin-top:18px;font-size:14px;font-weight:700;">Top highlights</div>
    <div style="margin-top:8px;color:#374151;font-size:14px;line-height:1.7;">
      ${highlightsList}
    </div>
    `
      : ""
    }

    <div style="margin-top:18px;text-align:center;">
      <a href="${data.ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#00d4ff 0%,#a855f7 100%);color:#ffffff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 4px 12px rgba(0,212,255,0.3);">
        Open Fantikx
      </a>
    </div>

    <div style="margin-top:16px;color:#6b7280;font-size:12px;line-height:1.6;">
      Tip: Update your notification settings anytime to choose how often we email you.
    </div>
  `

  return {
    subject: `You have ${data.totalUpdates} new updates on Fantikx`,
    html: emailWrapper(content, data.settingsUrl, data.unsubscribeUrl),
  }
}

export function weeklyDigestTemplate(data: WeeklyDigestData): { subject: string; html: string } {
  const content = `
    <div style="font-size:22px;font-weight:800;line-height:1.2;">Your week in one minute</div>
    <div style="margin-top:10px;color:#374151;font-size:14px;line-height:1.6;">
      ${data.weeklyIntro}
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:14px;">
      <tr><td style="padding:14px 14px;background:#f9fafb;border-radius:12px;">
        <div style="font-size:14px;line-height:1.9;">
          <strong>${data.weekLikes}</strong> likes ·
          <strong>${data.weekComments}</strong> comments ·
          <strong>${data.weekNewFollowers}</strong> new followers ·
          <strong>${data.weekNewSubs}</strong> new subscribers
          ${data.weekEarnings ? ` · <strong>€${data.weekEarnings.toFixed(2)}</strong> earned` : ""}
        </div>
      </td></tr>
    </table>

    <div style="margin-top:16px;font-size:14px;font-weight:800;">Best moment</div>
    <div style="margin-top:8px;color:#374151;font-size:14px;line-height:1.7;">
      ${data.bestMomentText}
    </div>

    <div style="margin-top:16px;font-size:14px;font-weight:800;">Suggestion for next week</div>
    <div style="margin-top:8px;color:#374151;font-size:14px;line-height:1.7;">
      ${data.nextWeekTip}
    </div>

    <div style="margin-top:18px;text-align:center;">
      <a href="${data.ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#00d4ff 0%,#a855f7 100%);color:#ffffff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 4px 12px rgba(0,212,255,0.3);">
        See your dashboard
      </a>
    </div>
  `

  return {
    subject: `Your week on Fantikx: ${data.weekSummaryTitle}`,
    html: emailWrapper(content, data.settingsUrl, data.unsubscribeUrl),
  }
}

export function newSubscriberTemplate(data: NewSubscriberData): { subject: string; html: string } {
  const content = `
    <div style="font-size:22px;font-weight:800;line-height:1.2;">You got a new subscriber</div>
    <div style="margin-top:10px;color:#374151;font-size:14px;line-height:1.6;">
      ${data.subscriberName} subscribed to your content.
    </div>

    <div style="margin-top:14px;padding:12px;background:#f9fafb;border-radius:12px;color:#374151;font-size:14px;line-height:1.7;">
      Quick idea: post a short "welcome" update to turn this into more engagement.
    </div>

    <div style="margin-top:18px;text-align:center;">
      <a href="${data.ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#00d4ff 0%,#a855f7 100%);color:#ffffff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 4px 12px rgba(0,212,255,0.3);">
        Open creator dashboard
      </a>
    </div>

    <div style="margin-top:14px;color:#6b7280;font-size:12px;line-height:1.6;">
      You can disable "important events" emails in settings anytime.
    </div>
  `

  return {
    subject: `New subscriber: ${data.subscriberName} just joined`,
    html: emailWrapper(content, data.settingsUrl, data.unsubscribeUrl),
  }
}

export function winbackTemplate(data: WinbackData): { subject: string; html: string } {
  const postsList = data.missedPosts
    .slice(0, 5)
    .map(
      (p) => `• ${p.creatorName} (@${p.creatorHandle}) posted ${p.isSensitive ? "exclusive content" : "new content"}`,
    )
    .join("<br/>")

  const content = `
    <div style="font-size:22px;font-weight:800;line-height:1.2;">You missed a few updates</div>
    <div style="margin-top:10px;color:#374151;font-size:14px;line-height:1.6;">
      Here are new posts from creators you follow:
    </div>

    <div style="margin-top:12px;color:#374151;font-size:14px;line-height:1.8;">
      ${postsList}
    </div>

    <div style="margin-top:18px;text-align:center;">
      <a href="${data.ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#00d4ff 0%,#a855f7 100%);color:#ffffff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 4px 12px rgba(0,212,255,0.3);">
        Continue where you left off
      </a>
    </div>

    <div style="margin-top:14px;color:#6b7280;font-size:12px;line-height:1.6;">
      We only send these when there's something genuinely relevant.
    </div>
  `

  return {
    subject: "New posts from creators you follow",
    html: emailWrapper(content, data.settingsUrl, data.unsubscribeUrl),
  }
}

export function productUpdateTemplate(data: ProductUpdateData): { subject: string; html: string } {
  const content = `
    <div style="font-size:22px;font-weight:800;line-height:1.2;">${data.featureName} is now live</div>
    <div style="margin-top:10px;color:#374151;font-size:14px;line-height:1.6;">
      ${data.featureDescription}
    </div>

    <div style="margin-top:18px;text-align:center;">
      <a href="${data.ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#00d4ff 0%,#a855f7 100%);color:#ffffff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 4px 12px rgba(0,212,255,0.3);">
        Try it now
      </a>
    </div>

    <div style="margin-top:14px;color:#6b7280;font-size:12px;line-height:1.6;">
      You're receiving this because you opted in to product updates.
    </div>
  `

  return {
    subject: `New: ${data.featureName} is live`,
    html: emailWrapper(content, data.settingsUrl, data.unsubscribeUrl),
  }
}
