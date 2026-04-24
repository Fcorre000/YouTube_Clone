import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./navbar/navbar";
import DemoBar from "./components/DemoBar";
import { ThemeProvider } from "./context/theme";

const serif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Reel · streaming demo",
  description: "Full-stack YouTube-style streaming demo on Google Cloud.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2ede2" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${serif.variable} ${mono.variable}`}>
        <ThemeProvider>
          <DemoBar />
          <Navbar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
