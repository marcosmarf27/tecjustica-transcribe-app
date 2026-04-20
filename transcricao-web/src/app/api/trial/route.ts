import { NextResponse } from "next/server";
import { createLicense, countLicensesByMetadata } from "@/lib/keygen";
import { KEYGEN_POLICIES } from "@/lib/constants";
import { sendTrialEmail } from "@/lib/email";

const MAX_TRIALS_PER_EMAIL = 3;

export async function POST(request: Request) {
  try {
    const { name, email } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { success: false, message: "Nome e e-mail são obrigatórios." },
        { status: 400 }
      );
    }

    // Rate limit: max 3 trials por email
    const existingCount = await countLicensesByMetadata("email", email);
    if (existingCount >= MAX_TRIALS_PER_EMAIL) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Limite de ${MAX_TRIALS_PER_EMAIL} licenças de teste por e-mail atingido. Considere adquirir um plano.`,
        },
        { status: 429 }
      );
    }

    const { licenseKey } = await createLicense(KEYGEN_POLICIES.trial, {
      name,
      email,
      plan: "trial",
    });

    // Enviar email com a license key (non-blocking)
    try {
      await sendTrialEmail(email, name, licenseKey);
    } catch (emailErr) {
      console.error("[api/trial] Failed to send email:", emailErr);
      // Nao falhar o request se o email falhar
    }

    return NextResponse.json({
      success: true,
      licenseKey,
      message: "Licença de teste criada com sucesso!",
    });
  } catch (error) {
    console.error("[api/trial] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Erro ao criar licença de teste.",
      },
      { status: 500 }
    );
  }
}
