'use client'

import { use, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Bento, SideDish, BentoSideDish } from '@/lib/types'
import { calcBentoScore, calcTier } from '@/lib/tier'
import { uploadImage } from '@/lib/imageUpload'
import TierBadge from '@/components/TierBadge'
import ScoreBar from '@/components/ScoreBar'
import AuthGuard from '@/components/AuthGuard'
import Header from '@/components/Header'
import SideDishSearch from '@/components/SideDishSearch'
import { useEditMode } from '@/context/EditModeContext'

interface PageProps {
  params: Promise<{ id: string }>
}

const SD_PARAMS: { key: keyof Pick<SideDish, 'appearance' | 'taste' | 'ease' | 'smell' | 'texture'>; label: string }[] = [
  { key: 'appearance', label: '見た目' },
  { key: 'taste', label: '味' },
  { key: 'ease', label: '食べやすさ' },
  { key: 'smell', label: '匂い' },
  { key: 'texture', label: '触感' },
]

export default function BentoDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { editMode } = useEditMode()

  const [bento, setBento] = useState<Bento | null>(null)
  const [allScores, setAllScores] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [editName, setEditName] = useState('')
  const [editStore, setEditStore] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // おかずインライン編集
  const [editingSdId, setEditingSdId] = useState<string | null>(null)
  const [editSdName, setEditSdName] = useState('')
  const [editSdScores, setEditSdScores] = useState({ appearance: 0, taste: 0, ease: 0, smell: 0, texture: 0 })
  const [editSdPhotoFile, setEditSdPhotoFile] = useState<File | null>(null)
  const [editSdPhotoPreview, setEditSdPhotoPreview] = useState<string | null>(null)
  const [savingSd, setSavingSd] = useState(false)

  const fetchBento = useCallback(async () => {
    const [{ data: bentoData }, { data: allBentosData }] = await Promise.all([
      supabase
        .from('bentos')
        .select(`*, bento_side_dishes(id, bento_id, side_dish_id, side_dishes(*))`)
        .eq('id', id)
        .single(),
      supabase
        .from('bentos')
        .select(`id, bento_side_dishes(side_dishes(total))`),
    ])

    if (bentoData) {
      setBento(bentoData)
      setEditName(bentoData.name)
      setEditStore(bentoData.store_name)
    }

    if (allBentosData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scores = (allBentosData as any[]).map((b) =>
        calcBentoScore(
          (b.bento_side_dishes as { side_dishes: { total: number } }[]).map(
            (bsd) => bsd.side_dishes?.total ?? 0
          )
        )
      )
      setAllScores(scores)
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchBento()
  }, [fetchBento])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!bento) return
    setSaving(true)
    try {
      let photo_url = bento.photo_url
      if (photoFile) photo_url = await uploadImage(photoFile, 'bento-photos')

      await supabase
        .from('bentos')
        .update({ name: editName.trim(), store_name: editStore.trim(), photo_url, updated_at: new Date().toISOString() })
        .eq('id', id)

      await fetchBento()
      setPhotoFile(null)
      setPhotoPreview(null)
    } finally {
      setSaving(false)
    }
  }

  const handleAddSideDish = async (sd: SideDish) => {
    if (!bento) return
    const existing = (bento.bento_side_dishes ?? []).find(
      (bsd: BentoSideDish) => bsd.side_dish_id === sd.id
    )
    if (existing) return
    await supabase
      .from('bento_side_dishes')
      .insert({ bento_id: bento.id, side_dish_id: sd.id })
    fetchBento()
  }

  const handleRemoveSideDish = async (bsdId: string) => {
    await supabase.from('bento_side_dishes').delete().eq('id', bsdId)
    fetchBento()
  }

  const handleDelete = async () => {
    if (!confirm('この弁当を削除しますか？')) return
    setDeleting(true)
    await supabase.from('bento_side_dishes').delete().eq('bento_id', id)
    await supabase.from('bentos').delete().eq('id', id)
    router.replace('/')
  }

  const startEditSd = (sd: SideDish) => {
    setEditingSdId(sd.id)
    setEditSdName(sd.name)
    setEditSdScores({
      appearance: sd.appearance,
      taste: sd.taste,
      ease: sd.ease,
      smell: sd.smell,
      texture: sd.texture,
    })
    setEditSdPhotoFile(null)
    setEditSdPhotoPreview(null)
  }

  const cancelEditSd = () => {
    setEditingSdId(null)
    setEditSdPhotoFile(null)
    setEditSdPhotoPreview(null)
  }

  const handleSaveSd = async (sd: SideDish) => {
    if (!editSdName.trim()) return
    setSavingSd(true)
    try {
      let photo_url = sd.photo_url
      if (editSdPhotoFile) photo_url = await uploadImage(editSdPhotoFile, 'side-dish-photos')
      await supabase.from('side_dishes').update({
        name: editSdName.trim(),
        ...editSdScores,
        photo_url,
      }).eq('id', sd.id)
      setEditingSdId(null)
      setEditSdPhotoFile(null)
      setEditSdPhotoPreview(null)
      fetchBento()
    } finally {
      setSavingSd(false)
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <Header />
        <div className="flex justify-center mt-16">
          <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
        </div>
      </AuthGuard>
    )
  }

  if (!bento) {
    return (
      <AuthGuard>
        <Header />
        <div className="text-center mt-16 text-[var(--text-muted)]">見つかりませんでした</div>
      </AuthGuard>
    )
  }

  const score = calcBentoScore(
    (bento.bento_side_dishes ?? []).map((bsd: BentoSideDish) => bsd.side_dishes?.total ?? 0)
  )
  const tier = calcTier(score, allScores)
  const displayPhoto = photoPreview ?? bento.photo_url
  const sideDishCount = (bento.bento_side_dishes ?? []).length
  const avg = sideDishCount > 0 ? score / sideDishCount : null

  return (
    <AuthGuard>
      <Header />
      <main className="max-w-[430px] mx-auto pb-24">
        {/* Hero photo */}
        <div className="relative h-64 bg-[#0f3460]">
          {displayPhoto ? (
            <img src={displayPhoto} alt={bento.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">🍱</div>
          )}
          {editMode && (
            <label className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full cursor-pointer hover:bg-black/80 transition-colors">
              写真を変更
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
          )}
          <div className="absolute top-3 right-3">
            <TierBadge tier={tier} size="lg" />
          </div>
        </div>

        <div className="px-4 pt-4 space-y-4">
          {/* Info */}
          {editMode ? (
            <div className="space-y-2">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-base font-bold focus:outline-none focus:border-[var(--gold)] transition-colors"
              />
              <input
                value={editStore}
                onChange={(e) => setEditStore(e.target.value)}
                className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--gold)] transition-colors"
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-2.5 rounded-xl bg-[var(--gold)] text-[#1a1a2e] font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {saving ? '保存中...' : '変更を保存'}
              </button>
            </div>
          ) : (
            <div>
              <h1 className="text-xl font-bold">{bento.name}</h1>
              <p className="text-sm text-[var(--text-muted)]">{bento.store_name}</p>
              <div className="flex items-baseline gap-3 mt-1">
                <p className="text-[var(--gold)] font-bold text-lg">
                  {score > 0 ? `+${score}` : score} pts
                </p>
                {avg !== null && (
                  <p className="text-sm text-[var(--text-muted)]">
                    平均 {avg > 0 ? `+${avg.toFixed(1)}` : avg.toFixed(1)}/皿
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Side dishes */}
          <div>
            <h2 className="text-sm font-bold mb-2">おかず一覧</h2>
            {editMode && (
              <div className="mb-3">
                <SideDishSearch onAdd={handleAddSideDish} />
              </div>
            )}
            <div className="space-y-3">
              {(bento.bento_side_dishes ?? []).map((bsd: BentoSideDish) => {
                const sd = bsd.side_dishes
                if (!sd) return null
                const isEditingThis = editingSdId === sd.id
                const sdDisplayPhoto = isEditingThis ? (editSdPhotoPreview ?? sd.photo_url) : sd.photo_url

                return (
                  <div
                    key={bsd.id}
                    className="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--border)]"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {sdDisplayPhoto ? (
                        <img
                          src={sdDisplayPhoto}
                          alt={sd.name}
                          className="w-12 h-12 rounded-xl object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#2a2a4e] shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {isEditingThis ? editSdName : sd.name}
                        </p>
                        <p className="text-xs text-[var(--gold)] font-mono mt-0.5">
                          {isEditingThis
                            ? Object.values(editSdScores).reduce((a, b) => a + b, 0)
                            : sd.total > 0 ? `+${sd.total}` : sd.total} pts
                        </p>
                      </div>
                      {editMode && !isEditingThis && (
                        <button
                          onClick={() => handleRemoveSideDish(bsd.id)}
                          className="text-[var(--text-muted)] hover:text-red-400 transition-colors shrink-0"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {isEditingThis ? (
                      /* インライン編集フォーム */
                      <div className="space-y-3 border-t border-[var(--border)] pt-3">
                        <div>
                          <label className="text-xs text-[var(--text-muted)] mb-1 block">おかず名</label>
                          <input
                            value={editSdName}
                            onChange={(e) => setEditSdName(e.target.value)}
                            className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--gold)]"
                          />
                        </div>
                        <label className="cursor-pointer inline-flex items-center gap-2 bg-[#2a2a4e] hover:bg-[#3a3a5e] text-xs px-3 py-1.5 rounded-lg transition-colors">
                          📷 写真を変更
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0]
                              if (f) {
                                setEditSdPhotoFile(f)
                                setEditSdPhotoPreview(URL.createObjectURL(f))
                              }
                            }}
                          />
                        </label>
                        {SD_PARAMS.map(({ key, label }) => (
                          <div key={key}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-[var(--text-muted)]">{label}</span>
                              <span className="text-xs font-mono font-bold text-[var(--gold)]">
                                {editSdScores[key] > 0 ? `+${editSdScores[key]}` : editSdScores[key]}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={-10}
                              max={10}
                              value={editSdScores[key]}
                              onChange={(e) =>
                                setEditSdScores((s) => ({ ...s, [key]: Number(e.target.value) }))
                              }
                            />
                          </div>
                        ))}
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={cancelEditSd}
                            className="flex-1 py-2 rounded-xl bg-[#2a2a4e] text-xs hover:bg-[#3a3a5e] transition-colors"
                          >
                            キャンセル
                          </button>
                          <button
                            onClick={() => handleSaveSd(sd)}
                            disabled={savingSd || !editSdName.trim()}
                            className="flex-1 py-2 rounded-xl bg-[var(--gold)] text-[#1a1a2e] text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
                          >
                            {savingSd ? '保存中...' : '保存'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* 通常表示 */
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
                            onClick={() => startEditSd(sd)}
                            className="mt-3 w-full py-2 rounded-xl bg-[#2a2a4e] text-xs hover:bg-[#3a3a5e] transition-colors border border-[var(--border)]"
                          >
                            このおかずを編集
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
              {(bento.bento_side_dishes ?? []).length === 0 && (
                <p className="text-sm text-[var(--text-muted)] text-center py-4">
                  おかずがまだありません
                </p>
              )}
            </div>
          </div>

          {/* Delete */}
          {editMode && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full py-2.5 rounded-xl bg-red-900/30 text-red-400 text-sm hover:bg-red-900/50 transition-colors"
            >
              {deleting ? '削除中...' : 'この弁当を削除'}
            </button>
          )}
        </div>
      </main>
    </AuthGuard>
  )
}
