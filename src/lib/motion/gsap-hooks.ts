/**
 * Shadow Huisstijl - GSAP React Hooks
 *
 * Custom hooks for GSAP animations in React
 */

import { useRef, useEffect, useCallback } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { gsapEases, fadeIn, slideInUp, staggerIn } from './gsap-config'

// Register GSAP plugin
gsap.registerPlugin(useGSAP)

/**
 * Hook for fade-in animation on mount
 */
export function useFadeIn<T extends HTMLElement = HTMLElement>(
  options?: gsap.TweenVars
) {
  const ref = useRef<T>(null)

  useGSAP(
    () => {
      if (ref.current) {
        fadeIn(ref.current, options)
      }
    },
    { scope: ref, dependencies: [] }
  )

  return ref
}

/**
 * Hook for slide-up animation on mount
 */
export function useSlideInUp<T extends HTMLElement = HTMLElement>(
  options?: gsap.TweenVars
) {
  const ref = useRef<T>(null)

  useGSAP(
    () => {
      if (ref.current) {
        slideInUp(ref.current, options)
      }
    },
    { scope: ref, dependencies: [] }
  )

  return ref
}

/**
 * Hook for staggered children animation
 */
export function useStaggerChildren<T extends HTMLElement = HTMLElement>(
  selector: string = '> *',
  options?: gsap.TweenVars & { stagger?: number }
) {
  const ref = useRef<T>(null)

  useGSAP(
    () => {
      if (ref.current) {
        const children = ref.current.querySelectorAll(selector)
        if (children.length > 0) {
          staggerIn(children, options)
        }
      }
    },
    { scope: ref, dependencies: [] }
  )

  return ref
}

/**
 * Hook for page transition animation
 */
export function usePageTransition<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null)

  useGSAP(
    () => {
      if (ref.current) {
        gsap.fromTo(
          ref.current,
          { opacity: 0, y: 8 },
          {
            opacity: 1,
            y: 0,
            duration: 0.35,
            ease: gsapEases.out,
          }
        )
      }
    },
    { scope: ref, dependencies: [] }
  )

  return ref
}

/**
 * Hook for hover scale animation
 */
export function useHoverScale<T extends HTMLElement = HTMLElement>(
  scale: number = 1.02
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onEnter = () => {
      gsap.to(el, {
        scale,
        duration: 0.2,
        ease: gsapEases.out,
      })
    }

    const onLeave = () => {
      gsap.to(el, {
        scale: 1,
        duration: 0.15,
        ease: gsapEases.out,
      })
    }

    el.addEventListener('mouseenter', onEnter)
    el.addEventListener('mouseleave', onLeave)

    return () => {
      el.removeEventListener('mouseenter', onEnter)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [scale])

  return ref
}

/**
 * Hook for tap/click scale animation
 */
export function useTapScale<T extends HTMLElement = HTMLElement>(
  scale: number = 0.97
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onDown = () => {
      gsap.to(el, {
        scale,
        duration: 0.1,
        ease: gsapEases.out,
      })
    }

    const onUp = () => {
      gsap.to(el, {
        scale: 1,
        duration: 0.15,
        ease: gsapEases.bounce,
      })
    }

    el.addEventListener('mousedown', onDown)
    el.addEventListener('mouseup', onUp)
    el.addEventListener('mouseleave', onUp)

    return () => {
      el.removeEventListener('mousedown', onDown)
      el.removeEventListener('mouseup', onUp)
      el.removeEventListener('mouseleave', onUp)
    }
  }, [scale])

  return ref
}

/**
 * Hook for GSAP timeline with cleanup
 */
export function useTimeline(config?: gsap.TimelineVars) {
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    timelineRef.current = gsap.timeline({
      paused: true,
      ...config,
    })

    return () => {
      timelineRef.current?.kill()
    }
  }, [])

  const play = useCallback(() => {
    timelineRef.current?.play()
  }, [])

  const reverse = useCallback(() => {
    timelineRef.current?.reverse()
  }, [])

  const restart = useCallback(() => {
    timelineRef.current?.restart()
  }, [])

  return {
    timeline: timelineRef,
    play,
    reverse,
    restart,
  }
}
