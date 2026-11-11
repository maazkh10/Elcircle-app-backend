// @ts-nocheck


import PropTypes from "prop-types";

/* --- STAT CARD --- */

export function StatCard({ title, value, subtext, icon, progress, progressLabel }) {
  return (
    <Box background="surfacePrimary" padding="base" cornerRadius="base" border="base">
      <BlockStack gap="tight">
        <InlineStack inlineAlignment="center" coordinate="space-between">
          <Text size="small" emphasis="bold">{title}</Text>
          <Text size="small" appearance="subdued" decoration="underline">View activity</Text>
        </InlineStack>

        <InlineStack gap="base" blockAlignment="center">
            <Text size="extraLarge">{icon}</Text>
            <BlockStack gap="none">
               <Text emphasis="bold" size="large">{value}</Text>
               {subtext && <Text size="small" appearance="subdued">{subtext}</Text>}
            </BlockStack>
        </InlineStack>

        {progress !== undefined && (
          <BlockStack gap="tight">
            <ProgressIndicator value={progress} />
            <Text size="small" emphasis="bold">{progressLabel}</Text>
          </BlockStack>
        )}
      </BlockStack>
    </Box>
  );
}

StatCard.propTypes = {
  title: PropTypes.string,
  value: PropTypes.string,
  subtext: PropTypes.string,
  icon: PropTypes.string,
  progress: PropTypes.number,
  progressLabel: PropTypes.string,
};

/* --- OWNED REWARD CARD --- */

export function OwnedRewardCard({ title, code, icon }) {
  return (
    <Box background="surfacePrimary" padding="base" cornerRadius="base" border="base">
      <BlockStack gap="base">
        <InlineStack coordinate="space-between" blockAlignment="center">
          <InlineStack gap="small" blockAlignment="center">
            <Text size="large">{icon}</Text>
            <Text emphasis="bold">{title}</Text>
          </InlineStack>
          <Text size="small" decoration="underline">Terms</Text>
        </InlineStack>

        <Box border="base" padding="small" cornerRadius="base" background="surfaceSecondary">
           <BlockStack gap="none">
             <Text size="extraSmall" appearance="subdued">Discount code</Text>
             <Text emphasis="bold">{code}</Text>
           </BlockStack>
        </Box>
        <Button kind="primary">Copy code</Button>
      </BlockStack>
    </Box>
  );
}

OwnedRewardCard.propTypes = {
  title: PropTypes.string,
  code: PropTypes.string,
  icon: PropTypes.string,
};

/* --- REDEEMABLE CARD --- */

export function RedeemableCard({ title, cost, progress, icon, canRedeem }) {
  return (
    <Box background="surfacePrimary" padding="small" cornerRadius="base" border="base">
      <BlockStack gap="small">
        <InlineStack coordinate="space-between">
          <InlineStack gap="small">
            <Text size="medium">{icon}</Text>
            <BlockStack gap="none">
              <Text emphasis="bold" size="small">{title}</Text>
              <Text size="extraSmall" appearance="subdued">{cost}</Text>
            </BlockStack>
          </InlineStack>
          {canRedeem && <Text size="small" appearance="accent" decoration="underline">Redeem</Text>}
        </InlineStack>
        <ProgressIndicator value={progress} />
      </BlockStack>
    </Box>
  );
}

RedeemableCard.propTypes = {
  title: PropTypes.string,
  cost: PropTypes.string,
  progress: PropTypes.number,
  icon: PropTypes.string,
  canRedeem: PropTypes.bool,
};

/* --- VIP TIER CARD --- */

export function VipTierCard({ title, status, validUntil, rewards, perks, icon }) {
  return (
    <Box background="surfacePrimary" padding="base" cornerRadius="base" border="base">
      <BlockStack gap="base">
        <InlineStack coordinate="space-between">
            <Text size="large">{icon}</Text>
            {status && <Badge tone="success">{status}</Badge>}
        </InlineStack>

        <BlockStack gap="none">
            <Text emphasis="bold" size="large">{title}</Text>
            {validUntil && <Text size="small" appearance="subdued">Member until {validUntil}</Text>}
        </BlockStack>

        <Divider />

        <BlockStack gap="tight">
            <Text size="small" appearance="subdued" emphasis="bold">Entry Rewards</Text>
            {rewards?.map((item, i) => <Text key={i} size="small">✓ {item}</Text>)}
        </BlockStack>

        <BlockStack gap="tight">
            <Text size="small" appearance="subdued" emphasis="bold">Perks</Text>
            {perks?.map((item, i) => <Text key={i} size="small">✓ {item}</Text>)}
        </BlockStack>
      </BlockStack>
    </Box>
  );
}

VipTierCard.propTypes = {
  title: PropTypes.string,
  status: PropTypes.string,
  validUntil: PropTypes.string,
  rewards: PropTypes.array,
  perks: PropTypes.array,
  icon: PropTypes.string,
};
