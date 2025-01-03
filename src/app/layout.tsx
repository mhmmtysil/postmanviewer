import type { Metadata } from 'next';
import '../app/styles/style.css';

export const metadata: Metadata = {
  title: 'Postman API Viewer',
  description: 'Postman API Viewer',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}
