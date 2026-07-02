import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css'; // Global styles
import { AppProvider } from '@/context/AppContext';
import ToastContainer from '@/components/ToastContainer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'BuddyCraft Store - Premium Minecraft Server Store',
  description: 'Buy premium Server Ranks (Noble, Prime, God, Deadliest, Legend), Galaxy & Universe Crate Keys, and Coin Packages for BuddyCraft!',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning className="bg-[#100b08] text-slate-100 font-sans min-h-screen selection:bg-orange-600 selection:text-white">
        <AppProvider>
          {children}
          <ToastContainer />
        </AppProvider>
      </body>
    </html>
  );
}
