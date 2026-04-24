'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { SideDish, SideDishParams } from '@/lib/types'
import SideDishModal from './SideDishModal'

interface Props {
  onAdd: (sideDish: SideDish) => void
}

export default function SideDishSearch({ onAdd }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SideDish[]>([])
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('side_dishes')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(10)
      setResults(data ?? [])
      setOpen(true)
    }, 200)
    return () => clearTimeout(timeout)
  }, [query])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (sd: SideDish) => {
    onAdd(sd)
    setQuery('')
    setOpen(false)
  }

  const handleNewCreate = async (params: SideDishParams) => {
    const { data, error } = await supabase
      .from('side_dishes')
      .insert(params)
      .select('*')
      .single()
    if (!error && data) {
      onAdd(data as SideDish)
    }
    setShowModal(false)
    setQuery('')
  }

  const handleNotFound = () => {
    setNewName(query.trim())
    setShowModal(true)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query && setOpen(true)}
        className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--gold)]"
        placeholder="おかず名で検索して追加..."
      />

      {open && (
        <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xl">
          {results.map((sd) => (
            <button
              key={sd.id}
              onClick={() => handleSelect(sd)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#2a2a4e] text-left transition-colors"
            >
              {sd.photo_url ? (
                <img src={sd.photo_url} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded bg-[#2a2a4e] shrink-0" />
              )}
              <span className="text-sm">{sd.name}</span>
              <span className="ml-auto text-xs text-[var(--gold)] font-mono">
                {sd.total > 0 ? `+${sd.total}` : sd.total}
              </span>
            </button>
          ))}
          <button
            onClick={handleNotFound}
            className="w-full px-3 py-2.5 text-sm text-left text-[var(--gold)] hover:bg-[#2a2a4e] transition-colors border-t border-[var(--border)]"
          >
            「{query}」を新規作成...
          </button>
        </div>
      )}

      {showModal && (
        <SideDishModal
          initialName={newName}
          onConfirm={handleNewCreate}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
