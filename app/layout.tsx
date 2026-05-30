import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Halyk Pro',
  description: 'Верифицированные юристы и бухгалтеры — в вашем банке',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#00A651',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head />
      <body>
        <div className="phone-frame">
          {children}
        </div>
      </body>
    </html>
  );
}
