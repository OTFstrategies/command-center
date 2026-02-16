import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const springs = {
  snappy: { type: 'spring' as const, stiffness: 500, damping: 30, mass: 1 },
  smooth: { type: 'spring' as const, stiffness: 300, damping: 25, mass: 1 },
  bouncy: { type: 'spring' as const, stiffness: 400, damping: 15, mass: 1 },
  gentle: { type: 'spring' as const, stiffness: 200, damping: 20, mass: 1 },
}

// ─── Dark Mode Toggle ────────────────────────────────────────

function DarkModeToggle() {
  const [dark, setDark] = useState(false)

  const toggle = useCallback(() => {
    setDark(d => {
      const next = !d
      document.documentElement.classList.toggle('dark', next)
      return next
    })
  }, [])

  return (
    <motion.button
      onClick={toggle}
      className="fixed top-4 right-4 z-50 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      whileHover={{ scale: 1.05, transition: springs.gentle }}
      whileTap={{ scale: 0.95, transition: springs.snappy }}
    >
      {dark ? 'Light Mode' : 'Dark Mode'}
    </motion.button>
  )
}

// ─── Section Wrapper ─────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl border-b border-border pb-2">{title}</h2>
      {children}
    </section>
  )
}

// ─── Color Swatches ──────────────────────────────────────────

const zincShades = [
  { name: 'zinc-50', tw: 'bg-zinc-50', hex: '#FAFAFA' },
  { name: 'zinc-100', tw: 'bg-zinc-100', hex: '#F4F4F5' },
  { name: 'zinc-200', tw: 'bg-zinc-200', hex: '#E4E4E7' },
  { name: 'zinc-300', tw: 'bg-zinc-300', hex: '#D4D4D8' },
  { name: 'zinc-400', tw: 'bg-zinc-400', hex: '#A1A1AA' },
  { name: 'zinc-500', tw: 'bg-zinc-500', hex: '#71717A' },
  { name: 'zinc-600', tw: 'bg-zinc-600', hex: '#52525B' },
  { name: 'zinc-700', tw: 'bg-zinc-700', hex: '#3F3F46' },
  { name: 'zinc-800', tw: 'bg-zinc-800', hex: '#27272A' },
  { name: 'zinc-900', tw: 'bg-zinc-900', hex: '#18181B' },
  { name: 'zinc-950', tw: 'bg-zinc-950', hex: '#09090B' },
]

