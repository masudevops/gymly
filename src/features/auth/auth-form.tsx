import * as Linking from 'expo-linking';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { BrandMark } from '@/components/brand-mark';
import { ErrorNote, Field, Header } from '@/components/form';
import { AppText, Button, Screen } from '@/components/ui';
import { DailyQuote } from '@/features/motivation/daily-quote';
import { supabase } from '@/lib/supabase';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const isSignUp = mode === 'sign-up';

  const submit = async () => {
    setError(null);
    setNotice(null);
    if (!EMAIL_RE.test(email.trim())) return setError('Enter a valid email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    setBusy(true);
    const creds = { email: email.trim().toLowerCase(), password };
    // Confirmation links return to the site/app the user signed up from (must be in Supabase's Redirect URLs allow-list).
    const emailRedirectTo = Platform.OS === 'web' ? window.location.origin : Linking.createURL('/');
    const { data, error: err } = isSignUp
      ? await supabase.auth.signUp({ ...creds, options: { emailRedirectTo } })
      : await supabase.auth.signInWithPassword(creds);
    setBusy(false);
    if (err) return setError(err.message);
    // With email confirmation on (hosted projects), sign-up returns no session until the link is clicked.
    if (isSignUp && !data.session) setNotice('Check your inbox to confirm your email, then sign in.');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-ink">
      <Screen className="flex-1">
        <Header onBack={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))} />
        <View className="flex-1 justify-center">
        <View className="mb-10 items-center gap-3">
          <BrandMark size={64} />
          <AppText variant="display">Gymly</AppText>
          <AppText variant="label">{isSignUp ? 'Create your account' : 'Welcome back'}</AppText>
          <DailyQuote context={isSignUp ? 'sign-up' : 'sign-in'} className="mt-1 text-center" />
        </View>

        <View className="gap-4">
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            inputMode="email"
            placeholder="you@example.com"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            placeholder="At least 8 characters"
            onSubmitEditing={submit}
          />
          {!isSignUp && (
            <Link href="/forgot-password" className="self-end">
              <AppText variant="label" className="text-volt">Forgot password?</AppText>
            </Link>
          )}
          {error && <ErrorNote message={error} />}
          {notice && <AppText variant="label" className="text-success">{notice}</AppText>}
          <Button title={busy ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'} onPress={submit} disabled={busy} className="mt-2" />
        </View>

        <View className="mt-8 flex-row justify-center gap-1">
          <AppText variant="label">{isSignUp ? 'Already have an account?' : 'New to Gymly?'}</AppText>
          <Link href={isSignUp ? '/sign-in' : '/sign-up'} replace>
            <AppText variant="label" className="font-semibold text-volt">
              {isSignUp ? 'Sign in' : 'Create an account'}
            </AppText>
          </Link>
        </View>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
