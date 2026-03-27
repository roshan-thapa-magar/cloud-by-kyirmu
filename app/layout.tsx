import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import { AuthModalProvider } from "@/context/auth-modal-context"
import { NextAuthProvider } from "./Providers";
import { UserProvider } from "@/context/UserContext";
import { Toaster } from "@/components/ui/sonner"
import { BagProvider } from "@/context/BagContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
export const metadata: Metadata = {
  title: "Cloud by KYIRMU | Cafe & Organic Hub",
  description: "Enjoy fresh coffee, organic foods, and a healthy lifestyle experience.",
  authors: [{ name: "Cloud by KYIRMU", url: "https://foodie-iota-topaz.vercel.app" }],
  openGraph: {
    title: "Cloud by KYIRMU | Cafe & Organic Hub",
    description: "Enjoy fresh coffee, organic foods, and a healthy lifestyle experience.",
    url: "https://foodie-iota-topaz.vercel.app",
    siteName: "Cloud by KYIRMU",
    images: [
      {
        url: "https://foodie-iota-topaz.vercel.app/og-image1.png", // Must be correct
        width: 1200,
        height: 630,
        alt: "Cloud by KYIRMU - Cafe & Organic Hub",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cloud by KYIRMU | Cafe & Organic Hub",
    description: "Enjoy fresh coffee, organic foods, and a healthy lifestyle experience.",
    images: ["https://foodie-iota-topaz.vercel.app/og-image1.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextAuthProvider>
          <AuthModalProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <UserProvider>
                <BagProvider>
                  {children}
                  <Toaster position="top-center" />
                </BagProvider>
              </UserProvider>
            </ThemeProvider>
          </AuthModalProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
