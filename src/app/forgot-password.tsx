import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Platform, View } from 'react-native';

import { ErrorNote, Field, Header } from '@/components/form';
import { AppText, Button, Screen } from '@/components/ui';
import { supabase } from '@/lib/supabase';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!EMAIL_RE.test(email.trim())) return setError('Enter a valid email address.');
    setBusy(true);
    // The link opens /reset-password, which signs the user in with a recovery session.
    const redirectTo = Platform.OS === 'web' ? `${window.location.origin}/reset-password` : Linking.createURL('/reset-password');
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
    setBusy(false);
    // Same message whether or not the account exists, so this can't be used to probe for emails.
    if (err && err.status !== 429) return setError("Couldn't send the email. Try again in a minute.");
    if (err?.status === 429) return setError('Too many requests. Wait a minute and try again.');
    setSent(true);
  };

  return (
    <Screen>
      <Header title="Reset password" />
      {sent ? (
        <View className="mt-6 gap-3">
          <AppText variant="heading">Check your inbox</AppText>
          <AppText variant="label">
            If an account exists for {email.trim()}, we&apos;ve sent a link to set a new password. It expires in an hour.
          </AppText>
        </View>
      ) : (
        <View className="mt-6 gap-4">
          <AppText variant="label">Enter your account email and we&apos;ll send you a link to set a new password.</AppText>
          <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" inputMode="email" placeholder="you@example.com" onSubmitEditing={submit} />
          {error && <ErrorNote message={error} />}
          <Button title={busy ? 'Sending…' : 'Send reset link'} onPress={submit} disabled={busy} />
        </View>
      )}
    </Screen>
  );
}
