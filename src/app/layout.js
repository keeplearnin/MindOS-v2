import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata = {
  title: 'MindOS — 7 Habits + GTD',
  description: 'Your productivity operating system combining 7 Habits of Highly Effective People with Getting Things Done',
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
