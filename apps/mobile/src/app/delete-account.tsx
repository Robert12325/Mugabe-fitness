import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useAuth } from "@/auth/AuthProvider";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { FormScreen, formStyles } from "@/components/FormScreen";
import { TextField } from "@/components/TextField";
import { colors, radius, spacing } from "@/theme";

const DELETED = [
  "Your profile, email and password",
  "Your daily log, weigh-ins, targets and your coach's notes",
  "Your membership and its payment screenshots",
];

/**
 * Permanently deletes the account (App Store guideline 5.1.1(v)), after the
 * member confirms with their password.
 */
export default function DeleteAccountScreen() {
  const { state, deleteAccount } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    if (!password) {
      setError("Enter your password to confirm.");
      return;
    }

    setBusy(true);
    setError("");
    const result = await deleteAccount(password);
    setBusy(false);

    if (!result.ok) {
      if (result.failure.kind === "unauthorized") {
        router.replace("/sign-in");
        return;
      }
      setError(result.failure.message);
      return;
    }

    router.replace("/");
    Alert.alert("Account deleted", "Your account and its data have been permanently deleted.");
  }

  if (state.status !== "signedIn") {
    return (
      <FormScreen testID="screen-delete-account">
        <AppText tone="secondary">Sign in to the account you want to delete.</AppText>
        <Button label="Sign in" onPress={() => router.replace("/sign-in")} />
      </FormScreen>
    );
  }

  return (
    <FormScreen testID="screen-delete-account">
      <View style={styles.icon}>
        <Ionicons name="warning-outline" size={28} color={colors.danger} />
      </View>
      <AppText variant="title" accessibilityRole="header">
        DELETE YOUR ACCOUNT
      </AppText>
      <AppText tone="secondary">
        This permanently deletes the account for {state.account.user.email}. It can&apos;t be undone.
      </AppText>

      <View style={styles.list}>
        <AppText variant="eyebrow" tone="danger">
          Deleted
        </AppText>
        {DELETED.map((item) => (
          <View key={item} style={styles.row}>
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
            <AppText variant="small" tone="secondary" style={styles.flex}>
              {item}
            </AppText>
          </View>
        ))}
        <AppText variant="eyebrow" tone="muted" style={styles.kept}>
          Kept
        </AppText>
        <View style={styles.row}>
          <Ionicons name="document-text-outline" size={16} color={colors.textMuted} />
          <AppText variant="small" tone="secondary" style={styles.flex}>
            Bookings you sent through the website&apos;s booking form stay with your coach as payment records, no longer linked to any account.
          </AppText>
        </View>
      </View>

      <View style={formStyles.panel}>
        <TextField
          label="Password"
          icon="lock-closed-outline"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setError("");
          }}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          onSubmitEditing={() => void submit()}
          testID="delete-password"
        />

        {error ? (
          <AppText tone="danger" accessibilityRole="alert" testID="delete-error">
            {error}
          </AppText>
        ) : null}

        <Button label="Delete my account" variant="danger" loading={busy} onPress={() => void submit()} testID="delete-confirm" />
      </View>

      <Button label="Keep my account" variant="ghost" onPress={() => router.back()} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerTint,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  row: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  kept: { marginTop: spacing.sm },
  flex: { flex: 1 },
});