function ColorSection() {
  return (
    <Section title="Kleuren - Zinc Monochrome Palette">
      <p className="text-muted-foreground">
        ALLEEN zinc scale. Geen accent kleuren. Geen blauw, groen, paars.
      </p>
      <div className="grid grid-cols-11 gap-2">
        {zincShades.map(shade => (
          <div key={shade.name} className="text-center space-y-1">
            <div className={`${shade.tw} h-16 rounded-lg border border-border`} />
            <p className="text-xs font-medium">{shade.name}</p>
            <p className="text-xs text-muted-foreground">{shade.hex}</p>
          </div>
        ))}
      </div>

      <h3 className="text-lg mt-8">Semantic Tokens</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { name: 'background', css: 'bg-background text-foreground', label: '--background' },
          { name: 'primary', css: 'bg-primary text-primary-foreground', label: '--primary' },
          { name: 'secondary', css: 'bg-secondary text-secondary-foreground', label: '--secondary' },
          { name: 'muted', css: 'bg-muted text-muted-foreground', label: '--muted' },
          { name: 'accent', css: 'bg-accent text-accent-foreground', label: '--accent' },
          { name: 'card', css: 'bg-card text-card-foreground', label: '--card' },
        ].map(token => (
          <div key={token.name} className={`${token.css} rounded-lg border border-border p-3`}>
            <p className="text-sm font-medium">{token.name}</p>
            <p className="text-xs opacity-70">{token.label}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}

// ─── Typography ──────────────────────────────────────────────

function TypographySection() {
  return (
    <Section title="Typografie">
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-4xl">Heading 1 - DM Sans Semibold</h1>
          <h2 className="text-3xl">Heading 2 - DM Sans Semibold</h2>
          <h3 className="text-2xl">Heading 3 - DM Sans Semibold</h3>
          <h4 className="text-xl">Heading 4 - DM Sans Semibold</h4>
          <h5 className="text-lg">Heading 5 - DM Sans Semibold</h5>
          <h6 className="text-base">Heading 6 - DM Sans Semibold</h6>
        </div>

        <div className="space-y-2 border-t border-border pt-4">
          <p className="text-base">Body text - Inter Regular. Dit is standaard body tekst voor alle content.</p>
          <p className="text-sm text-muted-foreground">Muted text - Inter Regular. Voor subtiele informatie.</p>
          <p className="text-base font-medium">Button text - Inter Medium. Voor knoppen en labels.</p>
        </div>

        <div className="space-y-2 border-t border-border pt-4">
          <code className="text-sm bg-muted px-2 py-1 rounded-md">Code - JetBrains Mono Regular</code>
          <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto">
{`const design = {
  fonts: ["DM Sans", "Inter", "JetBrains Mono"],
  palette: "zinc monochrome",
  accents: "none",
};`}
          </pre>
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Label - Inter Medium, Uppercase, Tracking Widest
          </p>
        </div>
      </div>
    </Section>
  )
}

// ─── Glassmorphism ───────────────────────────────────────────

function GlassSection() {
  return (
    <Section title="Glassmorphism">
      <p className="text-muted-foreground">Frosted glass effecten voor depth en layering.</p>

      {/* Gradient background to show glass effect */}
      <div className="relative rounded-xl overflow-hidden p-8"
        style={{
          background: 'linear-gradient(135deg, #71717A 0%, #27272A 50%, #52525B 100%)',
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass rounded-xl p-6 space-y-2">
            <h3 className="text-white text-lg">.glass</h3>
            <p className="text-white/70 text-sm">Standaard glassmorphism. Voor sidebars, modals.</p>
          </div>
          <div className="glass-subtle rounded-xl p-6 space-y-2">
            <h3 className="text-white text-lg">.glass-subtle</h3>
            <p className="text-white/70 text-sm">Subtiel. Voor hover overlays.</p>
          </div>
          <div className="glass-strong rounded-xl p-6 space-y-2">
            <h3 className="text-white text-lg">.glass-strong</h3>
            <p className="text-white/70 text-sm">Sterk. Voor hero sections, feature cards.</p>
          </div>
        </div>
      </div>
    </Section>
  )
}

// ─── Glow Effects ────────────────────────────────────────────

function GlowSection() {
  return (
    <Section title="Glow Effecten">
      <p className="text-muted-foreground">Monochrome glow. NOOIT gekleurd. Alleen wit/grijs.</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glow rounded-xl border border-border p-6 bg-card text-center">
          <p className="font-medium">.glow</p>
          <p className="text-sm text-muted-foreground">Permanent subtiel</p>
        </div>
        <div className="glow-hover rounded-xl border border-border p-6 bg-card text-center cursor-pointer">
          <p className="font-medium">.glow-hover</p>
          <p className="text-sm text-muted-foreground">Hover over mij!</p>
        </div>
        <div className="glow-strong rounded-xl border border-border p-6 bg-card text-center">
          <p className="font-medium">.glow-strong</p>
          <p className="text-sm text-muted-foreground">Sterke glow</p>
        </div>
        <div className="rounded-xl border border-border p-6 bg-card text-center">
          <p className="font-medium text-glow cursor-pointer">.text-glow</p>
          <p className="text-sm text-muted-foreground">Hover over tekst!</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="animate-glow-pulse rounded-xl border border-border p-6 bg-card text-center">
          <p className="font-medium">.animate-glow-pulse</p>
          <p className="text-sm text-muted-foreground">Ambient glow pulse, 3s infinite</p>
        </div>
      </div>
    </Section>
  )
}

// ─── Framer Motion Animations ────────────────────────────────

function AnimationsSection() {
  const [showSpring, setShowSpring] = useState<string | null>(null)

  return (
    <Section title="Animaties - Framer Motion Springs">
      <p className="text-muted-foreground">
        Spring physics voor natuurlijke interactie. Klik op de knoppen om de spring te voelen.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(Object.entries(springs) as [string, typeof springs.snappy][]).map(([name, spring]) => (
          <motion.button
            key={name}
            className="rounded-xl border border-border p-6 bg-card text-center cursor-pointer glow-hover"
            whileHover={{ scale: 1.03, transition: springs.gentle }}
            whileTap={{ scale: 0.95, transition: spring }}
            onClick={() => setShowSpring(name)}
          >
            <p className="font-medium">springs.{name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {spring.stiffness}/{spring.damping}
            </p>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {showSpring && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={springs.smooth}
            className="rounded-xl border border-border bg-card p-4 flex items-center justify-between"
          >
            <p className="text-sm">
              Je klikte op <code className="bg-muted px-1.5 py-0.5 rounded text-sm">springs.{showSpring}</code>
              {' '}- stiffness: {springs[showSpring as keyof typeof springs].stiffness}, damping: {springs[showSpring as keyof typeof springs].damping}
            </p>
            <button
              onClick={() => setShowSpring(null)}
              className="text-muted-foreground hover:text-foreground text-sm px-2"
            >
              Sluiten
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <h3 className="text-lg mt-6">Button Pattern</h3>
      <div className="flex gap-4 flex-wrap">
        <motion.button
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          whileHover={{ scale: 1.02, transition: springs.gentle }}
          whileTap={{ scale: 0.97, transition: springs.snappy }}
        >
          Primary Button
        </motion.button>
        <motion.button
          className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground border border-border"
          whileHover={{ scale: 1.02, transition: springs.gentle }}
          whileTap={{ scale: 0.97, transition: springs.snappy }}
        >
          Secondary Button
        </motion.button>
        <motion.button
          className="rounded-md bg-card px-4 py-2 text-sm font-medium text-foreground border border-border glow-hover"
          whileHover={{ scale: 1.02, transition: springs.gentle }}
          whileTap={{ scale: 0.97, transition: springs.snappy }}
        >
          Ghost + Glow
        </motion.button>
      </div>
    </Section>
  )
}

// ─── CSS Animations ──────────────────────────────────────────

function CSSAnimationsSection() {
  const [key, setKey] = useState(0)

  return (
    <Section title="CSS Animaties">
      <p className="text-muted-foreground">Framework-agnostic keyframe animaties.</p>

      <button
        onClick={() => setKey(k => k + 1)}
        className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground border border-border mb-4"
      >
        Replay animaties
      </button>

      <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="animate-fade-in rounded-xl border border-border p-6 bg-card text-center">
          <p className="font-medium">.animate-fade-in</p>
          <p className="text-sm text-muted-foreground">200ms ease-out</p>
        </div>
        <div className="animate-slide-up rounded-xl border border-border p-6 bg-card text-center">
          <p className="font-medium">.animate-slide-up</p>
          <p className="text-sm text-muted-foreground">200ms cubic-bezier</p>
        </div>
        <div className="animate-slide-in-right rounded-xl border border-border p-6 bg-card text-center">
          <p className="font-medium">.animate-slide-in-right</p>
          <p className="text-sm text-muted-foreground">300ms cubic-bezier</p>
        </div>
      </div>
    </Section>
  )
}

// ─── Feedback States ─────────────────────────────────────────

function FeedbackSection() {
  return (
    <Section title="Feedback States">
      <p className="text-muted-foreground">
        Zeer subtiele kleurhint. Alleen voor success/error/warning.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg p-4 border" style={{ background: 'var(--state-success-bg)', borderColor: 'var(--state-success-border)' }}>
          <p className="font-medium">Success</p>
          <p className="text-sm text-muted-foreground mt-1">var(--state-success-bg)</p>
        </div>
        <div className="rounded-lg p-4 border" style={{ background: 'var(--state-error-bg)', borderColor: 'var(--state-error-border)' }}>
          <p className="font-medium">Error</p>
          <p className="text-sm text-muted-foreground mt-1">var(--state-error-bg)</p>
        </div>
        <div className="rounded-lg p-4 border" style={{ background: 'var(--state-warning-bg)', borderColor: 'var(--state-warning-border)' }}>
          <p className="font-medium">Warning</p>
          <p className="text-sm text-muted-foreground mt-1">var(--state-warning-bg)</p>
        </div>
        <div className="rounded-lg p-4 border" style={{ background: 'var(--state-info-bg)', borderColor: 'var(--state-info-border)' }}>
          <p className="font-medium">Info</p>
          <p className="text-sm text-muted-foreground mt-1">var(--state-info-bg)</p>
        </div>
      </div>
    </Section>
  )
}

// ─── Spacing & Radius ────────────────────────────────────────

function SpacingSection() {
  return (
    <Section title="Spacing & Radius">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg mb-3">Spacing Scale</h3>
          <div className="flex items-end gap-2 flex-wrap">
            {[1, 2, 3, 4, 6, 8, 12, 16].map(size => (
              <div key={size} className="text-center">
                <div
                  className="bg-primary rounded"
                  style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
                />
                <p className="text-xs text-muted-foreground mt-1">gap-{size}</p>
                <p className="text-xs text-muted-foreground">{size * 4}px</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg mb-3">Border Radius</h3>
          <div className="flex gap-4 flex-wrap">
            {[
              { name: 'rounded-sm', css: 'rounded-sm', desc: 'Badges inner' },
              { name: 'rounded-md', css: 'rounded-md', desc: 'Buttons, inputs' },
              { name: 'rounded-lg', css: 'rounded-lg', desc: '--radius, 0.5rem' },
              { name: 'rounded-xl', css: 'rounded-xl', desc: 'Cards, 0.75rem' },
              { name: 'rounded-full', css: 'rounded-full', desc: 'Badges, avatars' },
            ].map(r => (
              <div key={r.name} className="text-center">
                <div className={`${r.css} bg-primary w-16 h-16`} />
                <p className="text-xs font-medium mt-2">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg mb-3">Shadows</h3>
          <div className="flex gap-6 flex-wrap">
            {[
              { name: 'shadow-none', css: '' },
              { name: 'shadow-sm', css: 'shadow-sm' },
              { name: 'shadow-md', css: 'shadow-md' },
            ].map(s => (
              <div key={s.name} className="text-center">
                <div className={`${s.css} bg-card border border-border rounded-xl w-24 h-24 flex items-center justify-center`}>
                  <p className="text-xs text-muted-foreground">{s.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}

// ─── Combined: Glass + Glow Card ─────────────────────────────

function CombinedSection() {
  return (
    <Section title="Gecombineerd: Glass + Glow">
      <p className="text-muted-foreground">Zo combineer je glassmorphism met glow voor het Shadow-effect.</p>

      <div className="relative rounded-xl overflow-hidden p-8"
        style={{
          background: 'linear-gradient(135deg, #52525B 0%, #18181B 50%, #3F3F46 100%)',
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['Feature One', 'Feature Two', 'Feature Three'].map((title, i) => (
            <motion.div
              key={title}
              className="glass rounded-xl p-6 glow-hover cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.smooth, delay: i * 0.1 }}
              whileHover={{ scale: 1.02, transition: springs.gentle }}
            >
              <h3 className="text-white text-lg mb-2">{title}</h3>
              <p className="text-white/60 text-sm">
                Glass card met glow-hover en spring animatie. Dit is het Shadow design patroon.
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  )
}

// ─── Main App ────────────────────────────────────────────────

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <DarkModeToggle />

      <div className="max-w-4xl mx-auto px-4 py-12 md:px-8 lg:px-12 space-y-16">
        {/* Header */}
        <header className="space-y-4">
          <h1 className="text-5xl">Shadow Huisstijl</h1>
          <p className="text-xl text-muted-foreground">
            Minimalistisch. Monochroom. Apple-achtig. Wow via beweging.
          </p>
          <div className="flex gap-2 flex-wrap">
            {['Zinc Only', 'Glassmorphism', 'Spring Physics', 'Monochrome Glow'].map(tag => (
              <span key={tag} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                {tag}
              </span>
            ))}
          </div>
        </header>

        {/* Sections */}
        <ColorSection />
        <TypographySection />
        <GlassSection />
        <GlowSection />
        <AnimationsSection />
        <CSSAnimationsSection />
        <FeedbackSection />
        <SpacingSection />
        <CombinedSection />

        {/* Footer */}
        <footer className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>Shadow Huisstijl Design System Preview</p>
          <p className="mt-1">~/.claude/design-system/</p>
        </footer>
      </div>
    </div>
  )
}

export default App
