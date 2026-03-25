import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — AI Status",
  description: "Privacy policy for AI Status, an independent LLM status monitoring dashboard.",
};

export default function PrivacyPolicy() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="text-sm text-muted hover:text-foreground transition-colors"
      >
        &larr; Back to dashboard
      </Link>

      <h1 className="mt-6 text-2xl font-bold">Privacy Policy</h1>
      <p className="mt-1 text-sm text-muted">Last updated: March 25, 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-base font-semibold text-foreground">
            The short version
          </h2>
          <p className="mt-2">
            AI Status does not collect personal data, use cookies, or require an
            account. We use privacy-focused analytics that cannot identify you.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">Analytics</h2>
          <p className="mt-2">
            We use{" "}
            <a
              href="https://www.cloudflare.com/web-analytics/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline decoration-card-border hover:decoration-foreground transition-colors"
            >
              Cloudflare Web Analytics
            </a>{" "}
            to understand how the site is used, and Cloudflare Real User
            Measurement (RUM) to monitor site performance. Neither uses cookies,
            collects personal data, or tracks users across sites. They collect
            aggregate metrics like page views, referrers, performance timings,
            and country-level geography. No individual visitor can be identified.
          </p>
          <p className="mt-2">
            While basic Web Analytics runs globally, the RUM performance
            monitoring script is not loaded for visitors located in the European
            Union.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">Hosting</h2>
          <p className="mt-2">
            This site is hosted on{" "}
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline decoration-card-border hover:decoration-foreground transition-colors"
            >
              Vercel
            </a>
            . When you visit, Vercel may process your IP address and basic
            request metadata (such as User-Agent) as part of normal web server
            operation. This data is subject to{" "}
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline decoration-card-border hover:decoration-foreground transition-colors"
            >
              Vercel&apos;s privacy policy
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">Cookies</h2>
          <p className="mt-2">
            AI Status does not set any cookies. A theme preference (light/dark
            mode) is stored in your browser&apos;s local storage and never
            leaves your device.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            Third-party APIs
          </h2>
          <p className="mt-2">
            The dashboard fetches data from public status page APIs (OpenAI,
            Anthropic, Google) and makes minimal API probe requests to verify
            model availability. These requests are made server-side &mdash; your
            browser never contacts these APIs directly, and no information about
            you is shared with them.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            Open source
          </h2>
          <p className="mt-2">
            This project is{" "}
            <a
              href="https://github.com/duncanplatt/AIStatus"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline decoration-card-border hover:decoration-foreground transition-colors"
            >
              open source
            </a>
            . You can inspect exactly what data is collected and how it is
            processed.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">Contact</h2>
          <p className="mt-2">
            Questions about this policy? Open an issue on{" "}
            <a
              href="https://github.com/duncanplatt/AIStatus/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline decoration-card-border hover:decoration-foreground transition-colors"
            >
              GitHub
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
