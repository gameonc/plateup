import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service | PlateUp',
  description: 'The terms that govern your use of PlateUp.',
};

const LAST_UPDATED = 'August 28, 2026';

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <Link href="/" className="text-sm text-orange-600 hover:underline">
          &larr; Back to PlateUp
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-stone-900">Terms of Service</h1>
        <p className="mt-1 text-sm text-stone-500">Last updated: {LAST_UPDATED}</p>

        <div className="prose prose-stone mt-8 max-w-none text-sm leading-relaxed text-stone-700 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-stone-900 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-1">
          <h2>1. Who we are</h2>
          <p>
            PlateUp (&ldquo;PlateUp&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is operated by
            PlateUp Inc., 548 Market St, Suite 35000, San Francisco, CA 94104. You can reach us at support@plateup.app.
            By creating an account or using PlateUp, you agree to these terms. If
            you do not agree, please do not use the service.
          </p>

          <h2>2. What PlateUp does</h2>
          <p>
            PlateUp helps you collect and organise recipes. It reads publicly
            available information about cooking videos — such as the title and
            description — and uses AI to turn that into a structured recipe. It
            also lets you save recipes, plan meals, and build shopping lists.
          </p>
          <p>
            PlateUp is a convenience tool, not a culinary or nutritional
            authority. You are responsible for judging whether a recipe is safe
            and suitable for you.
          </p>

          <h2>3. AI-generated content and accuracy</h2>
          <p>
            Recipes, ingredient quantities, cooking times, and dietary tags on
            PlateUp are produced automatically by AI models and by automated
            keyword matching. They are frequently approximate and can be wrong.
            In particular:
          </p>
          <ul>
            <li>
              Ingredients or steps may be missing, invented, or misattributed.
            </li>
            <li>
              Dietary tags such as &ldquo;nut-free&rdquo;, &ldquo;gluten-free&rdquo;, or
              &ldquo;vegan&rdquo; are generated automatically and are not verified
              by a human or a nutritionist.
            </li>
            <li>
              Cooking times and temperatures may not be safe for the food you are
              preparing.
            </li>
          </ul>
          <p>
            <strong>
              Do not rely on PlateUp for allergy, medical, dietary, or food-safety
              decisions.
            </strong>{' '}
            If you have a food allergy or intolerance, verify every ingredient
            against the original source and the product packaging. If you have a
            medical condition, consult a qualified professional.
          </p>

          <h2>4. Third-party content and creators</h2>
          <p>
            Recipes are derived from videos published by third parties. PlateUp is
            not affiliated with, endorsed by, or sponsored by any video creator,
            YouTube, or Google. Rights in the underlying videos and their
            descriptions remain with their owners.
          </p>
          <p>
            Lists of ingredients and functional cooking steps are generally not
            protected by copyright, but surrounding creative expression may be.
            PlateUp is intended for personal use. Do not use it to republish
            creators&rsquo; work.
          </p>
          <p>
            If you are a rights holder and believe content on PlateUp infringes
            your rights, contact us at support@plateup.app and we will review it.
          </p>

          <h2>5. YouTube API Services</h2>
          <p>
            PlateUp uses YouTube API Services. By using PlateUp you also agree to
            the{' '}
            <a
              href="https://www.youtube.com/t/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:underline"
            >
              YouTube Terms of Service
            </a>
            . Information about how Google handles data is described in the{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:underline"
            >
              Google Privacy Policy
            </a>
            .
          </p>

          <h2>6. Your account</h2>
          <p>
            You are responsible for keeping your login credentials secure and for
            activity that happens under your account. You must be old enough to
            form a binding contract where you live. Do not use PlateUp to break
            the law, to abuse the service, or to attempt to circumvent usage
            limits.
          </p>

          <h2>7. Free and paid plans</h2>
          <p>
            PlateUp offers a free tier with usage limits and a paid subscription
            (&ldquo;Pro&rdquo;) that raises or removes them. Current features and
            prices are shown on our{' '}
            <Link href="/pricing" className="text-orange-600 hover:underline">
              pricing page
            </Link>
            .
          </p>
          <ul>
            <li>
              Subscriptions renew automatically each billing period until you
              cancel.
            </li>
            <li>
              You can cancel at any time from your account settings. Cancellation
              takes effect at the end of the current billing period, and you keep
              Pro access until then.
            </li>
            <li>
              Payments are processed by Stripe. We do not store your full card
              details.
            </li>
            <li>
              Refunds: You may request a refund within 14 days of your initial subscription purchase by contacting support@plateup.app. Subsequent renewal charges are non-refundable, but you will retain access through the end of your prepaid billing period.
            </li>
            <li>
              We may change prices with reasonable advance notice. Changes will
              not affect the period you have already paid for.
            </li>
          </ul>

          <h2>8. Affiliate links</h2>
          <p>
            Some links to grocery retailers are affiliate links, including through
            the Amazon Associates Program. If you buy through them we may earn a
            commission at no additional cost to you. This never changes the price
            you pay, and it does not influence which recipes we show you.
          </p>

          <h2>9. Service availability</h2>
          <p>
            PlateUp depends on third-party services, including AI providers and
            YouTube. Those services can change, rate-limit us, or become
            unavailable, and features may stop working as a result. We provide
            PlateUp on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis, without
            warranties of any kind, to the fullest extent permitted by law.
          </p>

          <h2>10. Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, PlateUp and its operators are
            not liable for indirect, incidental, or consequential damages, or for
            loss of data or profits, arising from your use of the service. Nothing
            in these terms limits liability that cannot lawfully be limited —
            including liability for death or personal injury caused by
            negligence, or for fraud.
          </p>

          <h2>11. Ending your use</h2>
          <p>
            You may stop using PlateUp and delete your account at any time. We may
            suspend or terminate accounts that breach these terms or that put the
            service or other users at risk.
          </p>

          <h2>12. Changes to these terms</h2>
          <p>
            We may update these terms. If a change is significant we will give
            reasonable notice. Continuing to use PlateUp after a change means you
            accept the updated terms.
          </p>

          <h2>13. Governing law</h2>
          <p>
            These terms are governed by the laws of the State of California, United States, and disputes
            will be handled by the courts of San Francisco County, California, except where
            mandatory local consumer law gives you other rights.
          </p>

          <h2>14. Contact</h2>
          <p>Questions about these terms: support@plateup.app.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
