import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import ChatWidget from '@/components/ChatWidget'
import LogoutButton from '@/components/LogoutButton'
import { getCurrentUser } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'PS Portal | AssetWorks Professional Services',
  description: 'AssetWorks Professional Services Portal',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  return (
    <html lang="en">
      <body>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar userRole={user?.role} />
          <main style={{
            flex: 1,
            overflowY: 'auto',
            background: '#F4F5F6'
          }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 24px 0' }}>
              <LogoutButton />
            </div>
            {children}
          </main>
        </div>
        <ChatWidget />
      </body>
    </html>
  )
}
