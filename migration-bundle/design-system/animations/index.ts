/**
 * Shadow Huisstijl - Motion Library
 *
 * Dual animation system: Framer Motion + GSAP
 *
 * Usage:
 *   import { MotionCard, springs, useFadeIn } from '<design-system>/animations'
 *
 * Recommendations:
 * - Use Framer Motion for: hover/tap states, presence animations, drag
 * - Use GSAP for: complex sequences, scroll animations, precise control
 */

// Framer Motion exports
export {
  springs,
  durations,
  easings,
  transitions,
} from './framer-config'

export {
  fadeVariants,
  scaleVariants,
  slideUpVariants,
  slideDownVariants,
  cardHoverVariants,
  cardDragVariants,
  buttonVariants,
  listContainerVariants,
  listItemVariants,
  collapseVariants,
  pageVariants,
  glassRevealVariants,
  glowPulseVariants,
} from './framer-variants'

export {
  MotionCard,
  MotionButton,
  MotionList,
  MotionListItem,
  Fade,
  ScaleIn,
  SlideUp,
  PageTransition,
  Presence,
  Draggable,
  type MotionCardProps,
  type MotionButtonProps,
  type MotionListProps,
  type FadeProps,
  type ScaleInProps,
  type SlideUpProps,
  type PresenceProps,
  type DraggableProps,
} from './framer-components'

// GSAP exports
export {
  gsapDefaults,
  gsapEases,
  initGsap,
  fadeIn,
  fadeOut,
  slideInUp,
  scaleIn,
  staggerIn,
} from './gsap-config'

export {
  useFadeIn,
  useSlideInUp,
  useStaggerChildren,
  usePageTransition,
  useHoverScale,
  useTapScale,
  useTimeline,
} from './gsap-hooks'

// Re-export motion and AnimatePresence for convenience
export { motion, AnimatePresence } from 'framer-motion'
