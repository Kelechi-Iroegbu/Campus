import { Text, View } from "react-native";

export function AboutSection({ name, about }: { name: string; about: string }) {
  return (
    <View className="mt-4 px-3">
      <Text className="text-[14px] font-inter-bold text-[#111111] dark:text-[#F5F0EA]">About {name}</Text>
      <Text className="mt-1 text-[11px] font-inter-regular leading-4 text-[#555A65] dark:text-[#B7BAC2]">
        {about}
      </Text>
    </View>
  );
}
