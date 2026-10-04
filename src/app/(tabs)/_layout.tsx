import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useTheme } from "@/lib/theme";

const INACTIVE = "#1F1F1F";
const ACTIVE = "#FF6B4A";

export default function TabsLayout() {
  const { t } = useTheme();
  return (
    <NativeTabs
      backgroundColor={t("#FFFFFF")}
      labelVisibilityMode="labeled"
      iconColor={{ default: t(INACTIVE), selected: ACTIVE }}
      labelStyle={{
        default: { color: t(INACTIVE), fontSize: 11 },
        selected: { color: ACTIVE, fontSize: 11 },
      }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md="home"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="orders">
        <NativeTabs.Trigger.Label>Orders</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "bag", selected: "bag.fill" }}
          md="shopping_bag"
        />
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
