import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { BlurItem } from '../types/drawing'

interface Props {
  items: BlurItem[]
}

type Rect = { x: number; y: number; width: number; height: number }

function normalize(item: BlurItem): Rect {
  return {
    x: item.width < 0 ? item.x + item.width : item.x,
    y: item.height < 0 ? item.y + item.height : item.y,
    width: Math.abs(item.width),
    height: Math.abs(item.height),
  }
}

export function ScreenBlurRegions({ items }: Props) {
  const canvasRefs = useRef(new Map<string, HTMLCanvasElement>())
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number | null>(null)
  const itemsRef = useRef(items)
  const [captureError, setCaptureError] = useState<string | null>(null)
  const scratch = useMemo(() => document.createElement('canvas'), [])

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    let isDisposed = false

    async function startCapture() {
      try {
        const source = await window.electronAPI.getScreenSource()
        if (!source) throw new Error('screen-source-not-found')

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            cursor: 'never',
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: source.id,
            },
          } as unknown as MediaTrackConstraints,
        })

        if (isDisposed) {
          stream.getTracks().forEach(track => track.stop())
          return
        }

        const video = document.createElement('video')
        video.muted = true
        video.playsInline = true
        video.srcObject = stream
        await video.play()

        videoRef.current = video
        streamRef.current = stream
        setCaptureError(null)
        drawFrame()
      } catch {
        setCaptureError('画面収録の権限が必要です')
      }
    }

    function drawFrame() {
      const video = videoRef.current
      if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
        frameRef.current = requestAnimationFrame(drawFrame)
        return
      }

      const videoScaleX = video.videoWidth / window.innerWidth
      const videoScaleY = video.videoHeight / window.innerHeight

      itemsRef.current.forEach(item => {
        const canvas = canvasRefs.current.get(item.id)
        if (!canvas) return

        const rect = normalize(item)
        const dpr = window.devicePixelRatio || 1
        canvas.width = Math.max(1, Math.round(rect.width * dpr))
        canvas.height = Math.max(1, Math.round(rect.height * dpr))
        canvas.style.width = `${rect.width}px`
        canvas.style.height = `${rect.height}px`

        const ctx = canvas.getContext('2d')
        const scratchCtx = scratch.getContext('2d')
        if (!ctx || !scratchCtx) return

        const mosaicCell = 14
        const smallWidth = Math.max(1, Math.ceil(rect.width / mosaicCell))
        const smallHeight = Math.max(1, Math.ceil(rect.height / mosaicCell))
        scratch.width = smallWidth
        scratch.height = smallHeight

        scratchCtx.clearRect(0, 0, smallWidth, smallHeight)
        scratchCtx.drawImage(
          video,
          rect.x * videoScaleX,
          rect.y * videoScaleY,
          rect.width * videoScaleX,
          rect.height * videoScaleY,
          0,
          0,
          smallWidth,
          smallHeight
        )

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, rect.width, rect.height)
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(scratch, 0, 0, smallWidth, smallHeight, 0, 0, rect.width, rect.height)
        ctx.imageSmoothingEnabled = true
      })

      frameRef.current = requestAnimationFrame(drawFrame)
    }

    startCapture()

    return () => {
      isDisposed = true
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
      streamRef.current?.getTracks().forEach(track => track.stop())
      streamRef.current = null
      videoRef.current = null
    }
  }, [scratch])

  return (
    <>
      {items.map(item => {
        const rect = normalize(item)
        return (
          <canvas
            key={item.id}
            ref={node => {
              if (node) canvasRefs.current.set(item.id, node)
              else canvasRefs.current.delete(item.id)
            }}
            className="blur-region"
            style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
          />
        )
      })}
      {captureError && <div className="blur-capture-error">{captureError}</div>}
    </>
  )
}
