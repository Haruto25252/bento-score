'use client'

import { useState } from 'react'
import { SideDishParams } from '@/lib/types'
import { uploadImage } from '@/lib/imageUpload'

interface Props {
  initialName?: string
  onConfirm: (params: SideDishParams) => void
  onCancel: () => void
}

const PARAMS: { key: keyof Omit<SideDishParams, 'name' | 'photo_url'>; label: string }[] = [
  { key: 'appearance', label: '見た目' },
  { key: 'taste', label: '味' },
  { key: 'ease', label: '食べやすさ' },
  { key: 'smell', label: '匂い' },
  { key: 'texture', label: '触感' },
]

export default function SideDishModal({ initialName = '', onConfirm, onCancel }: Props) {
  const [name, setName] = useState(initialName)
  const [scores, setScores] = useState({ appearance: 0, taste: 0, ease: 0, smell: 0, texture: 0 })
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    if (!name.trim()) return
    setUploading(true)
    try {
      let photo_url: string | undefined
      if (photoFile) {
        photo_url = await uploadImage(photoFile, 'side-dish-photos')
      }
      onConfirm({ name: name.trim(), photo_url, ...scores })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-[430px] p-5 space-y-4">
        <h2 className="text-lg font-bold text-[var(--gold)]">おかず新規作成</h2>

        <div>
          <label className="text-xs text-[var(--text-muted)] mb-1 block">おかず名 *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--gold)]"
            placeholder="例: から揚げ"
          />
        </div>

        <div>
          <label className="text-xs text-[var(--text-muted)] mb-1 block">写真（任意）</label>
          <div className="flex items-center gap-3">
            {photoPreview && (
              <img src={photoPreview} alt="" className="w-14 h-14 object-cover rounded-lg" />
            )}
            <label className="cursor-pointer bg-[#2a2a4e] hover:bg-[#3a3a5e] text-sm px-3 py-2 rounded-lg transition-colors">
              選択
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
          </div>
        </div>

        <div className="space-y-3">
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
                onChange={(e) => setScores((s) => ({ ...s, [key]: Number(e.target.value) }))}
              />
            </div>
          ))}
        </div>

        <div className="text-center text-sm text-[var(--text-muted)]">
          合計:{' '}
          <span className="font-bold text-[var(--gold)]">
            {Object.values(scores).reduce((a, b) => a + b, 0)}
          </span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-[#2a2a4e] text-sm hover:bg-[#3a3a5e] transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || uploading}
            className="flex-1 py-2.5 rounded-xl bg-[var(--gold)] text-[#1a1a2e] text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {uploading ? '保存中...' : '追加'}
          </button>
        </div>
      </div>
    </div>
  )
}
