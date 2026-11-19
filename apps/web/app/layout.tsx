import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { AppPreferences } from "@/components/app-preferences";

export const metadata: Metadata = {
  title: "Mangystau CV — работа и резюме в Мангистау",
  description: "Создайте резюме и найдите работу в Актау, Жанаозене и по всей Мангистауской области.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-[#f8f9f6] text-[#12231c] antialiased">
        <AppPreferences>
          <Navbar />
          <div className="min-h-[calc(100vh-72px)]">{children}</div>
        </AppPreferences>
      </body>
    </html>
  );
}
