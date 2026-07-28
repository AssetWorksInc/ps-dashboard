import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import ChatWidget from '@/components/ChatWidget'

export const metadata: Metadata = {
  title: 'PS Portal | AssetWorks Professional Services',
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
            background: '#F4F5F6'
          }}>
            {children}
          </main>
        </div>
        <ChatWidget />
      </body>
    </html>
  )
}
