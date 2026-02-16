'use client'

import { useRef, useCallback, useMemo, useEffect, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import type { MapData, MapNode } from '@/types'

// Node shape + color mapping
const typeColors: Record<string, string> = {
  project: '#71717a',     // zinc-500
  agent: '#a1a1aa',       // zinc-400
  command: '#d4d4d8',     // zinc-300
  skill: '#52525b',       // zinc-600
  plugin: '#3f3f46',      // zinc-700
  api: '#a1a1aa',         // zinc-400
  instruction: '#d4d4d8', // zinc-300
  prompt: '#71717a',      // zinc-500
  'design-system': '#fafafa', // zinc-50
  service: '#e4e4e7',     // zinc-200
  cluster: '#27272a',     // zinc-800
}

const typeShapes: Record<string, string> = {
  project: 'circle',
  agent: 'hexagon',
  command: 'square',
  skill: 'diamond',
  plugin: 'roundedSquare',
  api: 'triangle',
  instruction: 'dash',
  prompt: 'circle',
  'design-system': 'star',
  service: 'triangle',
  cluster: 'circle',
}

interface FullGraphViewProps {
  data: MapData
  highlightedItems: Set<string>
  onNodeClick: (node: MapNode) => void
}

interface GraphNode extends MapNode {
  x?: number
  y?: number
  vx?: number
  vy?: number
}

interface GraphLink {
  source: string | GraphNode
  target: string | GraphNode
  relationship: string
  strength: number
}

export function FullGraphView({ data, highlightedItems, onNodeClick }: FullGraphViewProps) {
  const graphRef = useRef<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  // Convert data to graph format
  const graphData = useMemo(() => {
    const nodes: GraphNode[] = data.nodes.map((n) => ({ ...n }))
    const nodeIds = new Set(nodes.map((n) => n.id))

    const links: GraphLink[] = data.edges
      .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map((e) => ({
        source: e.source,
        target: e.target,
        relationship: e.relationship,
        strength: e.strength,
      }))

    return { nodes, links }
  }, [data])

  // Resize observer
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: Math.max(500, entry.contentRect.height),
        })
      }
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Custom node rendering
  const paintNode = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D) => {
      const isHighlighted = highlightedItems.size === 0 || highlightedItems.has(node.id)
      const baseSize = (node.size || 1) * 3
      const color = typeColors[node.type] || '#71717a'
      const alpha = isHighlighted ? 1 : 0.2

      ctx.globalAlpha = alpha

      // Draw shape
      const shape = typeShapes[node.type] || 'circle'
      ctx.fillStyle = color
      ctx.strokeStyle = isHighlighted ? '#18181b' : '#52525b'
      ctx.lineWidth = isHighlighted ? 1.5 : 0.5

      switch (shape) {
        case 'circle':
          ctx.beginPath()
          ctx.arc(node.x!, node.y!, baseSize, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
          break

        case 'hexagon': {
          const a = baseSize
          ctx.beginPath()
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6
            const x = node.x! + a * Math.cos(angle)
            const y = node.y! + a * Math.sin(angle)
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.closePath()
          ctx.fill()
          ctx.stroke()
          break
        }

        case 'square':
          ctx.fillRect(node.x! - baseSize, node.y! - baseSize, baseSize * 2, baseSize * 2)
          ctx.strokeRect(node.x! - baseSize, node.y! - baseSize, baseSize * 2, baseSize * 2)
          break

        case 'diamond':
          ctx.beginPath()
          ctx.moveTo(node.x!, node.y! - baseSize * 1.2)
          ctx.lineTo(node.x! + baseSize, node.y!)
          ctx.lineTo(node.x!, node.y! + baseSize * 1.2)
          ctx.lineTo(node.x! - baseSize, node.y!)
          ctx.closePath()
          ctx.fill()
          ctx.stroke()
          break

        case 'roundedSquare': {
          const r = baseSize * 0.3
          const s = baseSize
          ctx.beginPath()
          ctx.moveTo(node.x! - s + r, node.y! - s)
          ctx.lineTo(node.x! + s - r, node.y! - s)
          ctx.quadraticCurveTo(node.x! + s, node.y! - s, node.x! + s, node.y! - s + r)
          ctx.lineTo(node.x! + s, node.y! + s - r)
          ctx.quadraticCurveTo(node.x! + s, node.y! + s, node.x! + s - r, node.y! + s)
          ctx.lineTo(node.x! - s + r, node.y! + s)
          ctx.quadraticCurveTo(node.x! - s, node.y! + s, node.x! - s, node.y! + s - r)
          ctx.lineTo(node.x! - s, node.y! - s + r)
          ctx.quadraticCurveTo(node.x! - s, node.y! - s, node.x! - s + r, node.y! - s)
          ctx.closePath()
          ctx.fill()
          ctx.stroke()
          break
        }

        case 'triangle':
          ctx.beginPath()
          ctx.moveTo(node.x!, node.y! - baseSize * 1.2)
          ctx.lineTo(node.x! + baseSize, node.y! + baseSize * 0.7)
          ctx.lineTo(node.x! - baseSize, node.y! + baseSize * 0.7)
          ctx.closePath()
          ctx.fill()
          ctx.stroke()
          break

        case 'star': {
          const spikes = 5
          const outerR = baseSize * 1.2
          const innerR = baseSize * 0.5
          ctx.beginPath()
          for (let i = 0; i < spikes * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR
            const angle = (Math.PI / spikes) * i - Math.PI / 2
            const x = node.x! + r * Math.cos(angle)
            const y = node.y! + r * Math.sin(angle)
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.closePath()
          ctx.fill()
          ctx.stroke()
          break
        }

        case 'dash':
          ctx.fillRect(node.x! - baseSize * 1.5, node.y! - 2, baseSize * 3, 4)
          break

        default:
          ctx.beginPath()
          ctx.arc(node.x!, node.y!, baseSize, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
      }

      // Draw label
      if (isHighlighted || node.size >= 3) {
        ctx.globalAlpha = isHighlighted ? 0.9 : 0.4
        ctx.font = `${isHighlighted ? '10px' : '8px'} Inter, sans-serif`
        ctx.fillStyle = '#18181b'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        const label = node.name.length > 20 ? node.name.substring(0, 18) + '...' : node.name
        ctx.fillText(label, node.x!, node.y! + baseSize + 3)
      }

      ctx.globalAlpha = 1
    },
    [highlightedItems]
  )

  // Custom link rendering
  const paintLink = useCallback(
    (link: GraphLink, ctx: CanvasRenderingContext2D) => {
      const source = link.source as GraphNode
      const target = link.target as GraphNode
      if (!source.x || !target.x) return

      const isHighlighted =
        highlightedItems.size === 0 ||
        highlightedItems.has(source.id) ||
        highlightedItems.has(target.id)

      ctx.globalAlpha = isHighlighted ? 0.4 : 0.05
      ctx.strokeStyle = '#71717a'
      ctx.lineWidth = link.strength * 0.5

      if (link.relationship === 'parent_of') {
        ctx.setLineDash([])
      } else if (link.relationship === 'related_to') {
        ctx.setLineDash([2, 4])
      } else {
        ctx.setLineDash([])
      }

      ctx.beginPath()
      ctx.moveTo(source.x, source.y!)
      ctx.lineTo(target.x, target.y!)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.globalAlpha = 1
    },
    [highlightedItems]
  )

  return (
    <div
      ref={containerRef}
      className="h-[600px] overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/80 backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/80"
    >
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        nodeCanvasObject={paintNode}
        linkCanvasObject={paintLink}
        nodeId="id"
        onNodeClick={(node) => onNodeClick(node as MapNode)}
        cooldownTicks={100}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        linkDirectionalParticles={0}
        enableZoomInteraction
        enablePanInteraction
        backgroundColor="transparent"
      />
    </div>
  )
}
