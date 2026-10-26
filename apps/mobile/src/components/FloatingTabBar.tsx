import Ionicons from "@expo/vector-icons/Ionicons";
import type { Tabs } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { colors, fonts, radius, spacing } from "@/theme";

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>["tabBar"]>>[0];
type IconName = React.ComponentProps<typeof Ionicons>["name"];

/** Per tab: its icon at rest and when selected, and the short label under it. */
const TABS: Record<string, { icon: IconName; active: IconName; label: string }> = {
  index: { icon: "home-outline", active: "home", label: "Home" },
  program: { icon: "calendar-outline", active: "calendar", label: "Program" },
  workouts: { icon: "barbell-outline", active: "barbell", label: "Workouts" },
  progress: { icon: "stats-chart-outline", active: "stats-chart", label: "Progress" },
  profile: { icon: "person-outline", active: "person", label: "Profile" },
};

/** The tab raised in the middle of the bar, in gold. */
const CENTRE = "workouts";

/**
 * A rounded tab bar floating above the bottom edge, with Workouts as a
 * raised gold button in the middle. Behaves like the standard tab bar:
 * pressing the open tab again returns its stack to the top.
 */
export function FloatingTabBar({ state, descriptors, emitter, navigateToTab, insets }: TabBarProps) {
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const tab = TABS[route.name];
          if (!tab) return null;

          const focused = state.index === index;
          const title = descriptors[route.key].options.title ?? tab.label;
          const centre = route.name === CENTRE;

          // As the standard tab bar does it.
          const onPress = () => {
            const event = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={() => emitter.emit({ type: "tabLongPress", target: route.key })}
              accessibilityRole="button"
              accessibilityLabel={title}
              accessibilityState={{ selected: focused }}
              testID={`tab-${route.name}`}
              style={styles.item}
              hitSlop={4}
            >
              {centre ? (
                <View style={[styles.centre, focused && styles.centreFocused]}>
                  <Ionicons name={tab.active} size={26} color={colors.onGold} />
                </View>
              ) : (
                <Ionicons name={focused ? tab.active : tab.icon} size={22} color={focused ? colors.gold : colors.textMuted} />
              )}
              <AppText
                variant="small"
                numberOfLines={1}
                style={[styles.label, { color: focused ? colors.gold : colors.textMuted }]}
              >
                {tab.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 68,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
  item: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 4 },
  label: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 14 },
  // Sits half above the bar, ringed in the page colour so it reads as raised.
  centre: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginTop: -34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gold,
    borderWidth: 4,
    borderColor: colors.background,
    shadowColor: colors.gold,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  centreFocused: { backgroundColor: colors.goldLight },
});
