import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { Screen } from "./Screen";

/** A form page that keeps its fields above the keyboard. */
export function FormScreen({ children, testID }: { children: ReactNode; testID?: string }) {
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen edges={["left", "right", "bottom"]} testID={testID}>
        {children}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
