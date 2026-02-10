/**
 * Shadow Huisstijl - Framer Motion Components
 *
 * Pre-configured motion components with common animation patterns
 */

import { forwardRef, type ReactNode } from 'react'
import { motion, AnimatePresence, type HTMLMotionProps } from 'framer-motion'
import {
  fadeVariants,
  scaleVariants,
  slideUpVariants,
  cardHoverVariants,
  buttonVariants,
  listContainerVariants,
  listItemVariants,
  pageVariants,
} from './framer-variants'
import { springs } from './framer-config'
import { cn } from '../utils'

/**
 * Animated card with hover and tap effects
 */
export interface MotionCardProps extends HTMLMotionProps<'div'> {
  /** Enable hover animation */
  hoverEffect?: boolean
  /** Enable tap animation */
  tapEffect?: boolean
}

export const MotionCard = forwardRef<HTMLDivElement, MotionCardProps>(
  ({ hoverEffect = true, tapEffect = true, className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial="initial"
        whileHover={hoverEffect ? 'hover' : undefined}
        whileTap={tapEffect ? 'tap' : undefined}
        variants={cardHoverVariants}
        className={cn('cursor-pointer', className)}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
MotionCard.displayName = 'MotionCard'

/**
 * Animated button with scale effects
 */
export interface MotionButtonProps extends HTMLMotionProps<'button'> {
  /** Disable animations */
  disabled?: boolean
}

export const MotionButton = forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ disabled, className, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        initial="initial"
        whileHover={disabled ? undefined : 'hover'}
        whileTap={disabled ? undefined : 'tap'}
        variants={buttonVariants}
        className={className}
        disabled={disabled}
        {...props}
      >
        {children}
      </motion.button>
    )
  }
)
MotionButton.displayName = 'MotionButton'

/**
 * Animated list container (use with MotionListItem)
 */
export interface MotionListProps extends HTMLMotionProps<'div'> {
  /** Unique key for AnimatePresence */
  listKey?: string
}

export const MotionList = forwardRef<HTMLDivElement, MotionListProps>(
  ({ listKey, className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        key={listKey}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={listContainerVariants}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
MotionList.displayName = 'MotionList'

/**
 * Animated list item (use inside MotionList)
 */
export const MotionListItem = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={listItemVariants}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
MotionListItem.displayName = 'MotionListItem'

/**
 * Fade in/out wrapper
 */
export interface FadeProps extends HTMLMotionProps<'div'> {
  /** Show/hide the content */
  show?: boolean
}

export const Fade = forwardRef<HTMLDivElement, FadeProps>(
  ({ show = true, className, children, ...props }, ref) => {
    return (
      <AnimatePresence mode="wait">
        {show && (
          <motion.div
            ref={ref}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={fadeVariants}
            className={className}
            {...props}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    )
  }
)
Fade.displayName = 'Fade'

/**
 * Scale in/out wrapper (for dialogs, modals)
 */
export interface ScaleInProps extends HTMLMotionProps<'div'> {
  /** Show/hide the content */
  show?: boolean
}

export const ScaleIn = forwardRef<HTMLDivElement, ScaleInProps>(
  ({ show = true, className, children, ...props }, ref) => {
    return (
      <AnimatePresence mode="wait">
        {show && (
          <motion.div
            ref={ref}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={scaleVariants}
            className={className}
            {...props}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    )
  }
)
ScaleIn.displayName = 'ScaleIn'

/**
 * Slide up wrapper (for toasts, notifications)
 */
export interface SlideUpProps extends HTMLMotionProps<'div'> {
  /** Show/hide the content */
  show?: boolean
}

export const SlideUp = forwardRef<HTMLDivElement, SlideUpProps>(
  ({ show = true, className, children, ...props }, ref) => {
    return (
      <AnimatePresence mode="wait">
        {show && (
          <motion.div
            ref={ref}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={slideUpVariants}
            className={className}
            {...props}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    )
  }
)
SlideUp.displayName = 'SlideUp'

/**
 * Page wrapper with enter/exit animations
 */
export const PageTransition = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
PageTransition.displayName = 'PageTransition'

/**
 * Presence wrapper for conditional rendering with animations
 */
export interface PresenceProps {
  /** Show/hide the content */
  show: boolean
  children: ReactNode
  /** Animation mode */
  mode?: 'wait' | 'sync' | 'popLayout'
}

export function Presence({ show, children, mode = 'wait' }: PresenceProps) {
  return (
    <AnimatePresence mode={mode}>
      {show && children}
    </AnimatePresence>
  )
}

/**
 * Draggable wrapper with visual feedback
 */
export interface DraggableProps extends HTMLMotionProps<'div'> {
  /** Called when drag ends with position */
  onDragComplete?: (info: { x: number; y: number }) => void
}

export const Draggable = forwardRef<HTMLDivElement, DraggableProps>(
  ({ onDragComplete, className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        drag
        dragMomentum={false}
        whileDrag={{
          scale: 1.05,
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          cursor: 'grabbing',
        }}
        onDragEnd={(_, info) => {
          onDragComplete?.({ x: info.point.x, y: info.point.y })
        }}
        transition={springs.snappy}
        className={cn('cursor-grab active:cursor-grabbing', className)}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
Draggable.displayName = 'Draggable'
