import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "English OS",
  description: "Personal English Learning Operating System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#0a0616] min-h-screen text-gray-100">
        {children}
      </body>
    </html>
  );
}