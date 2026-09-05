import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function SearchBar() {
  return (
    <View className=" flex-row items-center gap-3 px-4 pt-3">
      <View
        className="h-[46px] flex-1 flex-row items-center gap-[6px] rounded-full bg-white px-4"
        style={{ borderWidth: 1, borderColor: "#E7E7E7" }}
      >
        <Ionicons name="search-outline" size={16} color="#8A8A8A" />
        <Text className="text-[13px] font-inter-regular text-[#8A8A8A]">
          Search for meals...
        </Text>
      </View>
      <Pressable hitSlop={8} className="h-[46px] w-[24px] items-center justify-center">
        <Ionicons name="options-outline" size={20} color="#1F1F1F" />
      </Pressable>
    </View>
  );
}
