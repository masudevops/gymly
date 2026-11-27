import { TriangleAlert } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { ErrorNote, Field, Header } from '@/components/form';
import { AppText, Button, Card, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { deleteAccount } from '@/features/profile/api';
import { confirm } from '@/lib/confirm';
import { colors } from '@/theme/tokens';

const PHRASE = 'DELETE';

/** Account management: permanent deletion behind a typed phrase and a final confirmation. */
export default function AccountScreen() {
  const { session } = useAuth();
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const armed = typed.trim() === PHRASE;

  const onDelete = async () => {
    if (!armed || !session) return;
    const ok = await confirm('Delete your account?', 'Last chance: this permanently deletes everything and cannot be undone.', 'Delete forever', true);
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      // Signing out at the end swaps the app to the landing page.
      await deleteAccount(session.user.id);
    } catch {
      setError("Couldn't delete your account. Check your connection and try again.");
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title="Account management" />

      <View className="mt-2 gap-1">
        <AppText variant="label">Signed in as</AppText>
        <AppText variant="body">{session?.user.email}</AppText>
      </View>

      <Card className="mt-6 gap-4 border-danger/40">
        <View className="flex-row items-center gap-3">
          <TriangleAlert color={colors.danger} size={22} />
          <AppText variant="heading">Delete account</AppText>
        </View>
        <AppText variant="body" className="text-muted">
          This permanently deletes your account and everything in it: your workout history, templates, custom exercises,
          programs, progress, body weight log, profile photo and personal data. It can&apos;t be undone.
        </AppText>
        <AppText variant="body" className="text-muted">
          Want a copy first? Use Export data on the Profile tab (web) before you delete.
        </AppText>
        <Field
          label={`Type ${PHRASE} to confirm`}
          value={typed}
          onChangeText={setTyped}
          placeholder={PHRASE}
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          editable={!busy}
        />
        {error && <ErrorNote message={error} />}
        <Button title={busy ? 'Deleting…' : 'Delete my account'} variant="danger" disabled={!armed || busy} onPress={onDelete} />
      </Card>
    </Screen>
  );
}
