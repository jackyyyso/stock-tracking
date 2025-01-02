import { useAuth } from '@/lib/auth'

export default function Header() {
  const { user, signOut } = useAuth()

  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Trading Dashboard</h1>
        
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="text-gray-300">
                Hello, <span className="text-indigo-400">{user.email?.split('@')[0]}</span>
              </div>
              <button
                onClick={signOut}
                className="text-sm px-3 py-1 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
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