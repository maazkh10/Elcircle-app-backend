import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { accountRequest } from "./customer-api";

export default () => render(<RewardsPage />, document.body);

function RewardsPage() {
  const [rewards, setRewards] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  async function refresh() {
    setLoading(true);
    setError("");
    try { setRewards(await accountRequest("/api/customer-account/points")); }
    catch (failure) { setError(failure.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);
  return (
    <s-page heading="Care rewards">
      <s-section heading="Your Elcircle membership">
        <s-stack gap="base">
          {loading && <s-text>Loading your rewards…</s-text>}
          {error && <s-banner tone="critical">{error}</s-banner>}
          {rewards && <>
            <s-text>Points balance: {Number(rewards.points).toLocaleString()}</s-text>
            <s-text>Membership tier: {rewards.tier || "Not assigned"}</s-text>
            <s-text>Qualifying spend: AED {Number(rewards.lifetimeSpend).toFixed(2)}</s-text>
          </>}
          <s-button onClick={refresh} disabled={loading}>Refresh rewards</s-button>
          <s-link href="https://r2ev3h-um.myshopify.com/pages/reward-page">Open the rewards dashboard</s-link>
        </s-stack>
      </s-section>
      <s-section heading="Rewards activity">
        <s-text>{rewards?.history ? (typeof rewards.history === "string" ? rewards.history : JSON.stringify(rewards.history)) : "No rewards activity is available."}</s-text>
      </s-section>
    </s-page>
  );
}
