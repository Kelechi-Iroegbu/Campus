import { NativeTabs } from "expo-router/unstable-native-tabs";

const INACTIVE = "#8A8A8A";
const ACTIVE = "#F0531E";

export default function CourierTabsLayout() {
  return (
    <NativeTabs
      backgroundColor="#FFFFFF"
      labelVisibilityMode="labeled"
      iconColor={{ default: INACTIVE, selected: ACTIVE }}
      labelStyle={{
        default: { color: INACTIVE, fontSize: 11 },
        selected: { color: ACTIVE, fontSize: 11 },
      }}
    >
      <NativeTabs.Trigger name="dashboard">
        <NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }}
          md="grid_view"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="deliveries">
        <NativeTabs.Trigger.Label>Deliveries</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="location.north.line" md="near_me" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="wallet">
        <NativeTabs.Trigger.Label>Wallet</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "wallet.pass", selected: "wallet.pass.fill" }}
          md="account_balance_wallet"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "person", selected: "person.fill" }}
          md="person"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
