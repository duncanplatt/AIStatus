import { Dashboard } from "@/components/dashboard";

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Dashboard />

      <footer className="mt-12 border-t border-card-border pt-6 text-center text-xs text-muted">
        <p>
          Data sourced from official status pages and independent API probes.
          <br />
          <a
            href="https://github.com/BoldOrion/AIStatus"
            target="_blank"
            rel="noopener noreferrer"
            className="text-status-blue hover:underline"
          >
            Open source
          </a>{" "}
          &middot; Probes run on demand, not on a schedule.
        </p>
      </footer>
    </main>
  );
}
