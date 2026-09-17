import { useEffect } from "react";
import { View } from "react-native";
import { Redirect } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useSession } from "@/lib/session";
import { setVendorMode, useVendorCopy, useVendorMode } from "@/lib/vendorMode";

const INACTIVE = "#8A8A8A";
const ACTIVE = "#F0531E";

export default function VendorTabsLayout() {
  const { loading, me } = useSession();
  const vendor = me?.vendor ?? null;

  // Keep the shared product/service copy in sync with the real offering type.
  useEffect(() => {
    if (vendor?.offeringType === "service") setVendorMode("service");
    else if (vendor?.offeringType === "product") setVendorMode("product");
  }, [vendor?.offeringType]);

  if (loading) return <View style={{ flex: 1, backgroundColor: "#FBF7F2" }} />;

  // Not an approved vendor → send them where they belong.
  if (!vendor) return <Redirect href="/(tabs)" />;
  if (vendor.offeringType === "courier") {
    return <Redirect href="/courier/dashboard" />;
  }
  if (vendor.status !== "approved") {
    return <Redirect href="/vendor-application/pending" />;
  }
  if (me?.activeRole !== "vendor") return <Redirect href="/(tabs)" />;

  return <VendorTabs />;
}

function VendorTabs() {
  const copy = useVendorCopy();
  const isService = useVendorMode() === "service";

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

      <NativeTabs.Trigger name="orders">
        <NativeTabs.Trigger.Label>{copy.ordersTab}</NativeTabs.Trigger.Label>
        {isService ? (
          <NativeTabs.Trigger.Icon
            sf="calendar.badge.clock"
            md="pending_actions"
          />
        ) : (
          <NativeTabs.Trigger.Icon
            sf="list.bullet.clipboard"
            md="receipt_long"
          />
        )}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="products">
        <NativeTabs.Trigger.Label>{copy.catalogTab}</NativeTabs.Trigger.Label>
        {isService ? (
          <NativeTabs.Trigger.Icon sf="scissors" md="content_cut" />
        ) : (
          <NativeTabs.Trigger.Icon
            sf={{ default: "shippingbox", selected: "shippingbox.fill" }}
            md="inventory_2"
          />
        )}
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
