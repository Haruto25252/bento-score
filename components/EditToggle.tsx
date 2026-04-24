'use client'

import { useEditMode } from '@/context/EditModeContext'

export default function EditToggle() {
  const { editMode, toggleEditMode } = useEditMode()

  return (
    <button
      onClick={toggleEditMode}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        editMode
          ? 'bg-[var(--gold)] text-[#1a1a2e]'
          : 'bg-[#2a2a4e] text-[var(--text)] border border-[var(--border)] hover:border-[var(--gold)]'
      }`}
    >
      {editMode ? '✏️ 編集中' : '✏️ 編集'}
    </button>
  )
}
