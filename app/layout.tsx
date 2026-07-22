import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import ChatWidget from '@/components/ChatWidget'

export const metadata: Metadata = {
  title: 'PS Dashboard',
  description: 'AssetWorks Professional Services Portal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <main style={{
            flex: 1,
            overflowY: 'auto',
            padding: '28px 32px',
            background: '#F7F8FA'
          }}>
            {children}
          </main>
        </div>
        <ChatWidget />
      </body>
    </html>
  )
}
