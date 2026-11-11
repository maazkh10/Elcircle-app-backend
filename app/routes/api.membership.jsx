
// import { getCustomerMembership } from "../lib/membership.server";
// import { getAuthenticatedStorefrontCustomer } from "../lib/storefront-customer.server";
// import { syncCustomerMembershipOnLogin } from "../lib/loyalty-ledger.server";

// function corsHeaders() {
//   return {
//     "Access-Control-Allow-Origin": "https://dashboard-customer.myshopify.com",
//     "Access-Control-Allow-Methods": "GET, OPTIONS",
//     "Access-Control-Allow-Headers": "Accept, Content-Type",
//     "Vary": "Origin",
//     "Content-Type": "application/json; charset=utf-8",
//     "Cache-Control": "no-store",
//   };
// }


// function jsonResponse(body, status = 200) {
//   return new Response(JSON.stringify(body), {
//     status,
//     headers: corsHeaders(),
//   });
// }

// export const loader = async ({ request }) => {
//   try {
//     console.log("[Membership API] Request received");

//     const storefrontCustomer =
//       await getAuthenticatedStorefrontCustomer(request);

//     await syncCustomerMembershipOnLogin({
//       shop: storefrontCustomer.shop,
//       customerId: storefrontCustomer.customerId,
//       email: storefrontCustomer.email,
//     });

//     console.log("[Membership API] Customer sync completed");

//     const membership = await getCustomerMembership(storefrontCustomer);

//     return jsonResponse({
//       success: true,
//       found: membership.found,
//       tier: membership.tier,
//       benefits: membership.benefits
//         ? {
//             minimumInvestment: membership.benefits.minimumInvestment,
//             benefitAmount: membership.benefits.benefitAmount,
//             invitationOnly: Boolean(membership.benefits.invitationOnly),
//           }
//         : null,
//       access: membership.access,
//     });
//   } catch (error) {
//     console.error("[Membership API] FULL ERROR:", error);

//     const reason = String(error?.message || "");

//     if (
//       reason.startsWith("APP_PROXY_") ||
//       reason === "SHOPIFY_OFFLINE_SESSION_NOT_FOUND"
//     ) {
//       return jsonResponse(
//         {
//           success: false,
//           error: "Please log in to view your membership.",
//         },
//         401,
//       );
//     }

//     return jsonResponse(
//       {
//         success: false,
//         error: String(error?.message || "Membership is temporarily unavailable."),
//       },
//       500,
//     );
//   }
// };

// export const action = async ({ request }) => {
//   if (request.method === "OPTIONS") {
//     return new Response(null, {
//       status: 204,
//       headers: corsHeaders(),
//     });
//   }

//   return jsonResponse(
//     { success: false, error: "Method not allowed." },
//     405
//   );
// };



import { getCustomerMembership } from "../lib/membership.server";
import { syncCustomerMembershipOnLogin } from "../lib/loyalty-ledger.server";
import { getAuthenticatedStorefrontCustomer } from "../lib/storefront-customer.server";

function responseHeaders(request) {
  const origin = request?.headers?.get("Origin");

  return {
    ...(origin === "https://dashboard-customer.myshopify.com"
      ? { "Access-Control-Allow-Origin": origin }
      : {}),
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Accept, Content-Type",
    Vary: "Origin",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  };
}

function jsonResponse(body, status, request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders(request),
  });
}

export async function loader({ request }) {
  const url = new URL(request.url);

  console.log("[Membership API] Request", {
    pathname: url.pathname,
    shop: url.searchParams.get("shop"),
    hasSignature: url.searchParams.has("signature"),
    hasLoggedInCustomer: Boolean(
      url.searchParams.get("logged_in_customer_id")
    ),
  });

  try {
    const storefrontCustomer =
      await getAuthenticatedStorefrontCustomer(request);

    await syncCustomerMembershipOnLogin({
      shop: storefrontCustomer.shop,
      customerId: storefrontCustomer.customerId,
      email: storefrontCustomer.email,
    });

    const membership =
      await getCustomerMembership(storefrontCustomer);

    return jsonResponse(
      {
        success: true,
        found: membership.found,
        tier: membership.tier,
        benefits: membership.benefits
          ? {
              minimumInvestment:
                membership.benefits.minimumInvestment,
              benefitAmount:
                membership.benefits.benefitAmount,
              invitationOnly: Boolean(
                membership.benefits.invitationOnly
              ),
            }
          : null,
        access: membership.access,
      },
      200,
      request
    );
  } catch (error) {
    const errorStatus = Number(error?.status);
    const reason = String(error?.message || "");

    if (error instanceof Response && error.headers.get("X-Elcircle-Auth") === "customer-login-required") {
      return jsonResponse({
        success: true,
        authenticated: false,
        found: false,
        tier: null,
        error: "Please sign in to view your membership.",
      }, 200, request);
    }

    console.error("[Membership API] Failed", { status: errorStatus || 500 });

    if (
      errorStatus === 400 ||
      errorStatus === 401 ||
      reason.startsWith("APP_PROXY_") ||
      reason === "SHOPIFY_OFFLINE_SESSION_NOT_FOUND"
    ) {
      return jsonResponse(
        {
          success: false,
          error: "Please log in to view your membership.",
        },
        401,
        request
      );
    }

    return jsonResponse(
      {
        success: false,
        error: "Membership is temporarily unavailable.",
      },
      500,
      request
    );
  }
}

export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: responseHeaders(request),
    });
  }

  return jsonResponse(
    {
      success: false,
      error: "Method not allowed.",
    },
    405,
    request
  );
}
