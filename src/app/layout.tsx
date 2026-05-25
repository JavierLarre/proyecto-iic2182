import type { Metadata } from "next";
import { Noto_Sans, DM_Sans } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Licitapp",
  description: "Inteligencia territorial para el mercado público chileno",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${notoSans.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="h-full">
        {children}
      </body>
    </html>
  );
}
