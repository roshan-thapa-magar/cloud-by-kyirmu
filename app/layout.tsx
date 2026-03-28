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
  title: {
    default: "Cloud by KYIRMU | Cafe & Organic Hub",
    template: "%s | Cloud by KYIRMU"
  },
  description: "Enjoy fresh coffee, organic foods, and a healthy lifestyle experience. Visit our cafe for premium organic products and specialty coffee.",
  keywords: ["cafe", "organic food", "coffee shop", "healthy lifestyle", "organic hub", "fresh coffee", "KYIRMU", "organic products"],
  authors: [{ name: "Cloud by KYIRMU", url: "https://cloud-by-kyirmu.vercel.app" }],
  creator: "Cloud by KYIRMU",
  publisher: "Cloud by KYIRMU",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "Cloud by KYIRMU | Premium Cafe & Organic Hub",
    description: "Experience the perfect blend of fresh coffee and organic foods. Your destination for healthy lifestyle choices.",
    url: "https://cloud-by-kyirmu.vercel.app",
    siteName: "Cloud by KYIRMU",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://cloud-by-kyirmu.vercel.app/og-image1.png", // PNG works perfectly
        width: 1200,
        height: 630,
        alt: "Cloud by KYIRMU - Premium Cafe & Organic Hub",
        type: "image/png", // Specify PNG type
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cloud by KYIRMU | Premium Cafe & Organic Hub",
    description: "Experience the perfect blend of fresh coffee and organic foods. Your destination for healthy lifestyle choices.",
    images: ["https://cloud-by-kyirmu.vercel.app/og-image1.png"], // PNG also works here
    creator: "@cloudbykyirmu",
    site: "@cloudbykyirmu",
  },
  alternates: {
    canonical: "https://cloud-by-kyirmu.vercel.app",
  },
  verification: {
    google: "your-google-site-verification-code",
  },
  category: "food & beverage",
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