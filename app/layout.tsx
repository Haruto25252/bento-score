import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { EditModeProvider } from '@/context/EditModeContext'

export const metadata: Metadata = {
  title: '弁当スコア',
  description: '弁当のおかずをスコアリングするアプリ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <EditModeProvider>{children}</EditModeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
