import { NextResponse } from "next/server";
import { validateLicenseKey } from "@/lib/keygen";
import { KEYGEN_POLICIES } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  const fingerprint = searchParams.get("fingerprint") || undefined;

  if (!key) {
    return NextResponse.json(
      { valid: false, message: "Parâmetro 'key' é obrigatório." },
      { status: 400 }
    );
  }

  try {
    const result = await validateLicenseKey(key, fingerprint);

    // Determine the plan from the policy ID
    let plan = "unknown";
    let perpetual = false;

    if (result.policy) {
      const policyEntries = Object.entries(KEYGEN_POLICIES);
      for (const [planName, policyId] of policyEntries) {
        if (policyId === result.policy) {
          plan = planName;
          break;
        }
      }
      perpetual = plan === "vitalicio";
    }

    return NextResponse.json({
      valid: result.valid,
      status: result.status,
      code: result.code,
      plan,
      expiry: result.expiry,
      machinesCount: result.machines.count,
      maxMachines: result.machines.max,
      perpetual,
    });
  } catch (error) {
    console.error("[api/license/status] Error:", error);
    return NextResponse.json(
      {
        valid: false,
        message:
          error instanceof Error
            ? error.message
            : "Erro ao validar licença.",
      },
      { status: 500 }
    );
  }
}
