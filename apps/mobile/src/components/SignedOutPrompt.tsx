import { router } from "expo-router";
import { useAuth } from "@/auth/AuthProvider";
import { AppText } from "./AppText";
import { Button } from "./Button";
import { Card } from "./Card";
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
      <Card>
        <AppText tone="secondary">{message}</AppText>
        <Button label="Sign in" onPress={() => router.push("/sign-in")} />
        <Button label="Create account" variant="outline" onPress={() => router.push("/register")} />
      </Card>
    </>
  );
}
