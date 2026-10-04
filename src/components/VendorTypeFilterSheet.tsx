import { Modal, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme";

export type VendorTypeFilter = "all" | "product" | "service" | "courier";

export const VENDOR_TYPE_FILTER_OPTIONS: { key: VendorTypeFilter; label: string }[] = [
  { key: "all", label: "All vendors" },
  { key: "product", label: "Products" },
  { key: "service", label: "Services" },
  { key: "courier", label: "Couriers" },
];

/**
 * Shared bottom-sheet filter by vendor offering type — used by Home and
 * Explore Search so there's one implementation, not two. Filters via the
 * existing `GET /api/vendors?type=` param.
 */
export function VendorTypeFilterSheet({
  visible,
  value,
  onClose,
  onChange,
  hide = [],
}: {
  visible: boolean;
  value: VendorTypeFilter;
  onClose: () => void;
  onChange: (next: VendorTypeFilter) => void;
  /** Options to leave out, e.g. Home doesn't list couriers. */
  hide?: VendorTypeFilter[];
}) {
  const { t } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 justify-end bg-black/40">
        <Pressable className="rounded-t-3xl bg-white dark:bg-[#201B17] px-5 pb-8 pt-3">
          <View className="mb-2 h-1.5 w-12 self-center rounded-full bg-[#E0DAD1] dark:bg-[#3A342E]" />
          <Text className="mb-2 px-1 text-[17px] font-inter-bold text-[#1F1F1F] dark:text-[#F3EEE8]">
            Filter vendors
          </Text>
          {VENDOR_TYPE_FILTER_OPTIONS.filter((opt) => !hide.includes(opt.key)).map((opt) => {
            const active = opt.key === value;
            return (
              <Pressable
                key={opt.key}
                onPress={() => {
                  onChange(opt.key);
                  onClose();
                }}
                className="flex-row items-center justify-between border-b border-[#F1ECE4] dark:border-[#2E2924] py-4"
              >
                <Text
                  className={`text-[16px] ${active ? "font-inter-semibold" : "font-inter-regular"}`}
                  style={{ color: active ? "#FF6B4A" : t("#1F1F1F") }}
                >
                  {opt.label}
                </Text>
                {active ? <Ionicons name="checkmark" size={20} color="#FF6B4A" /> : null}
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
