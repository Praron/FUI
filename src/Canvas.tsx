import { useRef, useEffect } from 'react'

export type DrawFunction = (ctx: CanvasRenderingContext2D, frameCount: number) => void
const useCanvas = (draw: DrawFunction) => {

  const canvasRef = useRef(null as HTMLCanvasElement | null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const context = canvas.getContext('2d')!
    let frameCount = 0
    let animationFrameId: number

    const render = () => {
      frameCount++
      draw(context, frameCount)
      animationFrameId = window.requestAnimationFrame(render)
    }
    render()

    return () => {
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [draw])

  return canvasRef
}

const Canvas = props => {

  const { draw, ...rest } = props
  const canvasRef = useCanvas(draw)

  return <canvas ref={canvasRef} {...rest}/>
}

export default Canvas
