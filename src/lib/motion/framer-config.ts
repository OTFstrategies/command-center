/**
 * Huisstijl - Framer Motion Spring Configurations
 *
 * Notion/Linear-style spring presets for playful, modern animations
 */

import type { Transition } from 'framer-motion'

/**
 * Spring presets for different use cases
 *
 * - snappy: Quick feedback (buttons, toggles)
 * - smooth: Dialogs, panels, expanding content
 * - bouncy: Playful elements, notifications
 * - gentle: Subtle movements, hover states
 */
export const springs = {
  /** Fast, responsive - buttons, quick feedback */
  snappy: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 30,
    mass: 1,
  },

  /** Balanced - dialogs, panels, cards */
  smooth: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 25,
    mass: 1,
  },

  /** Playful - toasts, notifications, fun elements */
  bouncy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 15,
    mass: 1,
  },

  /** Subtle - hover states, micro-interactions */
  gentle: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 20,
    mass: 1,
  },
} satisfies Record<string, Transition>

/**
 * Duration-based transitions (for when springs aren't needed)
 */
export const durations = {
  instant: 0.1,
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
  verySlow: 0.5,
} as const

/**
 * Easing curves
 */
export const easings = {
  /** Standard ease-out for exits */
  out: [0.22, 1, 0.36, 1],
  /** Standard ease-in for entries */
  in: [0.55, 0, 1, 0.45],
  /** Smooth in-out for continuous motion */
  inOut: [0.65, 0, 0.35, 1],
} as const

/**
 * Common transition presets
 */
export const transitions = {
  /** Default transition for most elements */
  default: springs.smooth,

  /** Fast transition for interactive elements */
  fast: springs.snappy,

  /** Bouncy transition for attention-grabbing elements */
  bounce: springs.bouncy,

  /** Fade transition */
  fade: {
    duration: durations.normal,
    ease: easings.out,
  },

  /** Scale transition */
  scale: {
    ...springs.smooth,
  },

  /** Stagger children animation */
  stagger: {
    staggerChildren: 0.05,
    delayChildren: 0.1,
  },
} as const
