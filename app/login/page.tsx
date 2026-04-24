'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/')
    }
  }, [isAuthenticated, isLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passphrase.trim()) return
    setLoading(true)
    setError('')
    const ok = await login(passphrase)
    if (ok) {
      router.replace('/')
    } else {
      setError('あいことばが違います')
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-[430px]">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🍱</div>
          <h1 className="text-2xl font-bold text-[var(--gold)]">弁当スコア</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">あいことばを入力してログイン</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1.5 block">あいことば</label>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--gold)] transition-colors"
              placeholder="パスワードを入力..."
              autoFocus
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={!passphrase.trim() || loading}
            className="w-full py-3 rounded-xl bg-[var(--gold)] text-[#1a1a2e] font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  )
}
