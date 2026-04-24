import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { EditModeProvider } from '@/context/EditModeContext'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '弁当スコア',
  description: '弁当のおかずをスコアリングするアプリ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <AuthProvider>
          <EditModeProvider>{children}</EditModeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
