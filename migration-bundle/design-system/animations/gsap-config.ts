/**
 * Shadow Huisstijl - GSAP Configuration
 *
 * Defaults and utilities for GSAP animations
 */

import gsap from 'gsap'

/**
 * Default GSAP settings
 */
export const gsapDefaults = {
  duration: 0.3,
  ease: 'power2.out',
} as const

/**
 * GSAP ease presets
 */
export const gsapEases = {
  /** Standard ease-out */
  out: 'power2.out',
  /** Snappy ease-out */
  outSnappy: 'power3.out',
  /** Bouncy ease */
  bounce: 'back.out(1.2)',
  /** Elastic ease */
  elastic: 'elastic.out(1, 0.5)',
  /** Smooth ease in-out */
  inOut: 'power2.inOut',
  /** Linear (no easing) */
  linear: 'none',
} as const

/**
 * Initialize GSAP with defaults
 */
export function initGsap() {
  gsap.defaults({
    duration: gsapDefaults.duration,
    ease: gsapDefaults.ease,
  })
}

/**
 * Quick fade in animation
 */
export function fadeIn(
  target: gsap.TweenTarget,
  options?: gsap.TweenVars
): gsap.core.Tween {
  return gsap.fromTo(
    target,
    { opacity: 0 },
    {
      opacity: 1,
      duration: 0.2,
      ...options,
    }
  )
}

/**
 * Quick fade out animation
 */
export function fadeOut(
  target: gsap.TweenTarget,
  options?: gsap.TweenVars
): gsap.core.Tween {
  return gsap.to(target, {
    opacity: 0,
    duration: 0.15,
    ...options,
  })
}

/**
 * Slide and fade in from bottom
 */
export function slideInUp(
  target: gsap.TweenTarget,
  options?: gsap.TweenVars
): gsap.core.Tween {
  return gsap.fromTo(
    target,
    { opacity: 0, y: 20 },
    {
      opacity: 1,
      y: 0,
      duration: 0.3,
      ease: gsapEases.outSnappy,
      ...options,
    }
  )
}

/**
 * Scale in animation
 */
export function scaleIn(
  target: gsap.TweenTarget,
  options?: gsap.TweenVars
): gsap.core.Tween {
  return gsap.fromTo(
    target,
    { opacity: 0, scale: 0.95 },
    {
      opacity: 1,
      scale: 1,
      duration: 0.25,
      ease: gsapEases.outSnappy,
      ...options,
    }
  )
}

/**
 * Stagger animation for lists
 */
export function staggerIn(
  targets: gsap.TweenTarget,
  options?: gsap.TweenVars & { stagger?: number }
): gsap.core.Tween {
  const { stagger = 0.05, ...rest } = options || {}

  return gsap.fromTo(
    targets,
    { opacity: 0, y: 10 },
    {
      opacity: 1,
      y: 0,
      duration: 0.25,
      stagger,
      ease: gsapEases.out,
      ...rest,
    }
  )
}
