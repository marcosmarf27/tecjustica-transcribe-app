import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { STRIPE_PRICES, PLAN_MODES, APP_URL } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const { licenseKey, email, plan } = await request.json();

    if (!licenseKey || !email || !plan) {
      return NextResponse.json(
        { success: false, message: "licenseKey, email e plan são obrigatórios." },
        { status: 400 }
      );
    }

    const priceId = STRIPE_PRICES[plan as keyof typeof STRIPE_PRICES];
    if (!priceId) {
      return NextResponse.json(
        { success: false, message: `Plano inválido: ${plan}` },
        { status: 400 }
      );
    }

    const mode = PLAN_MODES[plan];
    if (!mode) {
      return NextResponse.json(
        { success: false, message: `Modo inválido para o plano: ${plan}` },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode,
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { keygen_license_key: licenseKey, plan },
      success_url: `${APP_URL}/sucesso?plan=${plan}`,
      cancel_url: `${APP_URL}/#precos`,
    } as Stripe.Checkout.SessionCreateParams);

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error("[api/checkout] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Erro ao criar sessão de pagamento.",
      },
      { status: 500 }
    );
  }
}
