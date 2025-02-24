import "./globals.css";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { MainNav } from "@/components/MainNav";
import { SessionProvider } from "@/components/SessionProvider";
import type { ReactNode } from "react";

const META_THEME_COLORS = {
  light: "#ffffff",
  dark: "#09090b",
};

export const viewport: Viewport = {
  themeColor: META_THEME_COLORS.light,
};

export const metadata: Metadata = {
  title: "Friend Finder",
  description: "Garmin Friend Finder",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || ((!('theme' in localStorage) || localStorage.theme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.querySelector('meta[name="theme-color"]').setAttribute('content', '${META_THEME_COLORS.dark}')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="bg-background">
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <div className="min-h-svh flex flex-col">
              <header className="border-b">
                <div className="container mx-auto px-4 h-12">
                  <MainNav />
                </div>
              </header>
              <main className="flex-1">{children}</main>
            </div>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
