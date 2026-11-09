import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { RouteGuard } from "../components/auth/RouteGuard";

export const metadata: Metadata = {
  title: "SkillBarter-Next | Peer-to-Peer Skill Exchange",
  description: "Exchange skills fairly without money. Learn what you need by teaching what you know.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full bg-slate-50 text-slate-900 antialiased">
      <body className="flex min-h-full flex-col pb-16 font-sans lg:pb-0">
        <AuthProvider>
          <Navbar />
          <div className="flex-1"><RouteGuard>{children}</RouteGuard></div>
          <Footer />
          <MobileBottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
