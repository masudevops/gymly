import { Link } from 'expo-router';
import { View } from 'react-native';

import { Header } from '@/components/form';
import { AppText, Screen } from '@/components/ui';
import { SUPPORT_EMAIL } from '@/lib/site';

import type { LegalDocument } from './content';

/** Public, readable legal page. Works signed in or out; Back falls back to the landing page or Train. */
export function LegalPage({ doc, other }: { doc: LegalDocument; other: { href: '/privacy' | '/terms'; label: string } }) {
  return (
    <Screen>
      <Header />
      <AppText variant="display" accessibilityRole="header">{doc.title}</AppText>
      <AppText variant="caption" className="mt-2">Effective {doc.effective}</AppText>
      <AppText variant="body" className="mt-5 text-muted">{doc.intro}</AppText>

      {doc.sections.map((s) => (
        <View key={s.heading} className="mt-7 gap-2">
          <AppText variant="heading" accessibilityRole="header">{s.heading}</AppText>
          {s.paragraphs?.map((p) => <AppText key={p} variant="body" className="text-muted">{p}</AppText>)}
          {s.bullets?.map((b) => (
            <View key={b} className="flex-row gap-2.5 pl-1">
              <AppText variant="body" className="text-volt">•</AppText>
              <AppText variant="body" className="flex-1 text-muted">{b}</AppText>
            </View>
          ))}
        </View>
      ))}

      <View className="mt-10 flex-row flex-wrap gap-x-6 gap-y-2 border-t border-line pt-6">
        <Link href={other.href}>
          <AppText variant="label" className="text-volt">{other.label}</AppText>
        </Link>
        <Link href={`mailto:${SUPPORT_EMAIL}`}>
          <AppText variant="label" className="text-volt">{SUPPORT_EMAIL}</AppText>
        </Link>
      </View>
    </Screen>
  );
}
