'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import EditToggle from './EditToggle'

export default function Header() {
  const { logout } = useAuth()
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 bg-[var(--bg-card)] border-b border-[var(--border)]">
      <div className="max-w-[430px] mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-[var(--gold)] font-bold text-lg tracking-wide">
          🍱 弁当スコア
        </Link>
        <div className="flex items-center gap-2">
          <EditToggle />
          <Link
            href="/side-dishes"
            className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
              pathname === '/side-dishes'
                ? 'bg-[var(--gold)] text-[#1a1a2e] border-[var(--gold)] font-medium'
                : 'text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)] hover:border-[var(--text-muted)]'
            }`}
          >
            おかず
          </Link>
          <button
            onClick={logout}
            className="text-xs text-[var(--text-muted)] px-2.5 py-1.5 rounded-lg border border-[var(--border)] hover:text-red-400 hover:border-red-400/50 transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>
    </header>
  )
}
