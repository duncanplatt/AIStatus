import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://aistatus.net"),
  title: "AI Status — LLM Provider Dashboard",
  description:
    "Real-time status and latency monitoring for OpenAI, Anthropic, and Google AI models.",
  openGraph: {
    title: "AI Status",
    description:
      "Real-time status and latency monitoring for major LLM providers.",
    url: "https://aistatus.net",
    siteName: "AI Status",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "AI Status" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Status",
    description:
      "Real-time status and latency monitoring for major LLM providers.",
    images: ["/og.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "AI Status",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground selection:bg-muted/30">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
