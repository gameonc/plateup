import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy | PlateUp',
  description: 'What PlateUp collects, why, and how to get it deleted.',
};

const LAST_UPDATED = 'August 28, 2026';

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <Link href="/" className="text-sm text-orange-600 hover:underline">
          &larr; Back to PlateUp
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-stone-900">Privacy Policy</h1>
        <p className="mt-1 text-sm text-stone-500">Last updated: {LAST_UPDATED}</p>

        <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Draft pending legal review.</strong> This describes what
          PlateUp actually stores and sends to third parties, based on the
          application code. Replace the bracketed placeholders and have it
          reviewed before launch.
        </div>

        <div className="prose prose-stone mt-8 max-w-none text-sm leading-relaxed text-stone-700 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-stone-900 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-1">
          <h2>1. Who is responsible</h2>
          <p>
            PlateUp is operated by [LEGAL ENTITY NAME], [ADDRESS]. For privacy
            questions or requests, contact [CONTACT EMAIL].
          </p>

          <h2>2. What we collect</h2>
          <p>
            <strong>Account information.</strong> When you sign up we store the
            identifier from your sign-in method — typically your email address —
            together with an account ID. Authentication is handled by Firebase
            Authentication; we do not see or store your password.
          </p>
          <p>
            <strong>Content you create.</strong> Recipes you save, your cooking
            log, meal plans, and shopping lists are stored against your account.
          </p>
          <p>
            <strong>Links you submit.</strong> When you extract a recipe, we
            process the video URL you provide and the public information we
            retrieve about that video.
          </p>
          <p>
            <strong>Subscription information.</strong> If you subscribe, we store
            your plan status and the identifiers needed to manage it. Card details
            are handled by Stripe and never reach our servers.
          </p>
          <p>
            <strong>Usage counts.</strong> We record how many extractions you have
            performed in order to enforce free-tier limits.
          </p>

          <h2>3. Why we use it</h2>
          <ul>
            <li>To provide the service — saving your recipes and plans.</li>
            <li>To generate recipes from the videos you submit.</li>
            <li>To apply free-tier limits and manage paid subscriptions.</li>
            <li>To keep the service secure and to diagnose faults.</li>
          </ul>
          <p>
            We do not sell your personal information, and we do not use your saved
            recipes to advertise to you.
          </p>

          <h2>4. Who we share it with</h2>
          <p>
            We rely on service providers who process data on our behalf. Each
            receives only what it needs:
          </p>
          <ul>
            <li>
              <strong>Google Firebase</strong> — authentication and database
              storage for your account and saved content.
            </li>
            <li>
              <strong>Google Gemini</strong> — receives the video title,
              description, or the video reference so it can generate a recipe. Do
              not submit anything confidential.
            </li>
            <li>
              <strong>YouTube API Services</strong> — used to look up public
              information about the videos you submit.
            </li>
            <li>
              <strong>Stripe</strong> — payment processing and subscription
              management.
            </li>
            <li>
              <strong>Vercel</strong> — hosting and serving the application.
            </li>
          </ul>
          <p>
            We may also disclose information where we are legally required to do
            so.
          </p>

          <h2>5. YouTube API Services and Google</h2>
          <p>
            PlateUp uses YouTube API Services. Google&rsquo;s handling of data is
            described in the{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:underline"
            >
              Google Privacy Policy
            </a>
            , and use of YouTube is subject to the{' '}
            <a
              href="https://www.youtube.com/t/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:underline"
            >
              YouTube Terms of Service
            </a>
            .
          </p>
          <p>
            PlateUp does not request access to your YouTube account and cannot
            read your private YouTube data. We only look up public information
            about videos you choose to submit.
          </p>

          <h2>6. How long we keep it</h2>
          <p>
            We keep your account and saved content for as long as your account
            exists. If you delete your account, we delete your saved content,
            except where we must retain limited records — for example billing
            records kept to meet tax obligations.
          </p>

          <h2>7. Your rights</h2>
          <p>
            Depending on where you live, you may have the right to access,
            correct, export, or delete your personal information, to object to or
            restrict certain processing, and to complain to a data protection
            authority. To exercise any of these, contact [CONTACT EMAIL]. You can
            delete most of your content directly in the app at any time.
          </p>

          <h2>8. Children</h2>
          <p>
            PlateUp is not directed at children under [AGE], and we do not
            knowingly collect their personal information. If you believe a child
            has given us information, contact us and we will delete it.
          </p>

          <h2>9. International transfers</h2>
          <p>
            Our providers may process data in countries other than yours,
            including the United States. Where required, transfers rely on
            appropriate safeguards.
          </p>

          <h2>10. Security</h2>
          <p>
            We use the access controls and encryption offered by our hosting and
            database providers. No service can promise perfect security, but we
            work to protect your information and to respond quickly if something
            goes wrong.
          </p>

          <h2>11. Changes</h2>
          <p>
            We may update this policy. If a change materially affects you, we will
            give reasonable notice.
          </p>

          <h2>12. Contact</h2>
          <p>Privacy questions or requests: [CONTACT EMAIL].</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
