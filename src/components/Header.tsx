import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme-context'

export default function Header() {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="border-b transition-colors dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold dark:text-white text-gray-900">Trading Dashboard</h1>
        
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md dark:text-gray-300 dark:hover:text-white text-gray-600 hover:text-gray-900 dark:hover:bg-gray-700 hover:bg-gray-100 transition-colors"
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
              <div className="dark:text-gray-300 text-gray-600">
                Hello, <span className="dark:text-indigo-400 text-indigo-600">{user.email?.split('@')[0]}</span>
              </div>
              <button
                onClick={signOut}
                className="text-sm px-3 py-1 dark:text-gray-300 text-gray-600 dark:hover:text-white hover:text-gray-900 dark:hover:bg-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={() => window.location.href = '/auth/signin'}
              className="text-sm px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  )
} 