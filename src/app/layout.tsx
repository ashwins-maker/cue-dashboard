import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { AppHeader } from "@/components/app/app-header";
import { Sidebar } from "@/components/app/sidebar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cue — merchant",
  description:
    "What your shoppers keep asking, what your pages cannot answer, and whether answering helped.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <div className="flex h-dvh overflow-hidden">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <AppHeader />
            {/* The content plane sits a step above the rail and turns a large
                corner into it, which is what separates the two without a rule. */}
            <main className="flex-1 overflow-y-auto rounded-tl-3xl border-t border-l border-secondary bg-primary px-6 py-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
