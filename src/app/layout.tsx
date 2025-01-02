import './globals.css'
import { AuthProvider } from '@/lib/auth'
import { PortfolioProvider } from '@/lib/portfolio-context'
import { ThemeProvider } from '@/lib/theme-context'

export const metadata = {
  title: 'Stock Trading Tracker',
  description: 'Track your stock trades and analyze your performance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        <ThemeProvider>
          <AuthProvider>
            <PortfolioProvider>
              {children}
            </PortfolioProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
