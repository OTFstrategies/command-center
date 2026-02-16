/**
 * Shadow Huisstijl - Framer Motion Variants
 *
 * Reusable animation variants for common patterns
 */

import type { Variants } from 'framer-motion'
import { springs, durations, easings } from './framer-config'

/**
 * Fade in/out variants
 */
export const fadeVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: durations.normal,
      ease: easings.out,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: durations.fast,
      ease: easings.in,
    },
  },
}

/**
 * Scale + fade variants (for dialogs, modals)
 */
export const scaleVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: durations.fast,
      ease: easings.in,
    },
  },
}

/**
 * Slide up + fade variants (for toasts, notifications)
 */
export const slideUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.bouncy,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: durations.fast,
      ease: easings.in,
    },
  },
}

/**
 * Slide down + fade variants
 */
export const slideDownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: {
      duration: durations.fast,
      ease: easings.in,
    },
  },
}

/**
 * Card hover variants
 */
export const cardHoverVariants: Variants = {
  initial: {
    scale: 1,
    y: 0,
  },
  hover: {
    scale: 1.02,
    y: -2,
    transition: springs.gentle,
  },
  tap: {
    scale: 0.98,
    transition: springs.snappy,
  },
}

/**
 * Card drag variants
 */
export const cardDragVariants: Variants = {
  idle: {
    scale: 1,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  dragging: {
    scale: 1.05,
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
    cursor: 'grabbing',
    transition: springs.snappy,
  },
}

/**
 * Button variants (tap/hover)
 */
export const buttonVariants: Variants = {
  initial: {
    scale: 1,
  },
  hover: {
    scale: 1.02,
    transition: springs.gentle,
  },
  tap: {
    scale: 0.97,
    transition: springs.snappy,
  },
}

/**
 * List container variants (for staggered children)
 */
export const listContainerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
}

/**
 * List item variants (used with listContainerVariants)
 */
export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: durations.fast,
    },
  },
}

/**
 * Collapse/expand variants
 */
export const collapseVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    overflow: 'hidden',
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    overflow: 'visible',
    transition: springs.smooth,
  },
}

/**
 * Page transition variants
 */
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: durations.fast,
      ease: easings.in,
    },
  },
}

/**
 * Glass reveal variants (glassmorphism fade-in)
 */
export const glassRevealVariants: Variants = {
  hidden: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
  },
  visible: {
    opacity: 1,
    backdropFilter: 'blur(30px)',
    transition: {
      duration: durations.slow,
      ease: easings.out,
    },
  },
  exit: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
    transition: {
      duration: durations.fast,
      ease: easings.in,
    },
  },
}

/**
 * Glow pulse variants (subtle ambient glow)
 */
export const glowPulseVariants: Variants = {
  idle: {
    boxShadow: '0 0 15px rgba(255, 255, 255, 0.06)',
  },
  pulse: {
    boxShadow: [
      '0 0 15px rgba(255, 255, 255, 0.06)',
      '0 0 25px rgba(255, 255, 255, 0.1)',
      '0 0 15px rgba(255, 255, 255, 0.06)',
    ],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}
