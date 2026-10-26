import { StyleSheet, View } from "react-native";

/**
 * A soft gold light in a card's top-right corner. The parent needs
 * `overflow: "hidden"`. No gradient library: a translucent circle.
 */
export function Glow({ size = 130, strength = 0.14 }: { size?: number; strength?: number }) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.glow,
        { width: size, height: size, borderRadius: size / 2, top: -size * 0.4, right: -size * 0.4, backgroundColor: `rgba(212,175,55,${strength})` },
      ]}
    />
  );
}

const styles = StyleSheet.create({ glow: { position: "absolute" } });
