import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { MEMBERSHIP_STATUS } from "@/account/membership";
import { useAuth } from "@/auth/AuthProvider";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Glow } from "@/components/Glow";
import { PageHeader } from "@/components/PageHeader";
import { Screen } from "@/components/Screen";
import { SignedOutPrompt } from "@/components/SignedOutPrompt";
import { websiteUrl } from "@/config/website";
import { confirmAction } from "@/lib/dialogs";
import { colors, radius, spacing } from "@/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const ACCOUNT_PAGE = websiteUrl("/account");
const PRIVACY_PAGE = websiteUrl("/privacy");
const APP_VERSION = Constants.expoConfig?.version;

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function memberSince(iso: string) {
  const date = new Date(iso);
  return iso && !Number.isNaN(date.getTime()) ? date.toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "";
}

export default function ProfileScreen() {
  const { state, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  function confirmSignOut() {
    confirmAction({
      title: "Sign out?",
      message: "You can sign back in any time.",
      confirmLabel: "Sign out",
      destructive: true,
      onConfirm: () => {
        setSigningOut(true);
        void signOut().finally(() => setSigningOut(false));
      },
    });
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

  const { user, membership } = state.account;
  const status = MEMBERSHIP_STATUS[membership.status];
  const since = memberSince(user.createdAt);
  const initials = initialsOf(user.name);

  return (
    <Screen testID="screen-profile">
      <PageHeader eyebrow="Account" title="Profile" />

      <View style={styles.hero}>
        <Glow size={200} />
        <View style={styles.avatar}>
          {initials ? (
            <AppText variant="title" tone="gold">
              {initials}
            </AppText>
          ) : (
            <Ionicons name="person" size={32} color={colors.gold} />
          )}
        </View>
        <View style={styles.heroText}>
          <AppText variant="title" numberOfLines={2} style={styles.center}>
            {user.name || "Mugabe Fitness member"}
          </AppText>
          {since ? (
            <AppText variant="small" tone="secondary" style={styles.center}>
              Member since {since}
            </AppText>
          ) : null}
        </View>
        <Pressable
          onPress={() => router.navigate("/program")}
          accessibilityRole="button"
          accessibilityLabel={`Membership: ${status.label}. Open my program`}
          style={[styles.status, { borderColor: status.color }]}
        >
          <View style={[styles.dot, { backgroundColor: status.color }]} />
          <AppText variant="small" style={[styles.statusText, { color: status.color }]}>
            {membership.programName ? `${membership.programName} · ` : ""}
            {status.label}
          </AppText>
          <Ionicons name="chevron-forward" size={14} color={status.color} />
        </Pressable>
      </View>

      <View style={styles.card}>
        <AppText variant="eyebrow" tone="gold">
          Your details
        </AppText>
        <Detail icon="person-outline" label="Name" value={user.name} />
        <Detail icon="mail-outline" label="Email" value={user.email} />
        <Detail icon="call-outline" label="Phone" value={user.phone} last />
      </View>

      {ACCOUNT_PAGE ? (
        <Pressable
          onPress={() => Linking.openURL(ACCOUNT_PAGE)}
          accessibilityRole="link"
          accessibilityLabel="Manage your account on the website"
          style={({ pressed }) => [styles.link, pressed && styles.pressed]}
        >
          <View style={styles.linkIcon}>
            <Ionicons name="globe-outline" size={20} color={colors.gold} />
          </View>
          <View style={styles.flex}>
            <AppText variant="bodyStrong">Manage on the website</AppText>
            <AppText variant="small" tone="secondary">
              Bookings, payments and your daily log
            </AppText>
          </View>
          <Ionicons name="open-outline" size={18} color={colors.gold} />
        </Pressable>
      ) : null}

      {PRIVACY_PAGE ? (
        <Pressable
          onPress={() => Linking.openURL(PRIVACY_PAGE)}
          accessibilityRole="link"
          accessibilityLabel="Privacy policy"
          style={({ pressed }) => [styles.link, pressed && styles.pressed]}
          testID="profile-privacy"
        >
          <View style={styles.linkIcon}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.gold} />
          </View>
          <View style={styles.flex}>
            <AppText variant="bodyStrong">Privacy policy</AppText>
            <AppText variant="small" tone="secondary">
              What we collect and how it&apos;s used
            </AppText>
          </View>
          <Ionicons name="open-outline" size={18} color={colors.gold} />
        </Pressable>
      ) : null}

      <Button
        label="Sign out"
        variant="outline"
        loading={signingOut}
        onPress={confirmSignOut}
        testID="profile-sign-out"
      />

      <Pressable
        onPress={() => router.push("/delete-account")}
        accessibilityRole="button"
        accessibilityLabel="Delete my account"
        hitSlop={8}
        style={styles.deleteLink}
        testID="profile-delete-account"
      >
        <AppText variant="small" tone="danger" style={styles.deleteText}>
          Delete my account
        </AppText>
      </Pressable>

      {APP_VERSION ? (
        <AppText variant="small" tone="muted" style={styles.center}>
          Mugabe Fitness app {APP_VERSION}
        </AppText>
      ) : null}
    </Screen>
  );
}

function Detail({ icon, label, value, last = false }: { icon: IconName; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.detail, !last && styles.divider]}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={18} color={colors.gold} />
      </View>
      <View style={styles.flex}>
        <AppText variant="small" tone="muted">
          {label}
        </AppText>
        <AppText selectable>{value || "—"}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
    backgroundColor: "#100d05",
    overflow: "hidden",
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.goldTint,
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: { alignItems: "center", gap: 2 },
  center: { textAlign: "center" },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontWeight: "700" },
  card: {
    padding: spacing.lg,
    gap: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  detail: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.goldTint,
    alignItems: "center",
    justifyContent: "center",
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  linkIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.goldTint,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { borderColor: colors.gold },
  flex: { flex: 1 },
  deleteLink: { alignSelf: "center", paddingVertical: spacing.sm },
  deleteText: { fontWeight: "700", textDecorationLine: "underline" },
});
