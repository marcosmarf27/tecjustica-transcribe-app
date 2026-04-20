import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import {
  findLicenseByKey,
  findLicenseByMetadata,
  transferPolicy,
  renewLicense,
  suspendLicense,
  updateLicenseMetadata,
} from "@/lib/keygen";
import { KEYGEN_POLICIES, STRIPE_WEBHOOK_SECRET } from "@/lib/constants";
import { sendPaymentConfirmationEmail } from "@/lib/email";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[webhook/stripe] Signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const licenseKey = session.metadata?.keygen_license_key;
        const plan = session.metadata?.plan;

        if (!licenseKey || !plan) {
          console.error("[webhook/stripe] Missing metadata in session:", session.id);
          break;
        }

        const policyId = KEYGEN_POLICIES[plan as keyof typeof KEYGEN_POLICIES];
        if (!policyId) {
          console.error("[webhook/stripe] Unknown plan:", plan);
          break;
        }

        // Encontrar a licença pela chave (não por metadata)
        const license = await findLicenseByKey(licenseKey);
        if (!license) {
          console.error("[webhook/stripe] License not found for key:", licenseKey);
          break;
        }

        // Transferir para a policy do plano pago
        await transferPolicy(license.licenseId, policyId);
        console.log(
          `[webhook/stripe] License ${license.licenseId} transferred to policy ${plan}`
        );

        // Armazenar stripe_subscription_id nos metadados da licença Keygen
        // para que invoice.paid e subscription.deleted possam encontrá-la
        const subscriptionId = session.subscription as string | null;
        if (subscriptionId) {
          await updateLicenseMetadata(license.licenseId, {
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: session.customer as string,
          });

          // Copiar keygen_license_key para a metadata da subscription no Stripe
          // para que invoice.paid e subscription.deleted possam encontrar a chave
          const stripe = getStripe();
          await stripe.subscriptions.update(subscriptionId, {
            metadata: { keygen_license_key: licenseKey, plan },
          });
          console.log(
            `[webhook/stripe] Metadata synced to subscription ${subscriptionId}`
          );
        }

        // Enviar email de confirmacao
        const customerEmail = session.customer_email || session.customer_details?.email;
        if (customerEmail && plan) {
          try {
            await sendPaymentConfirmationEmail(customerEmail, plan);
            console.log(`[webhook/stripe] Confirmation email sent to ${customerEmail}`);
          } catch (emailErr) {
            console.error("[webhook/stripe] Failed to send email:", emailErr);
          }
        }

        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        // Tentar encontrar a licença pela metadata da subscription no Stripe
        const stripe = getStripe();
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const licenseKey = subscription.metadata?.keygen_license_key;

        if (licenseKey) {
          // Rota primária: encontrar pela chave
          const license = await findLicenseByKey(licenseKey);
          if (license) {
            await renewLicense(license.licenseId);
            console.log(`[webhook/stripe] License ${license.licenseId} renewed`);
          }
        } else {
          // Fallback: buscar no Keygen por stripe_subscription_id
          const license = await findLicenseByMetadata(
            "stripe_subscription_id",
            subscriptionId
          );
          if (license) {
            await renewLicense(license.licenseId);
            console.log(
              `[webhook/stripe] License ${license.licenseId} renewed (via metadata fallback)`
            );
          } else {
            console.error(
              "[webhook/stripe] No license found for subscription:",
              subscriptionId
            );
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const licenseKey = subscription.metadata?.keygen_license_key;

        if (licenseKey) {
          const license = await findLicenseByKey(licenseKey);
          if (license) {
            await suspendLicense(license.licenseId);
            console.log(`[webhook/stripe] License ${license.licenseId} suspended`);
          }
        } else {
          // Fallback: buscar no Keygen por stripe_subscription_id
          const license = await findLicenseByMetadata(
            "stripe_subscription_id",
            subscription.id
          );
          if (license) {
            await suspendLicense(license.licenseId);
            console.log(
              `[webhook/stripe] License ${license.licenseId} suspended (via metadata fallback)`
            );
          } else {
            console.error(
              "[webhook/stripe] No license found for deleted subscription:",
              subscription.id
            );
          }
        }
        break;
      }

      default:
        console.log(`[webhook/stripe] Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error("[webhook/stripe] Error processing event:", error);
    // Return 200 to prevent Stripe from retrying immediately
    // The error is logged for manual investigation
  }

  return NextResponse.json({ received: true });
}
