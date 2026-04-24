'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Bento } from '@/lib/types'
import { calcBentoScore, calcTier } from '@/lib/tier'
import TierBadge from '@/components/TierBadge'
import AuthGuard from '@/components/AuthGuard'
import Header from '@/components/Header'
import { useEditMode } from '@/context/EditModeContext'

type SortOrder = 'created' | 'tier'

function BentoCard({ bento, allScores }: { bento: Bento; allScores: number[] }) {
  const score = bento.score ?? 0
  const tier = calcTier(score, allScores)

  return (
    <Link href={`/bento/${bento.id}`}>
      <div className="bg-[var(--bg-card)] rounded-2xl overflow-hidden border border-[var(--border)] hover:border-[var(--gold)] transition-colors active:opacity-80">
        <div className="relative h-44 bg-[#0f3460]">
          {bento.photo_url ? (
            <img src={bento.photo_url} alt={bento.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">🍱</div>
          )}
          <div className="absolute top-2 right-2">
            <TierBadge tier={tier} size="lg" />
          </div>
        </div>
        <div className="p-3">
          <p className="font-bold text-sm truncate">{bento.name}</p>
          <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{bento.store_name}</p>
          <p className="text-[var(--gold)] font-bold text-sm mt-1">
            {score > 0 ? `+${score}` : score} pts
          </p>
        </div>
      </div>
    </Link>
  )
}

export default function HomePage() {
  const [bentos, setBentos] = useState<Bento[]>([])
  const [sortOrder, setSortOrder] = useState<SortOrder>('created')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const { editMode } = useEditMode()

  const fetchBentos = useCallback(async () => {
    const { data } = await supabase
      .from('bentos')
      .select(`
        *,
        bento_side_dishes (
          id, bento_id, side_dish_id,
          side_dishes (*)
        )
      `)
      .order('created_at', { ascending: false })

    if (data) {
      const enriched = data.map((b) => ({
        ...b,
        score: calcBentoScore(
          (b.bento_side_dishes ?? []).map((bsd: { side_dishes: { total: number } }) => bsd.side_dishes?.total ?? 0)
        ),
      }))
      setBentos(enriched)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchBentos()
  }, [fetchBentos])

  const allScores = bentos.map((b) => b.score ?? 0)

  const filtered = bentos.filter((b) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    const nameMatch = b.name.toLowerCase().includes(q) || b.store_name.toLowerCase().includes(q)
    const sideMatch = (b.bento_side_dishes ?? []).some((bsd: { side_dishes: { name: string } }) =>
      bsd.side_dishes?.name?.toLowerCase().includes(q)
    )
    return nameMatch || sideMatch
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortOrder === 'tier') return (b.score ?? 0) - (a.score ?? 0)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <AuthGuard>
      <Header />
      <main className="max-w-[430px] mx-auto px-4 py-4 pb-24">
        {/* Search */}
        <div className="mb-3">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--gold)] transition-colors"
            placeholder="弁当名・おかず名で検索..."
          />
        </div>

        {/* Sort */}
        <div className="flex gap-2 mb-4">
          {(['created', 'tier'] as SortOrder[]).map((o) => (
            <button
              key={o}
              onClick={() => setSortOrder(o)}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                sortOrder === o
                  ? 'bg-[var(--gold)] text-[#1a1a2e] font-bold'
                  : 'bg-[#2a2a4e] text-[var(--text-muted)]'
              }`}
            >
              {o === 'created' ? '追加順' : 'ティア順'}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center mt-16">
            <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center mt-16 text-[var(--text-muted)]">
            <div className="text-4xl mb-3">🍱</div>
            <p className="text-sm">
              {searchQuery ? '見つかりませんでした' : 'まだ弁当がありません'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {sorted.map((bento) => (
              <BentoCard key={bento.id} bento={bento} allScores={allScores} />
            ))}
          </div>
        )}

        {/* FAB */}
        {editMode && (
          <Link
            href="/bento/new"
            className="fixed bottom-6 right-4 w-14 h-14 rounded-full bg-[var(--gold)] text-[#1a1a2e] flex items-center justify-center shadow-lg text-2xl hover:opacity-90 transition-opacity z-40"
          >
            +
          </Link>
        )}
      </main>
    </AuthGuard>
  )
}
