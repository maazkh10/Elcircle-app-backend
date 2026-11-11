
import { authenticate } from "../shopify.server";

const corsHeaders = {
  "Access-Control-Allow-Origin":
    "https://dashboard-customer.myshopify.com",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "Accept, Content-Type, ngrok-skip-browser-warning",
  "Cache-Control": "no-store",
};

export async function loader({ request, params }) {
  try {
    // Authenticate the Shopify Admin request.
    const { admin } = await authenticate.admin(request);

    const handle = String(params.handle || "").trim();

    if (!handle) {
      return Response.json(
        { success: false, error: "Collection handle required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Fetch the collection and its products from Shopify.
    const response = await admin.graphql(
      `#graphql
        query CollectionProducts($searchQuery: String!) {
          collections(first: 10, query: $searchQuery) {
            nodes {
              id
              title
              handle
              products(first: 100) {
                nodes {
                  id
                  title
                  handle
                  description
                  vendor
                  tags
                  featuredImage {
                    url
                    altText
                  }
                  metafield(
                    namespace: "custom"
                    key: "minimum_membership_tier"
                  ) {
                    value
                  }
                }
              }
            }
          }
        }
      `,
      {
        variables: {
          searchQuery: `handle:${handle}`,
        },
      }
    );

    // Log the HTTP response and body to diagnose Shopify API errors.
    console.log(
      "[Collections API] Shopify HTTP status:",
      response.status
    );

    console.log(
      "[Collections API] Shopify response headers:",
      Object.fromEntries(response.headers.entries())
    );

    const rawBody = await response.text();

    console.log(
      "[Collections API] Shopify response body:",
      rawBody
    );

    let result;

    try {
      result = JSON.parse(rawBody);
    } catch {
      throw new Error(
        `Shopify returned a non-JSON response (HTTP ${response.status})`
      );
    }

    if (!response.ok) {
      throw new Error(
        `Shopify API returned HTTP ${response.status}: ${rawBody}`
      );
    }

    if (result.errors?.length) {
      console.error(
        "[Collections API] GraphQL errors:",
        result.errors
      );

      return Response.json(
        {
          success: false,
          error: "Shopify collection query failed",
          details: result.errors.map((error) => error.message),
        },
        { status: 502, headers: corsHeaders }
      );
    }

    const collection = result.data?.collections?.nodes?.find(
      (item) => item.handle === handle
    );

    if (!collection) {
      return Response.json(
        { success: false, error: "Collection not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return Response.json(
      {
        success: true,
        collection: {
          id: collection.id,
          title: collection.title,
          handle: collection.handle,
        },
        products: collection.products.nodes.map((product) => ({
          id: product.id,
          title: product.title,
          handle: product.handle,
          description: product.description,
          vendor: product.vendor,
          image: product.featuredImage?.url || "",
          imageAlt:
            product.featuredImage?.altText || product.title,
          tags: product.tags,
          requiredTier:
            product.metafield?.value?.trim().toLowerCase() || null,
        })),
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[Collections API] Error:", error);

    return Response.json(
      {
        success: false,
        error: "Unable to fetch collection",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
