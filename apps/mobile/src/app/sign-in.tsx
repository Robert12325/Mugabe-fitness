import { router } from "expo-router";
import { useState } from "react";
import { checkCredentials, type FieldErrors } from "@/api/account";
import { useAuth } from "@/auth/AuthProvider";
import { AppText } from "@/components/AppText";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/Button";
import { FormScreen } from "@/components/FormScreen";
import { SessionNotice } from "@/components/SessionNotice";
import { TextField } from "@/components/TextField";

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;

    const found = checkCredentials(email, password);
    setErrors(found);
    setFormError("");

    if (Object.keys(found).length > 0) return;

    setBusy(true);
    const result = await signIn(email, password);
    setBusy(false);

    if (!result.ok) {
      // The server's own wording: it uses one message for a wrong email
      // and a wrong password, so it never reveals which accounts exist.
      setFormError(result.failure.message);
      return;
    }

    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  return (
    <FormScreen testID="screen-sign-in">
      <BrandMark size={36} />

      <AppText variant="title" accessibilityRole="header">
        WELCOME BACK
      </AppText>
      <AppText tone="secondary">
        Use the same email and password as on the Mugabe Fitness website.
      </AppText>

      <SessionNotice />

      <TextField
        label="Email"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          setErrors((prev) => ({ ...prev, email: undefined }));
        }}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="username"
        autoCorrect={false}
        returnKeyType="next"
        testID="sign-in-email"
      />

      <TextField
        label="Password"
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          setErrors((prev) => ({ ...prev, password: undefined }));
        }}
        error={errors.password}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
        testID="sign-in-password"
      />

      {formError ? (
        <AppText tone="danger" accessibilityRole="alert" testID="sign-in-error">
          {formError}
        </AppText>
      ) : null}

      <Button label="Sign in" loading={busy} onPress={() => void submit()} testID="sign-in-submit" />
      <Button
        label="New here? Create an account"
        variant="ghost"
        onPress={() => router.replace("/register")}
      />
    </FormScreen>
  );
}
