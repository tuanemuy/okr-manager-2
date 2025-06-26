import type { Metadata } from "next";
import "@/styles/index.css";
import { Header } from "@/components/navigation/Header";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "OKR Manager",
  description: "チームとの目標管理を効率化",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const _isAuthPage = false; // Will be determined by checking the current path

  return (
    <html lang="ja">
      <body>
        {user && <Header />}
        <main className={user ? "pt-0" : ""}>{children}</main>
      </body>
    </html>
  );
}
