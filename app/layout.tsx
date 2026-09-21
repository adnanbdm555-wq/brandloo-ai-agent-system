import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AdPulse AI — Social Media Operations",
  description:
    "Manage brands, campaigns, AI-generated content, and publishing from one place.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
