import { KEYGEN_API_URL, KEYGEN_PRODUCT_TOKEN } from "./constants";

interface KeygenResponse {
  data: Record<string, unknown>;
  errors?: Array<{ title: string; detail: string }>;
}

async function keygenRequest(
  path: string,
  options: RequestInit = {}
): Promise<KeygenResponse> {
  const res = await fetch(`${KEYGEN_API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${KEYGEN_PRODUCT_TOKEN}`,
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
      ...options.headers,
    },
  });

  const json = await res.json();

  if (!res.ok) {
    const errorDetail =
      json.errors?.[0]?.detail || json.errors?.[0]?.title || "Keygen API error";
    throw new Error(errorDetail);
  }

  return json;
}

export async function createLicense(
  policyId: string,
  metadata: Record<string, string> = {}
): Promise<{ licenseId: string; licenseKey: string }> {
  const res = await keygenRequest("/licenses", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "licenses",
        attributes: {
          metadata,
        },
        relationships: {
          policy: {
            data: { type: "policies", id: policyId },
          },
        },
      },
    }),
  });

  const data = res.data as Record<string, unknown>;
  const attributes = data.attributes as Record<string, unknown>;

  return {
    licenseId: data.id as string,
    licenseKey: attributes.key as string,
  };
}

export async function validateLicenseKey(
  key: string,
  fingerprint?: string
): Promise<{
  valid: boolean;
  status: string;
  code: string;
  licenseId: string;
  metadata: Record<string, unknown>;
  expiry: string | null;
  policy: string | null;
  machines: { count: number; max: number };
}> {
  const body: Record<string, unknown> = {
    meta: { key },
  };
  if (fingerprint) {
    body.meta = { ...(body.meta as object), scope: { fingerprint } };
  }

  // validate-key pode retornar 200 com valid:false, ou 404/422 para chaves inexistentes.
  // Não usar keygenRequest pois ele lança exceção em não-2xx.
  const res = await fetch(`${KEYGEN_API_URL}/licenses/actions/validate-key`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEYGEN_PRODUCT_TOKEN}`,
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  // Keygen retorna 404 se a chave não existe
  if (!res.ok) {
    const code =
      json.meta?.code || json.errors?.[0]?.code || "NOT_FOUND";
    return {
      valid: false,
      status: json.meta?.detail || json.errors?.[0]?.detail || "License not found",
      code,
      licenseId: "",
      metadata: {},
      expiry: null,
      policy: null,
      machines: { count: 0, max: 0 },
    };
  }

  const data = json.data as Record<string, unknown>;
  const meta = json.meta as Record<string, unknown>;
  const attributes = (data?.attributes || {}) as Record<string, unknown>;
  const relationships = (data?.relationships || {}) as Record<string, unknown>;
  const policyData = relationships?.policy as Record<string, unknown>;
  const policyDataInner = policyData?.data as Record<string, unknown>;

  return {
    valid: meta.valid as boolean,
    status: meta.detail as string,
    code: (meta.code as string) || "UNKNOWN",
    licenseId: (data?.id as string) || "",
    metadata: (attributes.metadata || {}) as Record<string, unknown>,
    expiry: (attributes.expiry as string) || null,
    policy: (policyDataInner?.id as string) || null,
    machines: {
      count: (attributes.machines as number) || 0,
      max: (attributes.maxMachines as number) || 1,
    },
  };
}

export async function transferPolicy(
  licenseId: string,
  newPolicyId: string
): Promise<void> {
  await keygenRequest(`/licenses/${licenseId}/policy`, {
    method: "PUT",
    body: JSON.stringify({
      data: {
        type: "policies",
        id: newPolicyId,
      },
    }),
  });
}

export async function renewLicense(licenseId: string): Promise<void> {
  await keygenRequest(`/licenses/${licenseId}/actions/renew`, {
    method: "POST",
  });
}

export async function suspendLicense(licenseId: string): Promise<void> {
  await keygenRequest(`/licenses/${licenseId}/actions/suspend`, {
    method: "POST",
  });
}

export async function findLicenseByMetadata(
  key: string,
  value: string
): Promise<{ licenseId: string; licenseKey: string } | null> {
  const res = await keygenRequest(
    `/licenses?metadata[${encodeURIComponent(key)}]=${encodeURIComponent(value)}`
  );

  const data = res.data as unknown as Array<Record<string, unknown>>;
  if (!Array.isArray(data) || data.length === 0) return null;

  const license = data[0];
  const attributes = license.attributes as Record<string, unknown>;

  return {
    licenseId: license.id as string,
    licenseKey: attributes.key as string,
  };
}

/**
 * Conta quantas licenças existem com um determinado valor de metadata.
 * Usado para rate limiting de trials por email.
 */
export async function countLicensesByMetadata(
  key: string,
  value: string
): Promise<number> {
  const res = await keygenRequest(
    `/licenses?metadata[${encodeURIComponent(key)}]=${encodeURIComponent(value)}`
  );

  const data = res.data as unknown as Array<Record<string, unknown>>;
  if (!Array.isArray(data)) return 0;
  return data.length;
}

/**
 * Encontra uma licença pelo seu license key usando validate-key.
 * Diferente de findLicenseByMetadata, isso busca pela chave em si (não por metadata).
 */
export async function findLicenseByKey(
  licenseKey: string
): Promise<{ licenseId: string } | null> {
  try {
    const result = await validateLicenseKey(licenseKey);
    if (result.licenseId) {
      return { licenseId: result.licenseId };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Atualiza os metadados de uma licença (usado para armazenar stripe_subscription_id).
 */
export async function updateLicenseMetadata(
  licenseId: string,
  metadata: Record<string, string>
): Promise<void> {
  await keygenRequest(`/licenses/${licenseId}`, {
    method: "PATCH",
    body: JSON.stringify({
      data: {
        type: "licenses",
        attributes: { metadata },
      },
    }),
  });
}
