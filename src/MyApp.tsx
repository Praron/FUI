import { useConditionalTimeout, useResizeObserver } from 'beautiful-react-hooks'
import React, {
  FC,
  forwardRef,
  MouseEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'
import ReactSlider from 'react-slider'
import {
  animated,
  useChain,
  useSpring,
  useSpringRef,
  useTransition,
  config,
  SpringValue,
} from 'react-spring'

const useInterval = (callback: () => void, delay: number | null) => {
  const savedCallback = useRef(undefined as (() => void) | undefined)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (delay !== null) {
      let id = setInterval(() => savedCallback.current!(), delay)
      return () => clearInterval(id)
    }
  }, [delay])
}

type Point3D = { x: number; y: number; z: number }
const range = (r: number) => [...Array(r).keys()]
const phi = Math.PI * (3 - 5 ** 0.5) // Golden angle in radians
const fibonacciSphere = (angle = 0, samples = 100): Point3D[] =>
  range(samples).map((i) => {
    const y = 1 - (i / (samples - 1)) * 2
    const radius = (1 - y ** 2) ** 0.5
    const theta = phi * i
    const x = Math.cos(theta + angle) * radius
    const z = Math.sin(theta + angle) * radius
    return { x, y, z }
  })

const Point = ({ point }: { point: Point3D }) => (
  <div
    className='w-1 h-1 absolute bg-white rounded-full'
    style={{
      transformStyle: 'preserve-3d',
      transform: `translate3D(${point.x}px, ${point.y}px, ${point.z}px)`,
      opacity: (point.z + 1) / 100,
    }}
  />
)

const SphereBox = (props) => {
  const [angle, setAngle] = useState(0)
  const [hovered, setHovered] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const rect = useResizeObserver(ref)

  useInterval(
    () => {
      setAngle((a) => a + 0.01)
    },
    hovered ? null : 25
  )

  const onMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    setAngle(((-event.pageX / 2) * Math.PI) / 180)
  }

  const width = rect?.width ?? 150
  const height = width
  const sphere = fibonacciSphere(angle, 150).map((p) => ({
    x: width / 2 + (p.x * width) / 2,
    y: height / 2 + (p.y * height) / 2,
    z: width / 2 + (p.z * width) / 2,
  }))

  return (
    <div ref={ref} className='w-full h-full flex flex-col place-content-center'>
      <div
        onMouseMove={onMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className='w-full h-fit relative aspect-square'
      >
        {sphere.map((p, i) => (
          <Point key={i} point={p} />
        ))}
      </div>
    </div>
  )
}

/* const CanvasBox = () => {
 *   const { css } = useFela()
 *
 *   const draw = (ctx: CanvasRenderingContext2D, frameCount: number) => {
 *     const { width, height } = ctx.canvas
 *     ctx.clearRect(0, 0, width, height)
 *     ctx.fillStyle = '#ffffff'
 *     ctx.beginPath()
 *
 *     ctx.fill()
 *   }
 *   return (
 *     <Canvas className={css({ width: '10rem', height: '10rem' })} draw={draw} />
 *   )
 * } */

const Box = ({
  className = null,
  size = '10rem',
}: {
  className?: string | null
  size?: string
}) => (
  <div
    className={`border-4 border-white ${className}`}
    style={{
      width: size,
      height: size,
    }}
  />
)

const Track = forwardRef((props, ref) => (
  <animated.div
    {...props}
    ref={ref}
    className={`w-full bg-black border-4 border-white
     ${props.position === 'top' && 'border-b-0'}
     ${props.position === 'bottom' && 'border-y-0'}
     ${props.className}`}
  >
    {props.children}
  </animated.div>
))

const Thumb = forwardRef((props, ref) => (
  <animated.div
    {...props}
    style={{ ...props.style, ...props.animation }}
    ref={ref}
    className={`w-10 h-10 bg-black border-4 border-white border-x-0 cursor-grab focus:outline-none ${props.className}`}
  />
))

const renderTrack = (props, state) => (
  <Track {...props} position={state.index === 0 ? 'top' : 'bottom'} />
)
const renderThumb = (props, state) => <Thumb {...props} />

