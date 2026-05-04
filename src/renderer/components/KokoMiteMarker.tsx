import React, { useEffect } from 'react'
import type { MarkerItem } from '../types/drawing'

interface Props {
  markers: MarkerItem[]
  onExpire: (id: string) => void
}

export function KokoMiteMarker({ markers, onExpire }: Props) {
  return (
    <>
      {markers.map(marker => (
        <SingleMarker key={marker.id} marker={marker} onExpire={onExpire} />
      ))}
    </>
  )
}

function SingleMarker({
  marker,
  onExpire,
}: {
  marker: MarkerItem
  onExpire: (id: string) => void
}) {
  useEffect(() => {
    const timer = setTimeout(() => onExpire(marker.id), marker.durationMs)
    return () => clearTimeout(timer)
  }, [marker.id, marker.durationMs, onExpire])

  return (
    <div
      style={{
        position: 'fixed',
        left: marker.x,
        top: marker.y,
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      <div className="koko-mite-focus-ring" />
      <div className="koko-mite-label">{marker.label}</div>
    </div>
  )
}
