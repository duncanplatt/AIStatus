import { Dashboard } from "@/components/dashboard";
import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Dashboard />

      <footer className="mt-2 pt-6 pb-12 sm:pb-6 text-xs text-muted/80">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5 text-center sm:text-left">
            <p className="font-medium text-foreground">AI Status</p>
            <p>Independent LLM status monitoring</p>
            <p className="flex items-center justify-center sm:justify-start gap-1.5">
              <a
                href="https://github.com/duncanplatt/AIStatus/blob/main/LICENSE.md"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                MIT License
              </a>
              <span className="text-card-border">&middot;</span>
              <Link
                href="/privacy"
                className="hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
            </p>
          </div>

          <div className="space-y-1.5 text-center sm:text-right">
            <p className="flex items-center justify-center gap-2 sm:justify-end">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-3.5 w-3.5"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <a
                href="https://github.com/duncanplatt/AIStatus"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Repo
              </a>
              <span className="text-card-border">|</span>
              <a
                href="https://github.com/duncanplatt"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Duncan Platt
              </a>
            </p>
            <p className="flex items-center justify-center gap-1 sm:justify-end flex-wrap">
              <span>Every check is a real API call &mdash;</span>
              <a
                href="https://github.com/sponsors/duncanplatt"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-status-blue hover:underline"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-3 w-3"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                sponsor this project
              </a>
              <span>to help cover token costs</span>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