const SliderIndicator = ({ value, style }: { value: number; style?: any }) => (
  <animated.div className='w-10 h-10 text-center text-2xl' style={style}>
    {value}
  </animated.div>
)

const Slider = (props) => {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (props.defaultValue) {
      setValue(props.defaultValue)
    }
  }, [])

  const onChange = (v: number) => {
    setValue(v)
    props.onChange?.(v)
  }
  return (
    <div className='h-full flex flex-col'>
      <SliderIndicator value={value} />
      <ReactSlider
        {...props}
        className='h-full w-10'
        orientation='vertical'
        renderTrack={renderTrack}
        renderThumb={renderThumb}
        snapDragDisabled
        onChange={onChange}
      />
    </div>
  )
}

const FakeSliderPattern = (props) => {
  const spring = useSpring({
    from: { width: props.index === 1 ? '100%' : '0%' },
    to: { width: '100%' },
    delay: 1000 - 200 * (props.index ?? 0),
    config: { duration: 500 },
  })
  return (
    <animated.div
      className={`h-full pattern-diagonal-lines
        ${props.className}`}
      style={{ width: spring.width }}
    />
  )
}
const FakeSlider = (props) => {
  const [completed, setCompleted] = useState(false)
  const indicatorSpring = useSpring({
    from: { opacity: 1 },
    to: {
      opacity: props.completed ? 0 : 1,
    },
    config: { duration: 500 },
  })
  const onRest = () => {
    setCompleted(true)
    props.onComplete?.()
  }
  const sliderSpring = useSpring({
    from: { height: '7.5%' },
    to: { height: props.completed ? '100%' : '7.5%' },
    delay: 2000 + 200 * (props.index ?? 0),
    // config: { tension: 25, clamp: true },
    config: { duration: 1000 },
    onRest,
  })
  return (
    <div className='flex flex-col'>
      <SliderIndicator
        value={props.value}
        style={{
          height: indicatorSpring.opacity.to([0, 1], ['0rem', '2.5rem']),
        }}
      />
      <Track
        className={`${completed && 'border-b-0'}`}
        position='top'
        style={{
          flexGrow: props.value,
          borderTopWidth: indicatorSpring.opacity.to((v) =>
            v < 0.05 ? '0' : '4px'
          ),
        }}
      >
        <FakeSliderPattern index={props.index} completed={props.completed} />
      </Track>
      <Thumb
        className='cursor-not-allowed'
        animation={{ height: sliderSpring.height }}
      />
      <Track
        className={`relative ${completed && 'border-t-0'}`}
        position='bottom'
        style={{ flexGrow: 100 - props.value }}
      >
        <FakeSliderPattern
          className='absolute right-0'
          index={props.index}
          completed={props.completed}
        />
      </Track>
    </div>
  )
}

const numberOfSliders = 5
// const defaultSliderValues = range(numberOfSliders).map((i) => i === 1 ? 50 : (i + 75) ** 6 % 100)
const defaultSliderValues: number[] = range(numberOfSliders).map((i) =>
  i === 0 ? 45 : 50
)

const Sliders = (props) => {
  const [values, setValues] = useState(defaultSliderValues)
  const [completed, setCompleted] = useState(false)
  const [animationIsCompleted, setAnimationIsCompleted] = useState(false)

  useConditionalTimeout(() => props.onComplete?.(), 1500, animationIsCompleted)

  const checkCompleted = () => {
    setCompleted(values.every((v) => Math.abs(50 - v) < 4))
  }

  useEffect(checkCompleted, [values])

  const onValueChange = (value: number, index: number) => {
    setValues(values.map((v, i) => (i === index ? value : v)))
  }

  return (
    <div className='w-full h-full flex justify-around'>
      {completed
        ? range(numberOfSliders).map((i) => (
            <FakeSlider
              key={i * 10}
              value={values[i]}
              index={i}
              completed
              onComplete={
                i === numberOfSliders - 1
                  ? () => setAnimationIsCompleted(true)
                  : undefined
              }
            />
          ))
        : range(numberOfSliders).map((i) =>
            i === 1 ? (
              <FakeSlider key={i} index={i} value={defaultSliderValues[i]} />
            ) : (
              <Slider
                key={i}
                defaultValue={defaultSliderValues[i]}
                onAfterChange={(v) => onValueChange(v, i)}
              />
            )
          )}
    </div>
  )
}

