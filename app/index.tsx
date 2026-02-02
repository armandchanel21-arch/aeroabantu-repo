import { View, ScrollView, SafeAreaView } from "react-native";
import { Text } from "~/components/ui/text";

export default function Home() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mt-10 flex-1 px-4">
          <Text className="text-h1 mb-2 text-primary">New Project</Text>
          <Text className="text-body mb-8 text-muted-foreground">
            Start prompting to build your app!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
