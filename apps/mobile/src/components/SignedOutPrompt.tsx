import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useAuth } from "@/auth/AuthProvider";
import { colors, radius, spacing } from "@/theme";
import { AppText } from "./AppText";
import { Button } from "./Button";
import { Glow } from "./Glow";
import { SessionNotice } from "./SessionNotice";

/** Shown on a tab that needs an account. While a session is still being
 *  checked, or can't be checked, the notice explains why instead. */
export function SignedOutPrompt({ message }: { message: string }) {
  const { state } = useAuth();

  if (state.status === "restoring") return null;
  if (state.status === "unverified") return <SessionNotice />;

  return (
    <>
      <SessionNotice />
      <View style={styles.card}>
        <Glow size={170} />
        <View style={styles.icon}>
          <Ionicons name="lock-closed-outline" size={24} color={colors.gold} />
        </View>
        <AppText variant="heading">{message}</AppText>
        <AppText variant="small" tone="secondary">
          Use the same email and password as on the Mugabe Fitness website.
        </AppText>
        <View style={styles.actions}>
          <View style={styles.action}>
            <Button label="Sign in" onPress={() => router.push("/sign-in")} />
          </View>
          <View style={styles.action}>
            <Button label="Create account" variant="outline" onPress={() => router.push("/register")} />
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
    backgroundColor: "#100d05",
    overflow: "hidden",
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.45)",
    backgroundColor: colors.goldTint,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.xs },
  action: { flexGrow: 1, flexBasis: 140 },
});
