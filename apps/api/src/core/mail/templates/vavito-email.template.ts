export interface VavitoEmailFrameInput {
  bodyHtml: string;
  footerHtml?: string;
  previewText: string;
  responsiveCss?: string;
  siteUrl: string;
}

export function escapeEmailHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function emailTextWithBreaks(value: string): string {
  return escapeEmailHtml(value).replaceAll(/\r?\n/g, '<br>');
}

export function emailCtaButton(label: string, url: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;"><tr><td style="background:#18191b;border-radius:999px;text-align:center;"><a href="${escapeEmailHtml(url)}" target="_blank" rel="noopener noreferrer" style="color:#ffffff;display:inline-block;font-size:15px;font-weight:700;padding:13px 24px;text-decoration:none;">${escapeEmailHtml(label)} &nbsp;↗</a></td></tr></table>`;
}

function brandFooter(siteUrl: string): string {
  const brandLogoUrl = new URL('/brand/vavito-symbol.png', siteUrl).toString();

  return `<div style="background:#18191b;border-radius:16px;color:#e6e5e1;margin-top:44px;padding:28px;text-align:center;">
    <a href="${escapeEmailHtml(siteUrl)}" target="_blank" rel="noopener noreferrer" style="color:#e6e5e1;display:inline-block;text-decoration:none;">
      <img src="${escapeEmailHtml(brandLogoUrl)}" alt="" width="58" height="34" style="border:0;display:inline-block;height:34px;margin:0 10px 0 0;object-fit:contain;vertical-align:middle;width:58px;">
      <span style="font-size:18px;vertical-align:middle;"><strong>vavito</strong> archives</span>
    </a>
    <p style="color:#a1a1aa;font-size:13px;letter-spacing:0.04em;line-height:1.5;margin:16px 0 0;">IDEIAS &nbsp;·&nbsp; CÓDIGO &nbsp;·&nbsp; APRENDIZADO</p>
  </div>`;
}

export function vavitoEmailHtml(input: VavitoEmailFrameInput): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
      @media only screen and (max-width: 600px) {
        .email-content { padding: 32px 22px 28px !important; }
        .email-title { font-size: 30px !important; }
        ${input.responsiveCss ?? ''}
      }
    </style>
  </head>
  <body style="background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;margin:0;padding:0;">
    <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeEmailHtml(input.previewText)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;border-collapse:collapse;width:100%;"><tr><td align="center" style="padding:32px 12px;">
      <table role="presentation" width="680" cellspacing="0" cellpadding="0" style="background:#ffffff;border-collapse:separate;border-radius:18px;max-width:680px;width:100%;"><tr><td class="email-content" style="padding:48px 40px 36px;">
        ${input.bodyHtml}
        ${brandFooter(input.siteUrl)}
        ${input.footerHtml ?? '<p style="color:#71717a;font-size:12px;line-height:1.6;margin:22px 0 0;text-align:center;">Esta é uma mensagem automática do Vavito Archives.</p>'}
      </td></tr></table>
    </td></tr></table>
  </body>
</html>`;
}
