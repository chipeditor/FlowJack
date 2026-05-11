import type { Metadata } from 'next'
import { Inter, JetBrains_Mono, Outfit } from 'next/font/google'
import '@/styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
})

export const metadata: Metadata = {
  title: 'FlowJack — AI Moviemaking',
  description: 'Transform your ideas into cinematic productions with AI.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} ${outfit.variable} font-sans min-h-screen flex flex-col`}>
        <div className="flex-1">{children}</div>
        <footer className="py-4 text-center text-xs text-text-tertiary">
          By Chip Eberhart
        </footer>
      </body>
    </html>
  )
}
