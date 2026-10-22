import { View } from "react-native";
import { spacing } from "@/theme";
import { AppText } from "./AppText";

/** Eyebrow + heavy title at the top of each tab, as on the website. */
export function PageHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="eyebrow" tone="gold">
        {eyebrow}
      </AppText>
      <AppText variant="title" accessibilityRole="header">
        {title.toUpperCase()}
      </AppText>
    </View>
  );
}
