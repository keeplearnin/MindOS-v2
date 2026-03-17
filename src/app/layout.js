import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata = {
  title: 'MindOS — 7 Habits + GTD',
  description: 'Your productivity operating system combining 7 Habits of Highly Effective People with Getting Things Done',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MindOS',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#1e293b',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
