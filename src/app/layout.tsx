import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "サ活調整くん - サウナオフ会の日程調整",
  description: "サウナ好きのためのオフ会日程調整ツール。候補日の調整と施設の投票がこれひとつで。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gradient-to-b from-sky-50 to-blue-100`}
      >
        <header className="border-b border-sky-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-2xl">♨</span>
              <span className="text-xl font-bold text-sky-900">サ活調整くん</span>
            </a>
            <span className="text-sm text-sky-600">サウナオフ会の日程調整</span>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-sky-200 bg-white/50 mt-12">
          <div className="max-w-3xl mx-auto px-4 py-6 text-center text-sm text-sky-600">
            サ活調整くん - サウナ好きのための日程調整ツール
          </div>
        </footer>
      </body>
    </html>
  );
}
