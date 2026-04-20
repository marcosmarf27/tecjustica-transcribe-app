import { Resend } from "resend";
import { RESEND_API_KEY, EMAIL_FROM, APP_URL } from "./constants";

const resend = new Resend(RESEND_API_KEY);

const PLAN_LABELS: Record<string, string> = {
  mensal: "Mensal (R$ 70/mes)",
  anual: "Anual (R$ 229/ano)",
  vitalicio: "Vitalicio (R$ 399)",
};

function systemRequirementsBlock(): string {
  return `
    <!-- System Requirements -->
    <div style="background:#030303;border:1px solid #333;border-radius:8px;padding:16px;margin:24px 0;">
      <div style="font-size:13px;font-weight:600;color:#fafafa;margin-bottom:12px;">
        &#9889; Requisitos do sistema
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="color:#71717a;font-size:12px;padding:4px 0;">Sistema</td>
          <td style="color:#a1a1aa;font-size:12px;padding:4px 0;text-align:right;">Windows 10+ ou Linux</td>
        </tr>
        <tr>
          <td style="color:#71717a;font-size:12px;padding:4px 0;">GPU</td>
          <td style="color:#a1a1aa;font-size:12px;padding:4px 0;text-align:right;">NVIDIA recomendada (10x mais rapido)</td>
        </tr>
        <tr>
          <td style="color:#71717a;font-size:12px;padding:4px 0;">Sem GPU</td>
          <td style="color:#a1a1aa;font-size:12px;padding:4px 0;text-align:right;">Funciona em CPU (mais lento)</td>
        </tr>
        <tr>
          <td style="color:#71717a;font-size:12px;padding:4px 0;">Setup</td>
          <td style="color:#a1a1aa;font-size:12px;padding:4px 0;text-align:right;">10-30 min (primeiro uso)</td>
        </tr>
      </table>
      <div style="margin-top:10px;padding-top:10px;border-top:1px solid #262626;font-size:11px;color:#71717a;">
        macOS nao e suportado. O app configura dependencias automaticamente no primeiro uso.
      </div>
    </div>
  `;
}

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#030303;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:20px;font-weight:700;color:#fafafa;">TecJustica</span>
      <span style="font-size:20px;color:#00bcd4;margin-left:6px;">Transcribe</span>
      <div style="margin-top:6px;font-size:11px;color:#71717a;">Parceria TecJustica &times; Projurista</div>
    </div>

    <!-- Content -->
    <div style="background:#111111;border:1px solid #262626;border-radius:12px;padding:32px 24px;">
      ${content}
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:32px;font-size:11px;color:#52525b;">
      <p style="margin:0;">TecJustica Transcribe &mdash; Transcricao de audiencias com IA</p>
      <p style="margin:4px 0 0;">Parceria TecJustica &times; Projurista</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Envia email com a license key apos criacao do trial.
 */
export async function sendTrialEmail(
  to: string,
  name: string,
  licenseKey: string
): Promise<void> {
  const firstName = name.split(" ")[0];
  const downloadUrl = `${APP_URL}/download`;

  const content = `
    <h2 style="color:#fafafa;font-size:22px;margin:0 0 8px;">Sua chave de teste esta pronta!</h2>
    <p style="color:#a1a1aa;font-size:14px;margin:0 0 24px;">
      Ola ${firstName}, obrigado por experimentar o TecJustica Transcribe.
      Voce tem <strong style="color:#00e676;">7 dias</strong> de acesso completo.
    </p>

    <!-- License Key Box -->
    <div style="background:#030303;border:1px solid #333;border-radius:8px;padding:16px;text-align:center;margin-bottom:24px;">
      <div style="font-size:11px;color:#71717a;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Sua chave de licenca</div>
      <div style="font-family:'Courier New',monospace;font-size:15px;color:#00e5ff;letter-spacing:1px;word-break:break-all;">
        ${licenseKey}
      </div>
    </div>

    <!-- Steps -->
    <h3 style="color:#fafafa;font-size:15px;margin:0 0 12px;">Como ativar:</h3>
    <ol style="color:#a1a1aa;font-size:13px;padding-left:20px;margin:0 0 24px;line-height:1.8;">
      <li>Baixe e instale o aplicativo</li>
      <li>Abra o app e cole a chave acima na tela de ativacao</li>
      <li>Pronto! Comece a transcrever suas audiencias</li>
    </ol>

    ${systemRequirementsBlock()}

    <!-- CTA Button -->
    <div style="text-align:center;">
      <a href="${downloadUrl}" style="display:inline-block;background:linear-gradient(135deg,#00e676,#00bcd4,#2196f3);color:#030303;text-decoration:none;font-weight:600;font-size:14px;padding:12px 32px;border-radius:8px;">
        Baixar o aplicativo
      </a>
    </div>

    <p style="color:#52525b;font-size:12px;text-align:center;margin:20px 0 0;">
      Guarde esta chave em local seguro. Voce precisara dela para ativar o app.
    </p>
  `;

  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Sua chave de teste — TecJustica Transcribe",
    html: baseTemplate(content),
  });
}

/**
 * Envia email de confirmacao apos pagamento via Stripe.
 */
export async function sendPaymentConfirmationEmail(
  to: string,
  plan: string
): Promise<void> {
  const planLabel = PLAN_LABELS[plan] || plan;
  const downloadUrl = `${APP_URL}/download`;

  const content = `
    <div style="text-align:center;margin-bottom:20px;">
      <div style="display:inline-block;background:#00e676;color:#030303;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;">PAGAMENTO CONFIRMADO</div>
    </div>

    <h2 style="color:#fafafa;font-size:22px;margin:0 0 8px;text-align:center;">Sua licenca foi ativada!</h2>
    <p style="color:#a1a1aa;font-size:14px;margin:0 0 24px;text-align:center;">
      Seu plano <strong style="color:#00e5ff;">${planLabel}</strong> esta ativo.
      Sua licenca ja foi atualizada automaticamente.
    </p>

    <!-- Plan Info -->
    <div style="background:#030303;border:1px solid #333;border-radius:8px;padding:16px;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="color:#71717a;font-size:13px;padding:6px 0;">Plano</td>
          <td style="color:#fafafa;font-size:13px;padding:6px 0;text-align:right;font-weight:600;">${planLabel}</td>
        </tr>
        <tr>
          <td style="color:#71717a;font-size:13px;padding:6px 0;">Status</td>
          <td style="color:#00e676;font-size:13px;padding:6px 0;text-align:right;font-weight:600;">Ativo</td>
        </tr>
        <tr>
          <td style="color:#71717a;font-size:13px;padding:6px 0;">Dispositivos</td>
          <td style="color:#fafafa;font-size:13px;padding:6px 0;text-align:right;">1 computador</td>
        </tr>
      </table>
    </div>

    ${systemRequirementsBlock()}

    <p style="color:#a1a1aa;font-size:13px;margin:0 0 20px;text-align:center;">
      Abra o aplicativo — ele detectara automaticamente a atualizacao da sua licenca na proxima validacao.
    </p>

    <!-- CTA Button -->
    <div style="text-align:center;">
      <a href="${downloadUrl}" style="display:inline-block;background:linear-gradient(135deg,#00e676,#00bcd4,#2196f3);color:#030303;text-decoration:none;font-weight:600;font-size:14px;padding:12px 32px;border-radius:8px;">
        Baixar o aplicativo
      </a>
    </div>
  `;

  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Assinatura ativada — TecJustica Transcribe",
    html: baseTemplate(content),
  });
}
