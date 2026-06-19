import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ProductThemeProvider } from "@/components/theme/ProductThemeProvider";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { ContentLayout } from "@/components/layout/ContentLayout";
import { SubNavbar } from "@/components/layout/SubNavbar";
import { NetworkProvider } from "@/components/mdx/NetworkTabs";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "BattleChain Docs",
  description: "BattleChain is a pre-mainnet L2 where protocols deploy contracts under Safe Harbor and whitehats legally attack them for bounties.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "BattleChain Docs",
    description: "BattleChain is a pre-mainnet L2 where protocols deploy contracts under Safe Harbor and whitehats legally attack them for bounties.",
    url: "https://docs.battlechain.com",
    siteName: "BattleChain Docs",
    images: [
      {
        url: "https://docs.battlechain.com/images/og.png",
        width: 1800,
        height: 945,
        alt: "BattleChain Docs",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BattleChain Docs",
    description: "BattleChain is a pre-mainnet L2 where protocols deploy contracts under Safe Harbor and whitehats legally attack them for bounties.",
    images: ["https://docs.battlechain.com/images/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="llms-txt" type="text/plain" href="/llms.txt" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Resolve the Mainnet/Testnet network before first paint so
              // network-specific content renders correctly with no flash.
              // Precedence: URL ?network= > localStorage > cookie > default.
              (function() {
                try {
                  var KEY = 'battlechain-docs-network';
                  var url = new URL(location.href);
                  var q = (url.searchParams.get('network') || '').toLowerCase();
                  var ls = localStorage.getItem(KEY);
                  var ckMatch = document.cookie.match(/(?:^|; )battlechain-docs-network=([^;]+)/);
                  var ck = ckMatch ? ckMatch[1] : null;
                  var n = (q || ls || ck || 'mainnet').toLowerCase();
                  if (n !== 'testnet' && n !== 'mainnet') n = 'mainnet';
                  document.documentElement.dataset.network = n;
                  // A shared ?network= link becomes the sticky preference.
                  if (q === 'testnet' || q === 'mainnet') {
                    localStorage.setItem(KEY, n);
                    document.cookie = KEY + '=' + n + ';path=/;max-age=31536000;samesite=lax';
                  }
                } catch (e) {
                  document.documentElement.dataset.network = 'mainnet';
                }
              })();
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Aggressive error suppression for crypto wallet extensions
              (function() {
                const originalError = console.error;
                console.error = function(...args) {
                  if (args[0] && typeof args[0] === 'string' &&
                      (args[0].includes('SES') || args[0].includes('lockdown'))) {
                    return;
                  }
                  originalError.apply(console, args);
                };

                window.addEventListener('error', function(e) {
                  if (e.message && (e.message.includes('SES') ||
                      e.message.includes('lockdown') ||
                      e.message.includes('literal not terminated'))) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    return true;
                  }
                }, true);

                window.addEventListener('unhandledrejection', function(e) {
                  if (e.reason && e.reason.message &&
                      (e.reason.message.includes('SES') ||
                       e.reason.message.includes('lockdown'))) {
                    e.preventDefault();
                    return true;
                  }
                });
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <ProductThemeProvider>
            <NetworkProvider>
              <div className="flex min-h-screen flex-col">
                <Header />
                <SubNavbar />
                <div className="flex flex-1">
                  <Sidebar />
                  <main className="flex-1 overflow-auto min-w-0">
                    <ContentLayout>{children}</ContentLayout>
                  </main>
                </div>
                <Footer />
              </div>
            </NetworkProvider>
          </ProductThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
