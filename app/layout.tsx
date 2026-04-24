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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <script dangerouslySetInnerHTML={{ __html: `
          document.addEventListener('touchstart', function(e) {
            if (e.touches.length > 1) e.preventDefault();
          }, { passive: false });
          document.addEventListener('gesturestart', function(e) {
            e.preventDefault();
          }, { passive: false });
        `}} />
        <AuthProvider>
          <EditModeProvider>{children}</EditModeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
