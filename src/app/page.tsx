import Link from 'next/link'
import { Clapperboard, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-canvas relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <Clapperboard className="w-10 h-10 text-accent" />
          <h1 className="font-display text-4xl font-bold text-text-primary">FlowJack</h1>
        </div>

        <p className="text-xl text-text-secondary mb-3 font-light">
          AI-Powered Moviemaking
        </p>

        <p className="text-text-tertiary mb-12 max-w-md leading-relaxed">
          Transform a simple idea into a complete cinematic production package.
          Screenplay. Shots. Storyboards. Production plan. All generated in minutes.
        </p>

        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button size="lg" className="gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="lg">
              Sign In
            </Button>
          </Link>
        </div>

        <p className="mt-16 text-2xs text-text-tertiary uppercase tracking-widest">
          Idea → Script → Shots → Storyboard → Film
        </p>
      </div>
    </div>
  )
}
