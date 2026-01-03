import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Datafluent · AI Consulting',
  description: 'AI Consulting by Ex-FAANG Engineers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}