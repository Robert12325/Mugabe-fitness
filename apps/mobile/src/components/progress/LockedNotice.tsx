import Ionicons from "@expo/vector-icons/Ionicons";
import { Linking, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { apiConfig } from "@/config/env";
import { colors, radius } from "@/theme";

/**
 * Shown instead of the log when the server answers 403: the trial or paid
 * month has lapsed. The data is kept on the server. There is no payment in
 * the app — renewing happens on the website.
 */
export function LockedNotice({ message }: { message: string }) {
  const accountUrl = apiConfig.ok ? `${apiConfig.baseUrl}/account` : null;

  return (
    <Card highlight testID="daily-locked">
      <View style={styles.tile}>
        <Ionicons name="lock-closed" size={22} color={colors.gold} />
      </View>
      <AppText variant="heading">Your access has ended</AppText>
      <AppText tone="secondary">{message}</AppText>
      <AppText variant="small" tone="muted">
        Everything you logged is kept, and will be here when you renew.
      </AppText>
      {accountUrl && (
        <Button
          label="Renew on the website"
          variant="outline"
          onPress={() => void Linking.openURL(accountUrl)}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
    backgroundColor: colors.goldTint,
    alignItems: "center",
    justifyContent: "center",
  },
});
