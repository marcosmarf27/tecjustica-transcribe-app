// Keygen
export const KEYGEN_ACCOUNT_ID = process.env.KEYGEN_ACCOUNT_ID!;
export const KEYGEN_PRODUCT_TOKEN = process.env.KEYGEN_PRODUCT_TOKEN!;
export const KEYGEN_API_URL = `https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}`;

export const KEYGEN_POLICIES = {
  trial: process.env.KEYGEN_POLICY_TRIAL!,
  mensal: process.env.KEYGEN_POLICY_MENSAL!,
  anual: process.env.KEYGEN_POLICY_ANUAL!,
  vitalicio: process.env.KEYGEN_POLICY_VITALICIO!,
} as const;

// Stripe
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export const STRIPE_PRICES = {
  mensal: process.env.STRIPE_PRICE_MENSAL!,
  anual: process.env.STRIPE_PRICE_ANUAL!,
  vitalicio: process.env.STRIPE_PRICE_VITALICIO!,
} as const;

export const PLAN_MODES: Record<string, "subscription" | "payment"> = {
  mensal: "subscription",
  anual: "subscription",
  vitalicio: "payment",
};

// Email (Resend)
export const RESEND_API_KEY = process.env.RESEND_API_KEY!;
export const EMAIL_FROM =
  process.env.EMAIL_FROM || "TecJustica Transcribe <noreply@app.tecjustica.com>";

// App
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const GITHUB_RELEASES_URL =
  "https://github.com/marcosmarf27/tecjustica-transcribe-desktop-releases/releases/latest";
