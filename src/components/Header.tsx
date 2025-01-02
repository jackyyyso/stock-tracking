import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme-context'
import { useState } from 'react'

type HeaderProps = {
  activeTab: 'dashboard' | 'stock-analysis'
  onTabChange: (tab: 'dashboard' | 'stock-analysis') => void
}

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="border-b transition-colors border-border bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-foreground">Trading Dashboard</h1>
            
            {/* Desktop Navigation */}
            {user && (
              <nav className="hidden md:flex space-x-8">
                <button
                  onClick={() => onTabChange('dashboard')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'dashboard'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  Trading Dashboard
                </button>
                <button
                  onClick={() => onTabChange('stock-analysis')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'stock-analysis'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  Stock Analysis
                </button>
              </nav>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {user ? (
              <>
                <div className="hidden sm:block text-muted-foreground">
                  Hello, <span className="text-primary">{user.email?.split('@')[0]}</span>
                </div>
                <button
                  onClick={signOut}
                  className="text-sm px-3 py-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                >
                  Sign Out
                </button>
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                  </svg>
                </button>
              </>
            ) : (
              <button
                onClick={() => window.location.href = '/auth/signin'}
                className="text-sm px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {user && isMenuOpen && (
          <nav className="md:hidden pt-4 pb-2 space-y-2">
            <button
              onClick={() => {
                onTabChange('dashboard')
                setIsMenuOpen(false)
              }}
              className={`block w-full text-left py-2 px-1 border-l-4 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              Trading Dashboard
            </button>
            <button
              onClick={() => {
                onTabChange('stock-analysis')
                setIsMenuOpen(false)
              }}
              className={`block w-full text-left py-2 px-1 border-l-4 font-medium text-sm ${
                activeTab === 'stock-analysis'
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              Stock Analysis
            </button>
          </nav>
        )}
      </div>
    </header>
  )
} 