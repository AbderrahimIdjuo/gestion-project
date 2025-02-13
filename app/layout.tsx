import { Inter } from "next/font/google";
import "./globals.css";
import RootLayout from "./rootLayout";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <body className={`${inter.className} flex flex-col h-full`}>
        <RootLayout>{children}</RootLayout>
      </body>
    </html>
  );
}
