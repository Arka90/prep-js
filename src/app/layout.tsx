import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "PrepJS - JavaScript Interview Quiz App",
  description: "AI-powered JavaScript interview preparation with quizzes, progress tracking, and detailed analytics",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1F2937',
                color: '#F9FAFB',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
