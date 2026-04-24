'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { SideDish } from '@/lib/types'
import { uploadImage } from '@/lib/imageUpload'
import ScoreBar from '@/components/ScoreBar'
import AuthGuard from '@/components/AuthGuard'
import Header from '@/components/Header'
import { useEditMode } from '@/context/EditModeContext'

const PARAMS: { key: keyof Pick<SideDish, 'appearance' | 'taste' | 'ease' | 'smell' | 'texture'>; label: string }[] =
  [
    { key: 'appearance', label: '見た目' },
    { key: 'taste', label: '味' },
    { key: 'ease', label: '食べやすさ' },
    { key: 'smell', label: '匂い' },
    { key: 'texture', label: '触感' },
  ]

function SideDishCard({
  sd,
  editMode,
  onSaved,
}: {
  sd: SideDish
  editMode: boolean
  onSaved: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [scores, setScores] = useState({
    appearance: sd.appearance,
    taste: sd.taste,
    ease: sd.ease,
    smell: sd.smell,
    texture: sd.texture,
  })
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      let photo_url = sd.photo_url
      if (photoFile) photo_url = await uploadImage(photoFile, 'side-dish-photos')
      await supabase.from('side_dishes').update({ ...scores, photo_url }).eq('id', sd.id)
      onSaved()
      setEditing(false)
      setPhotoFile(null)
      setPhotoPreview(null)
    } finally {
      setSaving(false)
    }
  }

  const displayPhoto = photoPreview ?? sd.photo_url
  const currentTotal = Object.values(scores).reduce((a, b) => a + b, 0)

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-3 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        {displayPhoto ? (
          <img src={displayPhoto} alt={sd.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-[#2a2a4e] shrink-0 flex items-center justify-center text-2xl">
            🍽
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{sd.name}</p>
          <p className="text-xs text-[var(--gold)] font-mono mt-0.5">
            {sd.total > 0 ? `+${sd.total}` : sd.total} pts
          </p>
        </div>
        <span className="text-[var(--text-muted)] text-xs">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[var(--border)] pt-3">
          {editing ? (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="relative">
                  {displayPhoto ? (
                    <img src={displayPhoto} alt="" className="w-14 h-14 rounded-xl object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-[#2a2a4e]" />
                  )}
                </div>
                <label className="cursor-pointer bg-[#2a2a4e] hover:bg-[#3a3a5e] text-xs px-3 py-1.5 rounded-lg transition-colors">
                  写真を変更
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) {
                        setPhotoFile(f)
                        setPhotoPreview(URL.createObjectURL(f))
                      }
                    }}
                  />
                </label>
              </div>
              {PARAMS.map(({ key, label }) => (
                <div key={key}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-[var(--text-muted)]">{label}</span>
                    <span className="text-xs font-mono font-bold text-[var(--gold)]">
                      {scores[key] > 0 ? `+${scores[key]}` : scores[key]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-10}
                    max={10}
                    value={scores[key]}
                    onChange={(e) =>
                      setScores((s) => ({ ...s, [key]: Number(e.target.value) }))
                    }
                  />
                </div>
              ))}
              <p className="text-center text-xs text-[var(--text-muted)]">
                合計:{' '}
                <span className="font-bold text-[var(--gold)]">
                  {currentTotal > 0 ? `+${currentTotal}` : currentTotal}
                </span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditing(false)
                    setScores({
                      appearance: sd.appearance,
                      taste: sd.taste,
                      ease: sd.ease,
                      smell: sd.smell,
                      texture: sd.texture,
                    })
                    setPhotoFile(null)
                    setPhotoPreview(null)
                  }}
                  className="flex-1 py-2 rounded-xl bg-[#2a2a4e] text-xs hover:bg-[#3a3a5e] transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2 rounded-xl bg-[var(--gold)] text-[#1a1a2e] text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <ScoreBar label="見た目" value={sd.appearance} />
                <ScoreBar label="味" value={sd.taste} />
                <ScoreBar label="食べやすさ" value={sd.ease} />
                <ScoreBar label="匂い" value={sd.smell} />
                <ScoreBar label="触感" value={sd.texture} />
              </div>
              {editMode && (
                <button
                  onClick={() => setEditing(true)}
                  className="w-full py-2 rounded-xl bg-[#2a2a4e] text-xs hover:bg-[#3a3a5e] transition-colors mt-1"
                >
                  編集
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function SideDishesPage() {
  const [sideDishes, setSideDishes] = useState<SideDish[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { editMode } = useEditMode()

  const fetchSideDishes = useCallback(async () => {
    const { data } = await supabase
      .from('side_dishes')
      .select('*')
      .order('created_at', { ascending: false })
    setSideDishes(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSideDishes()
  }, [fetchSideDishes])

  const filtered = sideDishes.filter((sd) =>
    !searchQuery.trim() || sd.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AuthGuard>
      <Header />
      <main className="max-w-[430px] mx-auto px-4 py-4 pb-24">
        <h1 className="text-lg font-bold text-[var(--gold)] mb-4">おかずマスタ</h1>

        <div className="mb-4">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--gold)] transition-colors"
            placeholder="おかず名で検索..."
          />
        </div>

        {loading ? (
          <div className="flex justify-center mt-16">
            <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center mt-16 text-[var(--text-muted)]">
            <div className="text-4xl mb-3">🍽</div>
            <p className="text-sm">
              {searchQuery ? '見つかりませんでした' : 'おかずがありません'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((sd) => (
              <SideDishCard key={sd.id} sd={sd} editMode={editMode} onSaved={fetchSideDishes} />
            ))}
          </div>
        )}
      </main>
    </AuthGuard>
  )
}
