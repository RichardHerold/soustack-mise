import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Soustack Mise',
  description: 'A hosted workbench where rough recipe prose becomes an always-valid Soustack recipe artifact',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, height: '100vh', overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  )
}