const Puzzles = () => {
  const [toggle, setToggle] = useState(false)
  const [showReward, setShowReward] = useState(false)
  const curtainWidthSpringRef = useSpringRef()
  const curtainWidthSpring = useSpring({
    width: toggle ? '50%' : '0%',
    ref: curtainWidthSpringRef,
    config: config.slow,
    // config: { duration: 1000 },
    onRest: () => setShowReward(true),
  })
  const curtainHeightSpringRef = useSpringRef()
  const curtainHeightSpring = useSpring({
    height: toggle ? '0%' : '50%',
    progress: toggle ? 100 : 0,
    ref: curtainHeightSpringRef,
    // config: config.slow,
    config: { duration: 1000 },
    // delay: 1000,
  })
  useChain([curtainWidthSpringRef, curtainHeightSpringRef])
  const curtainBorderWidth = curtainHeightSpring.progress.to((v) =>
    v < 98 ? '4px' : '0'
  )

  return (
    <div className='w-full h-full relative'>
      {showReward ? (
        <animated.div className='w-full h-full absolute top-0 left-0'>
          <div className='h-full p-32'>
            <SphereBox />
          </div>
        </animated.div>
      ) : (
        <animated.div className='w-full h-full absolute top-0 left-0'>
          <Sliders onComplete={() => setToggle(true)} />
        </animated.div>
      )}
      {[
        ['left-0 top-0', 'borderBottomWidth'],
        ['left-0 bottom-0', 'borderTopWidth'],
        ['right-0 top-0', 'borderBottomWidth'],
        ['right-0 bottom-0', 'borderTopWidth'],
      ].map(([className, border]) => (
        <animated.div
          key={className}
          className={`absolute bg-black border-white ${className}`}
          style={{
            width: curtainWidthSpring.width,
            height: curtainHeightSpring.height,
            [border]: curtainBorderWidth,
          }}
        />
      ))}
    </div>
  )
}

const HalfCircle = ({ radius = 50, width = 10, springValue }) => (
  <animated.g transform={springValue.to((v) => `rotate(${v} 50 50)`)}>
    <defs>
      <clipPath id='cut-off-bottom'>
        <rect x='0' y='0' width='100' height='50' />
      </clipPath>
    </defs>
    <circle
      cx='50'
      cy='50'
      r={radius}
      fill='white'
      clipPath='url(#cut-off-bottom)'
    />
    <circle cx='50' cy='50' r={radius - width} fill='black' />
  </animated.g>
)

const Spinner = ({
  className = '',
  springValue,
  style,
}: {
  className: string
  springValue: SpringValue<number>
  style: any
}) => (
  <animated.svg
    className={className}
    xmlns='http://www.w3.org/2000/svg'
    x='0px'
    y='0px'
    viewBox='0 0 100 100'
    style={style}
  >
    <HalfCircle radius={50} springValue={springValue.to((v) => 2 * v)} />
    <HalfCircle radius={35} springValue={springValue} />
    <HalfCircle radius={20} springValue={springValue.to((v) => 0.5 * v)} />
  </animated.svg>
)

const AlmostHalfCircle = ({ radius = 50, width = 10, rotation = 0 }) => {
  const r = radius * 0.95
  const circumference = 2 * Math.PI * r

  return (
    <g transform={`rotate(${rotation} 50 50)`}>
      <defs>
        <clipPath id='cut-off-bottom'>
          <rect x='0' y='0' width='100' height='50' />
        </clipPath>
      </defs>
      <circle
        r={r}
        cx='50%'
        cy='50%'
        stroke='white'
        strokeWidth='4px'
        style={{
          strokeDasharray: `${circumference * 0.4} ${circumference * 0.1}`,
        }}
      />
    </g>
  )
}

const Spinner2 = ({ className = '', rotation = 0 }) => (
  <animated.svg
    className={className}
    xmlns='http://www.w3.org/2000/svg'
    x='0px'
    y='0px'
    viewBox='0 0 100 100'
  >
    <AlmostHalfCircle radius={50} rotation={rotation} />
  </animated.svg>
)

