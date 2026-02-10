'use client'

import { motion } from 'framer-motion'

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
}

interface StaggerGridProps {
  children: React.ReactNode
  className?: string
}

export function StaggerGrid({ children, className }: StaggerGridProps) {
  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={itemVariants}>
      {children}
    </motion.div>
  )
}
