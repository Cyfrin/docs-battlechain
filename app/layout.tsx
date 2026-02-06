import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ProductThemeProvider } from "@/components/theme/ProductThemeProvider";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { TableOfContents } from "@/components/layout/TableOfContents";

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
  title: "Cyfrin Docs",
  description: "Complete platform for Web3 security researchers, developers, and learners",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
            <div className="flex min-h-screen flex-col">
              <Header />
              <div className="flex flex-1">
                <Sidebar />
                <main className="flex-1 overflow-auto">
                  <div className="mx-auto px-4 py-8 max-w-7xl flex gap-8">
                    <div className="flex-1 max-w-4xl">
                      {children}
                    </div>
                    <TableOfContents />
                  </div>
                </main>
              </div>
              <Footer />
            </div>
          </ProductThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
