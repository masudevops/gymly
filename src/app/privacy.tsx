import { privacyPolicy } from '@/features/legal/content';
import { LegalPage } from '@/features/legal/legal-page';

export default function PrivacyScreen() {
  return <LegalPage doc={privacyPolicy} other={{ href: '/terms', label: 'Terms of Service' }} />;
}
