// Privacy Policy and Terms of Service text. Keep it accurate to what the app actually does: when data
// handling changes (new provider, analytics, payments), update these and the effective date together.
import { SUPPORT_EMAIL } from '@/lib/site';

export type LegalSection = { heading: string; paragraphs?: string[]; bullets?: string[] };
export type LegalDocument = { title: string; effective: string; intro: string; sections: LegalSection[] };

const EFFECTIVE = 'November 27, 2026';

export const privacyPolicy: LegalDocument = {
  title: 'Privacy Policy',
  effective: EFFECTIVE,
  intro:
    'Gymly ("we", "us") is a workout tracker. This policy explains what information we collect when you use Gymly, why we collect it, and the choices you have. We keep it short because we collect only what the app needs to work.',
  sections: [
    {
      heading: 'Information you give us',
      bullets: [
        'Account details: your email address and password. Passwords are stored only as a secure hash by our authentication provider; we never see them.',
        'Profile details: an optional display name and profile photo, and your onboarding answers (training goal, experience level, training days per week and preferred units).',
        'Training data: the workouts, exercises, sets, weights, reps, rest times, templates, programs, personal records and body-weight entries you log.',
      ],
    },
    {
      heading: 'Information collected automatically',
      paragraphs: [
        'Our hosting provider keeps standard server logs (such as IP address, browser type and the time of a request) to deliver the site and keep it secure. Gymly stores your sign-in session and any workout in progress on your device so the app works offline and you stay signed in.',
        "We don't use advertising, analytics or tracking cookies, and we don't track you across other websites or apps.",
      ],
    },
    {
      heading: 'How we use your information',
      bullets: [
        'To create and secure your account, and to send account emails such as email confirmation and password reset.',
        'To store your training data and show you your history, progress, statistics and programs.',
        'To keep Gymly reliable and secure, and to respond when you contact us.',
      ],
      paragraphs: ["We don't sell your personal information, and we don't share it for advertising."],
    },
    {
      heading: 'Fitness information',
      paragraphs: [
        'Workout and body-weight data can be considered health-related. We use it only to provide Gymly to you. It is private to your account and is never shared with other users or third parties, except the service providers below that store it on our behalf.',
      ],
    },
    {
      heading: 'Service providers',
      paragraphs: [
        'We rely on a small number of providers who process data only to run Gymly: Supabase (database, authentication, file storage for profile photos and account emails) and Vercel (website hosting). They are bound by their own security and privacy commitments. Your data may be processed in countries other than your own.',
      ],
    },
    {
      heading: 'Your choices and rights',
      bullets: [
        'Access and export: download every set you have logged as a CSV file from Profile > Export data (web app).',
        'Correct: update your name, photo and preferences at any time in Profile.',
        'Delete: permanently delete your account and all associated data, including workouts and photos, from Profile > Account management.',
        `Anything else: email us at ${SUPPORT_EMAIL} and we'll help. Depending on where you live, you may have additional rights under local law; we'll honor them.`,
      ],
    },
    {
      heading: 'Retention and security',
      paragraphs: [
        'We keep your data for as long as your account exists. When you delete your account, your data is removed from our active systems. Data is encrypted in transit (HTTPS), and database access rules ensure each account can only read its own data. No system is perfectly secure, but we work to protect your information.',
      ],
    },
    {
      heading: 'Children',
      paragraphs: [
        "Gymly isn't intended for children under 13 (or the minimum age required in your country), and we don't knowingly collect their information. If you believe a child has created an account, contact us and we'll delete it.",
      ],
    },
    {
      heading: 'Changes to this policy',
      paragraphs: [
        "If we change this policy, we'll update the effective date above. For significant changes, we'll let you know in the app or by email before they take effect.",
      ],
    },
    {
      heading: 'Contact',
      paragraphs: [`Questions about privacy? Email ${SUPPORT_EMAIL}.`],
    },
  ],
};

export const termsOfService: LegalDocument = {
  title: 'Terms of Service',
  effective: EFFECTIVE,
  intro:
    'These terms apply when you use Gymly, the website and app at this address. By creating an account or using Gymly, you agree to them. If you don\'t agree, please don\'t use Gymly.',
  sections: [
    {
      heading: 'Health and safety',
      paragraphs: [
        "Gymly provides tools for logging workouts and following training programs. It is not medical advice. Talk to a doctor before starting a new exercise program, especially if you have an injury or health condition. Exercise carries a risk of injury; train within your abilities, use good form and stop if something hurts. You're responsible for how you train.",
      ],
    },
    {
      heading: 'Your account',
      bullets: [
        "You must be at least 13 years old (or the minimum age in your country) to use Gymly.",
        'Keep your login details secure; you are responsible for activity on your account.',
        'Give accurate information when you sign up, and tell us if you think your account has been compromised.',
      ],
    },
    {
      heading: 'Your data',
      paragraphs: [
        'You own the workouts, programs, photos and other content you add to Gymly. You give us permission to store, process and display that content only as needed to provide the service to you. You can export or delete it at any time, as described in our Privacy Policy.',
      ],
    },
    {
      heading: 'Acceptable use',
      bullets: [
        "Don't try to access other people's accounts or data, or interfere with Gymly's security or operation.",
        "Don't upload content that is illegal or that you don't have the right to share.",
        "Don't use automated means to scrape, overload or reverse-engineer the service.",
      ],
    },
    {
      heading: 'Programs and content',
      paragraphs: [
        "Gymly's built-in training programs, exercise guides and tips are general information, not personalized coaching. Results vary from person to person, and no program is right for everyone. Adjust or stop any program that doesn't suit you.",
      ],
    },
    {
      heading: 'Price and changes to the service',
      paragraphs: [
        "Gymly is currently free. We may add, change or remove features, and may introduce optional paid features in the future; we'll tell you before anything you use starts costing money. We may also suspend or discontinue the service, and will try to give notice so you can export your data.",
      ],
    },
    {
      heading: 'Ending your use',
      paragraphs: [
        'You can stop using Gymly and delete your account at any time. We may suspend or close accounts that break these terms or put the service or other users at risk.',
      ],
    },
    {
      heading: 'Disclaimers and liability',
      paragraphs: [
        'Gymly is provided "as is" and "as available", without warranties of any kind, to the fullest extent permitted by law. We don\'t guarantee that the service will be uninterrupted or error-free, or that data will never be lost, so keep your own export if your history matters to you.',
        'To the fullest extent permitted by law, we are not liable for indirect, incidental or consequential damages, or for injuries resulting from exercise, arising from your use of Gymly. Nothing in these terms limits rights you have under consumer protection laws that cannot be waived.',
      ],
    },
    {
      heading: 'Changes to these terms',
      paragraphs: [
        "We may update these terms. We'll change the effective date above and, for significant changes, let you know in the app or by email. Continuing to use Gymly after changes take effect means you accept them.",
      ],
    },
    {
      heading: 'Contact',
      paragraphs: [`Questions about these terms? Email ${SUPPORT_EMAIL}.`],
    },
  ],
};
