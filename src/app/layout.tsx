import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/lib/auth'
import { PortfolioProvider } from '@/lib/portfolio-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Stock Trading Tracker',
  description: 'A modern day trading tracking application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <PortfolioProvider>
            <main className="min-h-screen bg-background">
              {children}
            </main>
          </PortfolioProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
