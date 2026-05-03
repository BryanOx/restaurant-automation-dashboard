import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Restaurant Bot",
  description: "Automatiza tu restaurant con WhatsApp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full bg-gray-50">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}