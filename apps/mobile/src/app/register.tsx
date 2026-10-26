import { router } from "expo-router";
import { useState } from "react";
import { checkRegistration, PASSWORD_MIN, type FieldErrors, type Registration } from "@/api/account";
import { useAuth } from "@/auth/AuthProvider";
import { View } from "react-native";
import { AppText } from "@/components/AppText";
import { AuthHeader } from "@/components/AuthHeader";
import { Button } from "@/components/Button";
import { FormScreen, formStyles } from "@/components/FormScreen";
import { SessionNotice } from "@/components/SessionNotice";
import { TextField } from "@/components/TextField";

const EMPTY: Registration = { name: "", email: "", phone: "", password: "" };

export default function RegisterScreen() {
  const { register } = useAuth();
  const [form, setForm] = useState<Registration>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  function set(field: keyof Registration, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function submit() {
    if (busy) return;

    const found = checkRegistration(form);
    setErrors(found);
    setFormError("");

    if (Object.keys(found).length > 0) return;

    setBusy(true);
    const result = await register(form);
    setBusy(false);

    if (!result.ok) {
      setFormError(result.failure.message);
      return;
    }

    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  return (
    <FormScreen testID="screen-register">
      <AuthHeader
        title="START YOUR"
        accent="JOURNEY."
        subtitle="One account for the app and the Mugabe Fitness website."
      />

      <SessionNotice />

      <View style={formStyles.panel}>
        <TextField
          label="Name"
          icon="person-outline"
          value={form.name}
          onChangeText={(value) => set("name", value)}
          error={errors.name}
          autoComplete="name"
          textContentType="name"
          testID="register-name"
        />
        <TextField
          label="Email"
          icon="mail-outline"
          value={form.email}
          onChangeText={(value) => set("email", value)}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          autoCorrect={false}
          testID="register-email"
        />
        <TextField
          label="Phone"
          icon="call-outline"
          value={form.phone}
          onChangeText={(value) => set("phone", value)}
          error={errors.phone}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          testID="register-phone"
        />
        <TextField
          label="Password"
          icon="lock-closed-outline"
          value={form.password}
          onChangeText={(value) => set("password", value)}
          error={errors.password}
          placeholder={`At least ${PASSWORD_MIN} characters`}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          onSubmitEditing={() => void submit()}
          testID="register-password"
        />

        {formError ? (
          <AppText tone="danger" accessibilityRole="alert" testID="register-error">
            {formError}
          </AppText>
        ) : null}

        <Button label="Create account" loading={busy} onPress={() => void submit()} testID="register-submit" />
      </View>

      <Button
        label="Already have an account? Sign in"
        variant="ghost"
        onPress={() => router.replace("/sign-in")}
      />
    </FormScreen>
  );
}
