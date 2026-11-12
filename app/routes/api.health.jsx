import sessionStorage from "../session-storage.server";

export async function loader() {
  try {
    if (!(await sessionStorage.isReady())) throw new Error("Session storage unavailable.");
    return Response.json(
      { status: "ok" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { status: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
