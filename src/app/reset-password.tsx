import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ErrorNote, Field } from '@/components/form';
import { AppText, Button, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { supabase } from '@/lib/supabase';

/** Opened from the password-reset email; the link signs the user in with a short-lived recovery session. */
export default function ResetPasswordScreen() {
  const { session, ready } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setError(null);
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirmPw) return setError("Passwords don't match.");
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) return setError(err.message);
    setDone(true);
  };

  if (ready && !session) {
    return (
      <Screen className="flex-1 justify-center gap-4">
        <AppText variant="title">Link expired</AppText>
        <AppText variant="label">This reset link is invalid or has expired. Request a new one from the sign-in screen.</AppText>
        <Button title="Back to sign in" variant="secondary" onPress={() => router.replace('/forgot-password')} />
      </Screen>
    );
  }

  return (
    <Screen className="flex-1 justify-center">
      {done ? (
        <View className="gap-4">
          <AppText variant="title">Password updated</AppText>
          <AppText variant="label">You&apos;re signed in with your new password.</AppText>
          <Button title="Continue" onPress={() => router.replace('/')} />
        </View>
      ) : (
        <View className="gap-4">
          <AppText variant="title">Set a new password</AppText>
          <Field label="New password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" placeholder="At least 8 characters" />
          <Field label="Confirm password" value={confirmPw} onChangeText={setConfirmPw} secureTextEntry autoComplete="new-password" placeholder="Repeat it" onSubmitEditing={submit} />
          {error && <ErrorNote message={error} />}
          <Button title={busy ? 'Saving…' : 'Update password'} onPress={submit} disabled={busy} />
        </View>
      )}
    </Screen>
  );
}
