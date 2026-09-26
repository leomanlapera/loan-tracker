import { cn } from 'cn'

interface Props {
  points: number[]
  width?: number
  height?: number
  className?: string
  strokeWidth?: number
  ariaLabel?: string
}

export function Sparkline({
  points,
  width = 72,
  height = 20,
  className,
  strokeWidth = 1.25,
  ariaLabel,
}: Props) {
  if (points.length < 2) return null

  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const stepX = width / (points.length - 1)
  const pad = strokeWidth

  const coords = points.map((v, i) => {
    const x = i * stepX
    const y = pad + ((max - v) / range) * (height - 2 * pad)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const polyline = coords.join(' ')
  const area = `${coords[0].split(',')[0]},${height} ${polyline} ${coords[coords.length - 1].split(',')[0]},${height}`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      className={cn('overflow-visible', className)}
    >
      <polygon points={area} className="fill-primary/10" />
      <polyline
        points={polyline}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-primary"
      />
    </svg>
  )
}
