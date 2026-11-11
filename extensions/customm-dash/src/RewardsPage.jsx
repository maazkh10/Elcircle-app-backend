import { render } from "preact";
import { useState } from "preact/hooks";
import "@shopify/ui-extensions/preact";

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {

  const [activePage, setActivePage] = useState("rewards");

  return (
    <s-box padding="large">

      {/* TOP NAVBAR */}
      <s-inline-stack gap="large">

        <s-button
          variant={activePage === "orders" ? "primary" : "secondary"}
          onClick={() => setActivePage("orders")}
        >
          Orders
        </s-button>

        <s-button
          variant={activePage === "rewards" ? "primary" : "secondary"}
          onClick={() => setActivePage("rewards")}
        >
          Care Rewards
        </s-button>

        <s-button
          variant={activePage === "profile" ? "primary" : "secondary"}
          onClick={() => setActivePage("profile")}
        >
          Profile
        </s-button>

      </s-inline-stack>


      {/* ORDERS PAGE */}
      {activePage === "orders" && (
        <s-box padding="large">
          <s-text appearance="headingLg">
            Orders Page
          </s-text>

          <s-text>
            Here you can show customer orders.
          </s-text>
        </s-box>
      )}


      {/* REWARDS PAGE */}
      {activePage === "rewards" && (
        <s-box padding="large">

          <s-text appearance="headingLg">
            Care Rewards
          </s-text>

          <s-text>
            500 Care Coins
          </s-text>

        </s-box>
      )}


      {/* PROFILE PAGE */}
      {activePage === "profile" && (
        <s-box padding="large">

          <s-text appearance="headingLg">
            Profile Page
          </s-text>

          <s-text>
            Customer profile info here.
          </s-text>

        </s-box>
      )}

    </s-box>
  );
}
