import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Press_Start_2P, Nunito } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pixelFont = Press_Start_2P({
  variable: "--font-pixel",
  weight: "400",
  subsets: ["latin"],
});

const bodyFont = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VidyaSaathi: The Knowledge Quest",
  description:
    "Learn Class 9 Social Science by battling alien monsters and the Shadow Dragon in an original side-scrolling adventure — powered by 1400 textbook questions.",
  keywords: ["VidyaSaathi", "educational game", "Class 9", "SST", "platformer", "quiz game"],
  authors: [{ name: "VidyaSaathi" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pixelFont.variable} ${bodyFont.variable} antialiased bg-background text-foreground`}
        style={{ fontFamily: "var(--font-nunito), var(--font-geist-sans), system-ui, sans-serif" }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