const InteractiveSpinner = (props) => {
  const [value, setValue] = useState(0)
  const onMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    setValue(event.pageX)
  }
  return (
    <div className={props.className} onMouseMove={onMouseMove}>
      <Spinner2 rotation={value * 3} />
    </div>
  )
}

type PaneProps = { className?: string; style?: any }
const Pane: FC<PaneProps> = ({ children, className, style }) => (
  <animated.div
    className={`w-full h-full relative flex border-4 border-white ${className}`}
    style={style}
  >
    <div className='w-full h-full overflow-hidden flex'>{children}</div>
  </animated.div>
)

const Divider: FC<{ onClick: any }> = ({ children, onClick }) => (
  <div onClick={onClick} className='h-full w-20 p-2'>
    {children}
  </div>
)

type SplitState = 'left' | 'right'
type SplitProps = { left: (a: any) => ReactNode; right: (a: any) => ReactNode }
const Split: FC<SplitProps> = ({ left, right, children }) => {
  const [state, setState] = useState('left' as SplitState)
  const toggleState = () => setState((s) => (s === 'left' ? 'right' : 'left'))
  const splitSpringRef = useSpringRef()
  const splitSpring = useSpring({
    progress: state === 'left' ? 100 : 0,
    config: config.slow,
    ref: splitSpringRef,
  })
  const curtainSpringRef = useSpringRef()
  const curtainSpring = useSpring({
    progress: state === 'left' ? 100 : 0,
    ref: curtainSpringRef,
  })

  useChain(
    state === 'left'
      ? [curtainSpringRef, splitSpringRef]
      : [splitSpringRef, curtainSpringRef]
  )

  return (
    <div className='w-full h-full flex'>
      <Pane
        style={{
          width: splitSpring.progress.to([0, 100], [10, 90]).to((v) => `${v}%`),
        }}
      >
        {left({ spring: curtainSpring })}
      </Pane>

      <Divider onClick={toggleState}>
        <Spinner
          springValue={curtainSpring.progress.to((v) => 4 * (v + 100))}
          className='relative'
          style={{
            top: splitSpring.progress.to([0, 100], [0, 90]).to((v) => `${v}%`),
          }}
        />
      </Divider>

      <Pane
        style={{
          width: splitSpring.progress
            .to([0, 100], [10, 90])
            .to((v) => `${100 - v}%`),
        }}
      >
        {right({})}
        <animated.div
          className='w-full absolute left-0 top-0 bg-black border-white z-10'
          style={{
            height: curtainSpring.progress.to((v) => `${v}%`),
            borderBottomWidth: curtainSpring.progress.to((h) =>
              h < 1 || h > 99 ? '0' : '4px'
            ),
          }}
        />
      </Pane>
    </div>
  )
}

const test = (
  <div className='h-100 flex flex-col gap-10'>
    <Box className='pattern-polka-dot' />
    <Box className='pattern-diagonal-lines' />
    <InteractiveSpinner />
  </div>
)

const MyApp = () => (
  <div className='h-full p-10 m-auto flex justify-center max-w-screen-lg'>
    <Split
      left={({ spring }) => (
        <div className='w-full h-full'>
          <animated.div
            className={`h-1/6 w-[calc(100%_+_2rem)] top-1/4 right-[-4px] -translate-y-1/2 absolute border-4 border-r-0 bg-black border-white overflow-hidden`}
            style={{
              width: spring.progress
                .to([0, 100], [1, 0])
                .to((v) => `calc(${v} * (100% + 2rem))`),
            }}
          />
          <div
            className={`h-1/6 w-[calc(100%_+_2rem)] top-2/4 right-0 -translate-y-1/2 absolute border-4 border-r-0 bg-black border-white`}
          />
          <div
            className={`h-1/6 w-[calc(100%_+_2rem)] top-3/4 right-0 -translate-y-1/2 absolute border-4 border-r-0 bg-black border-white`}
          />
        </div>
      )}
      right={() => <Puzzles />}
    />
  </div>
)

export default MyApp
