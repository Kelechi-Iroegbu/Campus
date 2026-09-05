import { Text, View } from "react-native";

export function AboutSection({ name, about }: { name: string; about: string }) {
  return (
    <View className="mt-4 px-3">
      <Text className="text-[14px] font-inter-bold text-[#111111]">About {name}</Text>
      <Text className="mt-1 text-[11px] font-inter-regular leading-4 text-[#555A65]">
        {about}
      </Text>
    </View>
  );
}
