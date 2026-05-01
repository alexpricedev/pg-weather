export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailMessage {
  to: EmailAddress;
  from: EmailAddress;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}

export interface MagicLinkEmailData {
  to: EmailAddress;
  magicLinkUrl: string;
  expiryMinutes: number;
}

export class EmailService {
  constructor(private provider: EmailProvider) {}

  async sendMagicLink(data: MagicLinkEmailData): Promise<void> {
    const fromEmail = process.env.FROM_EMAIL as string;
    const fromName = process.env.FROM_NAME as string;

    const message: EmailMessage = {
      to: data.to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: "Your magic link to sign in",
      html: this.renderMagicLinkTemplate(data),
      text: this.renderMagicLinkText(data),
    };

    await this.provider.send(message);
  }

  private renderMagicLinkTemplate(data: MagicLinkEmailData): string {
    const displayFont = "'Space Grotesk', 'Helvetica Neue', Arial, sans-serif";
    const bodyFont = "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif";
    const monoFont =
      "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, 'Courier New', monospace";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Sign in to Flyable Today</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f9fc;font-family:${bodyFont};color:#0a1730;line-height:1.55;-webkit-font-smoothing:antialiased;">
  <div style="max-width:560px;margin:0 auto;padding:48px 24px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:32px;">
      <tr>
        <td style="vertical-align:middle;padding-right:12px;line-height:0;">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="-50 -50 100 100" aria-hidden="true">
            <path d="M0 -42 C 8 -26, 8 -10, 0 0 C -8 -10, -8 -26, 0 -42 Z" fill="#2f80ff"/>
            <path d="M0 42 C 8 26, 8 10, 0 0 C -8 10, -8 26, 0 42 Z" fill="#0a1730" opacity="0.25"/>
            <path d="M-42 0 C -26 -8, -10 -8, 0 0 C -10 8, -26 8, -42 0 Z" fill="#0a1730" opacity="0.55"/>
            <path d="M42 0 C 26 -8, 10 -8, 0 0 C 10 8, 26 8, 42 0 Z" fill="#0a1730" opacity="0.55"/>
          </svg>
        </td>
        <td style="vertical-align:middle;font-family:${displayFont};font-size:18px;font-weight:500;letter-spacing:-0.025em;color:#0a1730;">
          Flyable Today
        </td>
      </tr>
    </table>

    <div style="height:1px;background-color:#d6e3f0;line-height:1px;font-size:1px;margin-bottom:32px;">&nbsp;</div>

    <div style="font-family:${monoFont};font-size:11px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#5f7a98;margin-bottom:12px;">
      Magic link &middot; ${data.expiryMinutes} min
    </div>

    <h1 style="margin:0 0 16px 0;font-family:${displayFont};font-size:28px;font-weight:500;letter-spacing:-0.025em;color:#0a1730;line-height:1.2;">
      Sign in to your account
    </h1>

    <p style="margin:0 0 32px 0;font-family:${bodyFont};font-size:15px;color:#27405e;letter-spacing:-0.005em;">
      Tap the button to confirm it's you and we'll sign you in to Flyable Today. The link works once and expires in ${data.expiryMinutes} minutes.
    </p>

    <div style="margin:0 0 36px 0;">
      <a href="${data.magicLinkUrl}" style="display:inline-block;background-color:#0a1730;color:#ffffff;text-decoration:none;font-family:${monoFont};font-size:12px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;padding:14px 22px;border-radius:4px;mso-padding-alt:0;">
        Sign in to Flyable Today
      </a>
    </div>

    <div style="font-family:${monoFont};font-size:11px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#5f7a98;margin-bottom:8px;">
      Or paste this link
    </div>
    <p style="margin:0 0 36px 0;font-family:${monoFont};font-size:12px;line-height:1.5;word-break:break-all;">
      <a href="${data.magicLinkUrl}" style="color:#2f80ff;text-decoration:none;">${data.magicLinkUrl}</a>
    </p>

    <div style="height:1px;background-color:#d6e3f0;line-height:1px;font-size:1px;margin-bottom:20px;">&nbsp;</div>

    <p style="margin:0 0 8px 0;font-family:${bodyFont};font-size:13px;color:#5f7a98;">
      If you didn't request this email, you can safely ignore it.
    </p>
    <p style="margin:0;font-family:${monoFont};font-size:10.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#8ea4bd;">
      Flyable Today &middot; Personal three-day forecast for paragliders
    </p>
  </div>
</body>
</html>`;
  }

  private renderMagicLinkText(data: MagicLinkEmailData): string {
    return `Sign in to Flyable Today

Click the link below to sign in to your account:
${data.magicLinkUrl}

This link will expire in ${data.expiryMinutes} minutes.

If you didn't request this email, you can safely ignore it.`;
  }
}

let emailServiceInstance: EmailService | null = null;

const providerFactories: Record<string, () => EmailProvider> = {
  console: () => {
    const { ConsoleLogProvider } =
      require("./email-providers/console") as typeof import("./email-providers/console");
    return new ConsoleLogProvider();
  },
  resend: () => {
    const { ResendProvider } =
      require("./email-providers/resend") as typeof import("./email-providers/resend");
    return new ResendProvider(process.env.RESEND_API_KEY as string);
  },
};

export function registerEmailProvider(
  name: string,
  factory: () => EmailProvider,
): void {
  providerFactories[name] = factory;
}

export const getEmailService = (): EmailService => {
  if (!emailServiceInstance) {
    const providerName = process.env.EMAIL_PROVIDER as string;
    const factory = providerFactories[providerName];

    if (!factory) {
      throw new Error(
        `Unknown EMAIL_PROVIDER "${providerName}". ` +
          "Register it with registerEmailProvider() before calling getEmailService().",
      );
    }

    emailServiceInstance = new EmailService(factory());
  }
  return emailServiceInstance;
};

export const setEmailService = (service: EmailService): void => {
  emailServiceInstance = service;
};
