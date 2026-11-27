import { termsOfService } from '@/features/legal/content';
import { LegalPage } from '@/features/legal/legal-page';

export default function TermsScreen() {
  return <LegalPage doc={termsOfService} other={{ href: '/privacy', label: 'Privacy Policy' }} />;
}
