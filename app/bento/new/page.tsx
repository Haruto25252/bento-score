'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { SideDish } from '@/lib/types'
import { uploadImage } from '@/lib/imageUpload'
import AuthGuard from '@/components/AuthGuard'
import Header from '@/components/Header'
import SideDishSearch from '@/components/SideDishSearch'
import ScoreBar from '@/components/ScoreBar'

export default function NewBentoPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [storeName, setStoreName] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [sideDishes, setSideDishes] = useState<SideDish[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleAddSideDish = (sd: SideDish) => {
    setSideDishes((prev) => {
      if (prev.find((s) => s.id === sd.id)) return prev
      return [...prev, sd]
    })
  }

  const handleRemoveSideDish = (id: string) => {
    setSideDishes((prev) => prev.filter((s) => s.id !== id))
  }

  const totalScore = sideDishes.reduce((sum, sd) => sum + sd.total, 0)

  const handleSave = async () => {
    const errs: string[] = []
    if (!name.trim()) errs.push('弁当名を入力してください')
    if (!storeName.trim()) errs.push('店名を入力してください')
    if (!photoFile) errs.push('写真は必須です')
    setErrors(errs)
    if (errs.length > 0) return

    setSaving(true)
    try {
      const photo_url = await uploadImage(photoFile!, 'bento-photos')

      const { data: bento, error } = await supabase
        .from('bentos')
        .insert({ name: name.trim(), store_name: storeName.trim(), photo_url })
        .select('id')
        .single()
      if (error || !bento) throw error ?? new Error('Failed to create bento')

      if (sideDishes.length > 0) {
        await supabase.from('bento_side_dishes').insert(
          sideDishes.map((sd) => ({ bento_id: bento.id, side_dish_id: sd.id }))
        )
      }

      router.push(`/bento/${bento.id}`)
    } catch {
      setErrors(['保存に失敗しました'])
      setSaving(false)
    }
  }

  return (
    <AuthGuard>
      <Header />
      <main className="max-w-[430px] mx-auto px-4 py-4 pb-24">
        <h1 className="text-lg font-bold text-[var(--gold)] mb-4">弁当を追加</h1>

        {/* Photo */}
        <div className="mb-4">
          <label className="text-xs text-[var(--text-muted)] mb-1.5 block">写真 *</label>
          <label className="cursor-pointer block">
            <div
              className={`w-full h-48 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-dashed transition-colors ${
                photoPreview ? 'border-transparent' : 'border-[var(--border)] hover:border-[var(--gold)]'
              }`}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-[var(--text-muted)]">
                  <div className="text-3xl mb-1">📷</div>
                  <p className="text-xs">タップして写真を選択</p>
                </div>
              )}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </label>
        </div>

        {/* Fields */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">弁当名 *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--gold)] transition-colors"
              placeholder="例: のり弁"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">店名 *</label>
            <input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--gold)] transition-colors"
              placeholder="例: ほっともっと"
            />
          </div>
        </div>

        {/* Side dishes */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold">おかず</h2>
            <span className="text-xs text-[var(--gold)] font-mono">
              合計: {totalScore > 0 ? `+${totalScore}` : totalScore}
            </span>
          </div>
          <SideDishSearch onAdd={handleAddSideDish} />
          <div className="mt-3 space-y-2">
            {sideDishes.map((sd) => (
              <div
                key={sd.id}
                className="bg-[var(--bg-card)] rounded-xl p-3 border border-[var(--border)]"
              >
                <div className="flex items-center gap-2 mb-2">
                  {sd.photo_url ? (
                    <img src={sd.photo_url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-[#2a2a4e] shrink-0" />
                  )}
                  <span className="text-sm font-medium flex-1">{sd.name}</span>
                  <span className="text-xs font-mono text-[var(--gold)]">
                    {sd.total > 0 ? `+${sd.total}` : sd.total}
                  </span>
                  <button
                    onClick={() => handleRemoveSideDish(sd.id)}
                    className="text-[var(--text-muted)] hover:text-red-400 transition-colors ml-1"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-1">
                  <ScoreBar label="見た目" value={sd.appearance} />
                  <ScoreBar label="味" value={sd.taste} />
                  <ScoreBar label="食べやすさ" value={sd.ease} />
                  <ScoreBar label="匂い" value={sd.smell} />
                  <ScoreBar label="触感" value={sd.texture} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {errors.length > 0 && (
          <div className="mb-4 space-y-1">
            {errors.map((e, i) => (
              <p key={i} className="text-xs text-red-400">
                {e}
              </p>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="flex-1 py-3 rounded-xl bg-[#2a2a4e] text-sm hover:bg-[#3a3a5e] transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-[var(--gold)] text-[#1a1a2e] font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </main>
    </AuthGuard>
  )
}
