import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useAuth } from "@/auth/AuthProvider";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Screen } from "@/components/Screen";
import { SignedOutPrompt } from "@/components/SignedOutPrompt";
import { spacing } from "@/theme";

export default function ProfileScreen() {
  const { state, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  function confirmSignOut() {
    Alert.alert("Sign out?", "You can sign back in any time.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          setSigningOut(true);
          void signOut().finally(() => setSigningOut(false));
        },
      },
    ]);
  }

  if (state.status !== "signedIn") {
    return (
      <Screen testID="screen-profile">
        <PageHeader eyebrow="Account" title="Profile" />
        <SignedOutPrompt message="Sign in to see your account." />
        {state.status === "unverified" && (
          <Button label="Sign out of this device" variant="ghost" onPress={confirmSignOut} />
        )}
      </Screen>
    );
  }

  const { user } = state.account;

  return (
    <Screen testID="screen-profile">
      <PageHeader eyebrow="Account" title="Profile" />

      <Card>
        {[
          { label: "Name", value: user.name },
          { label: "Email", value: user.email },
          { label: "Phone", value: user.phone },
        ].map((row) => (
          <View key={row.label} style={styles.row}>
            <AppText variant="eyebrow" tone="muted">
              {row.label}
            </AppText>
            <AppText selectable>{row.value || "—"}</AppText>
          </View>
        ))}
      </Card>

      <Button
        label="Sign out"
        variant="outline"
        loading={signingOut}
        onPress={confirmSignOut}
        testID="profile-sign-out"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.xs, paddingVertical: spacing.xs },
});
