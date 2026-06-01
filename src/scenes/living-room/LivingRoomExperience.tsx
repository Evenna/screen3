import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import {
  ContactShadows,
  Edges,
  Html,
  OrbitControls,
  OrthographicCamera,
} from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { Mesh } from 'three'
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import '../../App.css'

type Vec3 = [number, number, number]
const STORY_DURATION = 34
const MUTED_EDGE = '#68717d'
const SOFT_EDGE = '#7c8794'
const DIM_EDGE = '#525b68'
const DEEP_EDGE = '#3d4450'
const ACTIVE_BLUE = '#9ed8ff'

function wrapTime(time: number) {
  return time % STORY_DURATION
}

function smoothStep(value: number, start: number, end: number) {
  const x = Math.min(1, Math.max(0, (value - start) / (end - start)))
  return x * x * (3 - 2 * x)
}

function pulse(time: number, speed = 1) {
  return 0.5 + Math.sin(time * speed) * 0.5
}

function getFocusAmount(time: number) {
  return 0.62 * smoothStep(time, 2.0, 13.5) * (1 - smoothStep(time, 31.2, 33.4))
}

function blendColor(from: string, to: string, amount: number) {
  return new THREE.Color(from).lerp(new THREE.Color(to), amount).getStyle()
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function useStoryClock() {
  const [time, setTime] = useState(0)

  useEffect(() => {
    const startedAt = performance.now()
    let frame = 0

    const tick = () => {
      setTime((performance.now() - startedAt) / 1000)
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  return wrapTime(time)
}

function LineBox({
  position,
  scale,
  color = '#111216',
  edge = '#eef1f6',
  opacity = 0.86,
  emissive = '#000000',
  emissiveIntensity = 0,
}: {
  position: Vec3
  scale: Vec3
  color?: string
  edge?: string
  opacity?: number
  emissive?: string
  emissiveIntensity?: number
}) {
  return (
    <mesh position={position} scale={scale} castShadow receiveShadow>
      <boxGeometry />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        roughness={0.74}
        metalness={0.02}
        transparent
        opacity={opacity}
      />
      <Edges color={edge} threshold={15} />
    </mesh>
  )
}

function LineCylinder({
  position,
  rotation = [0, 0, 0],
  args,
  color = '#101116',
  edge = '#edf0f4',
}: {
  position: Vec3
  rotation?: Vec3
  args: [number, number, number, number]
  color?: string
  edge?: string
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <cylinderGeometry args={args} />
      <meshStandardMaterial color={color} roughness={0.78} />
      <Edges color={edge} threshold={12} />
    </mesh>
  )
}

function LineSphere({
  position,
  scale,
  color = '#101116',
  edge = '#edf0f4',
  emissive = '#000000',
  emissiveIntensity = 0,
}: {
  position: Vec3
  scale: Vec3
  color?: string
  edge?: string
  emissive?: string
  emissiveIntensity?: number
}) {
  return (
    <mesh position={position} scale={scale} castShadow receiveShadow>
      <sphereGeometry args={[1, 24, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        roughness={0.78}
      />
      <Edges color={edge} threshold={10} />
    </mesh>
  )
}

function StoryLabel({
  position,
  time,
  start,
  end,
  title,
  body,
  align = 'left',
  variant = 'device',
  priority = 1,
}: {
  position: Vec3
  time: number
  start: number
  end: number
  title: string
  body: string
  align?: 'left' | 'right'
  variant?: 'voice' | 'person' | 'device' | 'action'
  priority?: number
}) {
  const fadeIn = smoothStep(time, start, start + 0.8)
  const fadeOut = 1 - smoothStep(time, end - 0.9, end)
  const visibility = clamp01(fadeIn * fadeOut)
  const layer = 20 + priority * 10

  if (visibility <= 0.01) return null

  return (
    <Html position={position} transform sprite distanceFactor={12.8} zIndexRange={[layer, 0]}>
      <div
        className={`object-label object-label--${align} object-label--${variant}`}
        style={{
          opacity: visibility,
          transform: `translate3d(${align === 'right' ? '-100%' : '0'}, ${5 - visibility * 5}px, 0) scale(${0.62 + visibility * 0.05})`,
        }}
      >
        <strong>{title}</strong>
        <span>{body}</span>
      </div>
    </Html>
  )
}

type BezierSegment = [Vec3, Vec3, Vec3, Vec3]

function BezierRoutedLine({
  segments,
  progress,
  color = ACTIVE_BLUE,
  radius = 0.0055,
}: {
  segments: BezierSegment[]
  progress: number
  color?: string
  radius?: number
}) {
  const curve = useMemo(() => {
    const path = new THREE.CurvePath<THREE.Vector3>()

    segments.forEach(([start, controlA, controlB, end]) => {
      path.add(
        new THREE.CubicBezierCurve3(
        new THREE.Vector3(...start),
        new THREE.Vector3(...controlA),
        new THREE.Vector3(...controlB),
        new THREE.Vector3(...end),
        ),
      )
    })

    return path
  }, [segments])

  const geometry = useMemo(() => {
    const visibleProgress = Math.min(1, Math.max(0, progress))
    if (visibleProgress <= 0) return null

    const sampleCount = Math.max(4, Math.floor(96 * visibleProgress))
    const visiblePoints = Array.from({ length: sampleCount }, (_, index) => {
      const amount = (index / (sampleCount - 1)) * visibleProgress
      return curve.getPoint(amount)
    })
    const visibleCurve = new THREE.CatmullRomCurve3(visiblePoints, false, 'centripetal', 0.04)

    return new THREE.TubeGeometry(visibleCurve, sampleCount * 2, radius, 10, false)
  }, [curve, progress, radius])

  if (!geometry) return null

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color={color} transparent opacity={0.98} />
    </mesh>
  )
}

function CameraMotion({ time }: { time: number }) {
  const { camera } = useThree()
  const cameraPoints = useMemo(
    () => ({
      basePosition: new THREE.Vector3(8.1, 5.75, 6.55),
      broochPosition: new THREE.Vector3(5.45, 4.9, 4.25),
      memoryPosition: new THREE.Vector3(4.75, 5.25, 2.95),
      homePosition: new THREE.Vector3(7.15, 6.45, 7.35),
      baseLookAt: new THREE.Vector3(0.05, 0.82, 0.02),
      broochLookAt: new THREE.Vector3(-1.12, 1.06, 1.42),
      memoryLookAt: new THREE.Vector3(2.2, 0.82, -1.92),
      homeLookAt: new THREE.Vector3(0.92, 1.0, -1.35),
    }),
    [],
  )
  const targetPosition = useRef(new THREE.Vector3())
  const targetLookAt = useRef(new THREE.Vector3(0.05, 0.82, 0.02))
  const smoothLookAt = useRef(new THREE.Vector3(0.05, 0.82, 0.02))
  const focus = getFocusAmount(time)
  const broochShot = smoothStep(time, 2.2, 6.8) * (1 - smoothStep(time, 8.4, 10.8))
  const memoryShot = smoothStep(time, 11, 17.6) * (1 - smoothStep(time, 20.4, 22.6))
  const homeShot = smoothStep(time, 22, 29.2) * (1 - smoothStep(time, 31.4, 33.2))

  useFrame((_, delta) => {
    const easing = 1 - Math.exp(-delta * 2.8)
    targetPosition.current
      .copy(cameraPoints.basePosition)
      .lerp(cameraPoints.broochPosition, broochShot * 0.82)
      .lerp(cameraPoints.memoryPosition, memoryShot * 0.86)
      .lerp(cameraPoints.homePosition, homeShot * 0.8)

    targetLookAt.current
      .copy(cameraPoints.baseLookAt)
      .setY(0.82 + focus * 0.1)
      .lerp(cameraPoints.broochLookAt, broochShot * 0.78)
      .lerp(cameraPoints.memoryLookAt, memoryShot * 0.84)
      .lerp(cameraPoints.homeLookAt, homeShot * 0.8)

    const targetZoom = 85 + focus * 5 + broochShot * 25 + memoryShot * 28 + homeShot * 14

    camera.position.lerp(targetPosition.current, easing)
    smoothLookAt.current.lerp(targetLookAt.current, easing)
    camera.zoom += (targetZoom - camera.zoom) * easing
    camera.lookAt(smoothLookAt.current)
    camera.updateProjectionMatrix()
  })

  return null
}

function Brooch({ time }: { time: number }) {
  const active = time < 6 || (time > 10 && time < 15)
  const glow = active ? 0.36 + pulse(time, 2.4) * 0.38 : 0.04

  return (
    <group position={[0.05, 0.52, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <torusGeometry args={[0.065, 0.006, 10, 28]} />
        <meshBasicMaterial color={ACTIVE_BLUE} transparent opacity={active ? 0.94 : 0.28} />
      </mesh>
      <LineSphere
        position={[0, 0, 0.006]}
        scale={[0.032, 0.032, 0.01]}
        color="#2b2618"
        edge={active ? ACTIVE_BLUE : MUTED_EDGE}
        emissive={ACTIVE_BLUE}
        emissiveIntensity={glow}
      />
      {active && (
        <mesh rotation={[0, 0, time * 0.75]}>
          <torusGeometry args={[0.09 + pulse(time, 1.6) * 0.035, 0.003, 8, 32]} />
          <meshBasicMaterial color={ACTIVE_BLUE} transparent opacity={0.36} />
        </mesh>
      )}
    </group>
  )
}

function ElderlyPerson({ time }: { time: number }) {
  const oldman = useLoader(
    OBJLoader,
    '/models/sitting-man/tripo_convert_32d5344d-740d-4b6c-8fca-9a3c4bb1bd55.obj',
  )

  const { stylizedOldman, outlineOldman } = useMemo(() => {
    const clone = oldman.clone(true)
    const box = new THREE.Box3().setFromObject(clone)
    const center = box.getCenter(new THREE.Vector3())
    const minY = box.min.y

    clone.traverse((child) => {
      const mesh = child as Mesh
      if (!mesh.isMesh) return

      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.material = new THREE.MeshStandardMaterial({
        color: '#0b0c10',
        roughness: 0.86,
        metalness: 0,
      })
    })

    clone.position.set(-center.x, -minY, -center.z)
    const outline = clone.clone(true)
    outline.traverse((child) => {
      const mesh = child as Mesh
      if (!mesh.isMesh) return

      mesh.castShadow = false
      mesh.receiveShadow = false
      mesh.material = new THREE.MeshBasicMaterial({
        color: '#d8dee8',
        side: THREE.BackSide,
      })
    })

    return {
      stylizedOldman: clone,
      outlineOldman: outline,
    }
  }, [oldman])

  return (
    <group position={[-1.2, 0.32, 1.4]} rotation={[0, Math.PI * 0.5 - 0.08, 0]} scale={[1.08, 1.08, 1.08]}>
      <primitive object={outlineOldman} scale={1.035} />
      <primitive object={stylizedOldman} />
      <Brooch time={time} />
    </group>
  )
}

const BROOCH_TO_SPEAKER_PATH: BezierSegment[] = [
  [[-1.12, 1.08, 1.5], [-1.12, 0.86, 1.42], [-1.42, 0.68, 1.42], [-1.92, 0.66, 1.48]],
  [[-1.92, 0.66, 1.48], [-2.34, 0.86, 1.48], [-2.58, 0.98, 1.48], [-2.78, 0.98, 1.48]],
  [[-2.78, 0.98, 1.48], [-3.02, 0.72, 1.18], [-3.02, 0.24, 0.62], [-3.02, 0.18, -0.78]],
  [[-3.02, 0.18, -0.78], [-2.18, 0.18, -1.68], [-0.14, 0.18, -1.72], [1.72, 0.42, -1.9]],
  [[1.72, 0.42, -1.9], [2.32, 0.42, -2.02], [2.86, 0.48, -2.04], [2.95, 0.58, -2.12]],
]

const SPEAKER_TO_LAMP_PATH: BezierSegment[] = [
  [[2.95, 0.58, -2.12], [3.22, 0.42, -2.04], [3.94, 0.18, -2.56], [5.22, 0.18, -1.52]],
  [[5.22, 0.18, -1.52], [5.36, 0.18, 0.14], [5.1, 0.18, 1.1], [4.92, 0.34, 1.62]],
  [[4.92, 0.34, 1.62], [4.8, 0.86, 1.68], [4.78, 1.48, 1.7], [4.8, 2.02, 1.72]],
]

const SPEAKER_TO_CURTAIN_PATH: BezierSegment[] = [
  [[2.95, 0.58, -2.12], [2.38, 0.42, -2.48], [0.86, 0.18, -2.68], [0.1, 0.18, -2.62]],
  [[0.1, 0.18, -2.62], [-0.1, 0.62, -3.02], [-0.06, 1.36, -3.22], [0, 1.72, -3.25]],
]

const SPEAKER_TO_TEA_PATH: BezierSegment[] = [
  [[2.95, 0.58, -2.12], [2.54, 0.42, -1.72], [1.54, 0.18, -1.2], [1.18, 0.18, -0.22]],
  [[1.18, 0.18, -0.22], [1.0, 0.18, 0.62], [0.58, 0.36, 0.72], [0.34, 0.42, 0.44]],
  [[0.34, 0.42, 0.44], [0.28, 0.44, 0.32], [0.28, 0.44, 0.2], [0.28, 0.43, 0.12]],
]

function StoryDevices({ time }: { time: number }) {
  const broochToSpeaker = smoothStep(time, 11, 15)
  const speakerGlow = smoothStep(time, 14, 17) * (0.58 + pulse(time, 3) * 0.56)
  const homeAutomation = smoothStep(time, 22, 28)
  const curtainOpen = smoothStep(time, 23, 29)
  const teaGlow = smoothStep(time, 24, 30) * (0.38 + pulse(time, 2.5) * 0.42)
  const speakerActive = speakerGlow > 0.04
  const curtainActive = curtainOpen > 0.04
  const teaActive = teaGlow > 0.04

  return (
    <group>
      <BezierRoutedLine
        segments={BROOCH_TO_SPEAKER_PATH}
        progress={broochToSpeaker}
      />
      <BezierRoutedLine
        segments={SPEAKER_TO_LAMP_PATH}
        progress={homeAutomation}
        radius={0.005}
      />
      <BezierRoutedLine
        segments={SPEAKER_TO_CURTAIN_PATH}
        progress={homeAutomation}
        radius={0.005}
      />
      <BezierRoutedLine
        segments={SPEAKER_TO_TEA_PATH}
        progress={teaGlow > 0 ? smoothStep(time, 24, 27) : 0}
        radius={0.005}
      />

      <group position={[2.95, 0.58, -2.12]}>
        {speakerActive && <LineCylinder position={[0, 0.28, 0]} args={[0.25, 0.2, 0.68, 32]} color="#225c92" edge={ACTIVE_BLUE} />}
        <LineCylinder position={[0, 0.28, 0]} args={[0.17, 0.13, 0.54, 32]} color="#0a0b0f" edge={speakerActive ? ACTIVE_BLUE : DEEP_EDGE} />
        <LineSphere
          position={[0, 0.58, 0]}
          scale={[0.12, 0.04, 0.12]}
          color={speakerActive ? '#143657' : '#101318'}
          edge={speakerGlow > 0 ? ACTIVE_BLUE : DEEP_EDGE}
          emissive={ACTIVE_BLUE}
          emissiveIntensity={speakerGlow}
        />
      </group>

      <group position={[0, 1.46, -3.16]}>
        <LineBox position={[-1.2 - curtainOpen * 0.55, 0, 0]} scale={[0.78, 1.38, 0.055]} color="#07080b" edge={curtainActive ? ACTIVE_BLUE : DIM_EDGE} opacity={curtainActive ? 0.54 : 0.32} />
        <LineBox position={[1.2 + curtainOpen * 0.55, 0, 0]} scale={[0.78, 1.38, 0.055]} color="#07080b" edge={curtainActive ? ACTIVE_BLUE : DIM_EDGE} opacity={curtainActive ? 0.54 : 0.32} />
        {curtainActive && (
          <LineBox
            position={[0, -0.1, -0.055]}
            scale={[1.86 + curtainOpen * 0.95, 1.04, 0.02]}
            color="#245f96"
            edge={ACTIVE_BLUE}
            opacity={0.42}
            emissive={ACTIVE_BLUE}
            emissiveIntensity={0.18}
          />
        )}
        <LineBox
          position={[0, -0.1, -0.04]}
          scale={[1.7 + curtainOpen * 0.9, 0.92, 0.035]}
          color={curtainActive ? '#1d4f82' : '#111722'}
          edge={curtainOpen > 0 ? ACTIVE_BLUE : MUTED_EDGE}
          opacity={0.08 + curtainOpen * 0.46}
          emissive={ACTIVE_BLUE}
          emissiveIntensity={curtainOpen * 0.28}
        />
      </group>

      <group position={[0.28, 0.43, 0.12]} rotation={[0, 0.25, 0]}>
        {teaActive && (
          <LineSphere
            position={[0, 0.08, 0]}
            scale={[0.2, 0.13, 0.15]}
            color="#245f96"
            edge={ACTIVE_BLUE}
            emissive={ACTIVE_BLUE}
            emissiveIntensity={0.18}
          />
        )}
        <LineSphere
          position={[0, 0.08, 0]}
          scale={[0.16, 0.1, 0.12]}
          color={teaActive ? '#143657' : '#0b0c10'}
          edge={teaGlow > 0 ? ACTIVE_BLUE : DEEP_EDGE}
          emissive={ACTIVE_BLUE}
          emissiveIntensity={teaGlow}
        />
        <LineCylinder position={[0, 0.18, 0]} args={[0.05, 0.05, 0.04, 20]} color="#0b0c10" edge={teaGlow > 0 ? ACTIVE_BLUE : DEEP_EDGE} />
        <LineBox position={[0.19, 0.09, 0]} scale={[0.16, 0.035, 0.035]} color="#0b0c10" edge={teaGlow > 0 ? ACTIVE_BLUE : DEEP_EDGE} opacity={0.9} />
      </group>
    </group>
  )
}

function StoryObjectLabels({ time }: { time: number }) {
  return (
    <group>
      <StoryLabel
        position={[-1.08, 1.68, 1.78]}
        time={time}
        start={0.8}
        end={8.2}
        title="Evans 语音"
        body="建国叔，我也记得这个日子。要不要听听阿姨当年说的话？"
        variant="voice"
        priority={8}
      />
      <StoryLabel
        position={[-1.28, 1.42, 0.92]}
        time={time}
        start={8.6}
        end={12.4}
        title="陈建国 回应"
        body="好……"
        variant="person"
        priority={9}
      />
      <StoryLabel
        position={[2.78, 1.48, -1.86]}
        time={time}
        start={13.4}
        end={21.8}
        title="陈兰录音"
        body="陈兰录音：建国，你又熬夜批作业了。早点睡。"
        align="right"
        variant="voice"
        priority={8}
      />
      <StoryLabel
        position={[3.35, 1.96, 1.02]}
        time={time}
        start={22.4}
        end={26.6}
        title="智能灯"
        body="灯光柔和调暗，只保留安静的蓝色提示。"
        align="right"
        variant="action"
        priority={5}
      />
      <StoryLabel
        position={[0.12, 2.02, -2.26]}
        time={time}
        start={25.2}
        end={29.4}
        title="窗帘"
        body="窗帘缓缓拉开，月光进入客厅。"
        variant="action"
        priority={6}
      />
      <StoryLabel
        position={[0.74, 0.98, 0.24]}
        time={time}
        start={27.4}
        end={31.4}
        title="茶壶"
        body="建议泡一杯热茶。"
        variant="device"
        priority={7}
      />
    </group>
  )
}

function StylizedFloor({ focus }: { focus: number }) {
  const dim = clamp01(focus * 1.32)
  const floorEdge = blendColor('#343844', '#252b35', dim)
  const rugEdge = blendColor('#3f4853', '#2b323d', dim)

  return (
    <group>
      <LineBox position={[0, -0.04, 0]} scale={[12, 0.08, 7]} color="#08090c" edge={floorEdge} opacity={0.88 - dim * 0.16} />
      <LineBox
        position={[-0.22, 0.02, 0.34]}
        scale={[5.9, 0.06, 3.05]}
        color="#0b0d11"
        edge={rugEdge}
        opacity={0.28 - dim * 0.08}
        emissive="#000000"
        emissiveIntensity={0}
      />
      <LineBox
        position={[-0.22, 0.11, 0.34]}
        scale={[6.45, 0.04, 3.52]}
        color="#090b0f"
        edge={blendColor('#36404b', '#232a34', dim)}
        opacity={0.18 - dim * 0.06}
        emissive="#000000"
        emissiveIntensity={0}
      />

      {[-4, -2, 0, 2, 4].map((x) => (
        <LineBox key={`floor-x-${x}`} position={[x, 0.025, 0]} scale={[0.012, 0.018, 7]} color="#12151b" edge="#252b35" opacity={0.22 - dim * 0.08} />
      ))}
      {[-2, 0, 2].map((z) => (
        <LineBox key={`floor-z-${z}`} position={[0, 0.03, z]} scale={[12, 0.018, 0.012]} color="#12151b" edge="#252b35" opacity={0.22 - dim * 0.08} />
      ))}
    </group>
  )
}

function RoomShell({ focus }: { focus: number }) {
  const dim = clamp01(focus * 1.36)
  const wallEdge = blendColor('#8e929c', '#333a45', dim)
  const windowEdge = blendColor('#dce1e8', '#47515e', dim)

  return (
    <group>
      <LineBox position={[0, 1.45, -3.42]} scale={[12, 2.9, 0.16]} color="#0b0c10" edge={wallEdge} opacity={0.42 - dim * 0.11} />
      <LineBox position={[-5.92, 1.45, 0]} scale={[0.16, 2.9, 7]} color="#0b0c10" edge={wallEdge} opacity={0.34 - dim * 0.1} />
      <LineBox position={[5.92, 1.45, 0]} scale={[0.16, 2.9, 7]} color="#0b0c10" edge={wallEdge} opacity={0.34 - dim * 0.1} />
      <LineBox position={[0, 1.72, -3.28]} scale={[3.1, 1.15, 0.1]} color="#090a0d" edge={windowEdge} opacity={0.24 - dim * 0.06} />
      <LineBox position={[-4.7, 1.05, -3.2]} scale={[1.05, 1.55, 0.08]} color="#090a0d" edge={blendColor(DIM_EDGE, DEEP_EDGE, dim)} opacity={0.25 - dim * 0.08} />
      <LineBox position={[4.7, 1.05, -3.2]} scale={[1.05, 1.55, 0.08]} color="#090a0d" edge={blendColor(DIM_EDGE, DEEP_EDGE, dim)} opacity={0.25 - dim * 0.08} />
    </group>
  )
}

function LivingArea({ time, focus }: { time: number; focus: number }) {
  const dim = clamp01(focus * 1.28)
  const mainEdge = blendColor(SOFT_EDGE, '#414956', dim)
  const quietEdge = blendColor(MUTED_EDGE, '#343b46', dim)
  const accentEdge = blendColor('#e7ebf2', '#4a5360', dim)
  const furnitureOpacity = 1 - dim * 0.18

  return (
    <group>
      <group position={[-0.45, 0, 1.92]} rotation={[0, -0.08, 0]}>
        <LineBox position={[0, 0.34, 0]} scale={[4.5, 0.56, 0.82]} color="#0e0f13" edge={mainEdge} opacity={0.62 * furnitureOpacity} />
        <LineBox position={[0, 0.88, 0.36]} scale={[4.5, 1.08, 0.2]} color="#0d0e12" edge={quietEdge} opacity={0.58 * furnitureOpacity} />
        <LineBox position={[-2.18, 0.56, 0]} scale={[0.22, 0.78, 0.9]} color="#0d0e12" edge={quietEdge} opacity={0.58 * furnitureOpacity} />
        <LineBox position={[2.18, 0.56, 0]} scale={[0.22, 0.78, 0.9]} color="#0d0e12" edge={quietEdge} opacity={0.58 * furnitureOpacity} />
        <LineBox position={[-0.92, 0.58, -0.38]} scale={[0.78, 0.18, 0.44]} color="#111319" edge={mainEdge} opacity={0.7 * furnitureOpacity} />
        <LineBox position={[0, 0.58, -0.38]} scale={[0.78, 0.18, 0.44]} color="#111319" edge={mainEdge} opacity={0.7 * furnitureOpacity} />
        <LineBox position={[0.92, 0.58, -0.38]} scale={[0.78, 0.18, 0.44]} color="#111319" edge={mainEdge} opacity={0.7 * furnitureOpacity} />
      </group>

      <ElderlyPerson time={time} />
      <StoryDevices time={time} />

      <group position={[-2.62, 0, 0.7]} rotation={[0, Math.PI / 2 - 0.08, 0]}>
        <LineBox position={[0, 0.31, 0]} scale={[2.1, 0.52, 0.76]} color="#0e0f13" edge={mainEdge} opacity={0.55 * furnitureOpacity} />
        <LineBox position={[0, 0.76, 0.32]} scale={[2.1, 0.86, 0.18]} color="#0d0e12" edge={quietEdge} opacity={0.55 * furnitureOpacity} />
      </group>

      <LineCylinder position={[-0.38, 0.23, 0.23]} args={[0.62, 0.62, 0.16, 40]} color="#0c0d11" edge={blendColor('#eef2f7', '#424b57', dim)} />
      <LineCylinder position={[0.72, 0.18, -0.02]} args={[0.42, 0.42, 0.12, 36]} color="#0d0e12" edge={quietEdge} />

      <group position={[-4.15, 0, -0.42]} rotation={[0, -0.58, 0]}>
        <LineBox position={[0, 0.34, 0]} scale={[0.88, 0.46, 0.82]} color="#0e0f13" edge={accentEdge} opacity={0.52} />
        <LineBox position={[0, 0.78, -0.3]} scale={[0.88, 0.72, 0.18]} color="#0d0e12" edge={blendColor('#c6ccd6', DIM_EDGE, focus)} opacity={0.52} />
        <LineCylinder position={[0, 0.28, 0.42]} args={[0.34, 0.34, 0.08, 24]} color="#0d0e12" edge={blendColor('#b9c0ca', DIM_EDGE, focus)} />
      </group>

      <group position={[3.65, 0, -0.34]} rotation={[0, 0.52, 0]}>
        <LineBox position={[0, 0.34, 0]} scale={[0.88, 0.46, 0.82]} color="#0e0f13" edge={accentEdge} opacity={0.52} />
        <LineBox position={[0, 0.78, -0.3]} scale={[0.88, 0.72, 0.18]} color="#0d0e12" edge={blendColor('#c6ccd6', DIM_EDGE, focus)} opacity={0.52} />
        <LineCylinder position={[0, 0.28, 0.42]} args={[0.34, 0.34, 0.08, 24]} color="#0d0e12" edge={blendColor('#b9c0ca', DIM_EDGE, focus)} />
      </group>

      <LineBox position={[0, 0.55, -2.88]} scale={[4.5, 1.1, 0.18]} color="#0d0e12" edge={mainEdge} opacity={0.48 * furnitureOpacity} />
      <LineBox position={[0, 1.22, -2.74]} scale={[1.9, 0.76, 0.12]} color="#090a0d" edge={quietEdge} opacity={0.38 * furnitureOpacity} emissive="#000000" emissiveIntensity={0} />
      <LineBox position={[0, 0.18, -2.2]} scale={[3.55, 0.36, 0.54]} color="#0d0e12" edge={quietEdge} opacity={0.5 * furnitureOpacity} />
      <LineBox position={[-2.85, 0.36, -2.52]} scale={[0.62, 0.72, 0.62]} color="#0d0e12" edge={quietEdge} opacity={0.46 * furnitureOpacity} />
      <LineBox position={[2.85, 0.36, -2.52]} scale={[0.62, 0.72, 0.62]} color="#0d0e12" edge={quietEdge} opacity={0.46 * furnitureOpacity} />
    </group>
  )
}

function Decor({ focus }: { focus: number }) {
  const plantRef = useRef<Mesh>(null)
  const dim = clamp01(focus * 1.32)
  const decorEdge = blendColor(MUTED_EDGE, '#303743', dim)

  useFrame((state) => {
    if (!plantRef.current) return
    plantRef.current.rotation.y = state.clock.elapsedTime * 0.16
  })

  return (
    <group>
      <LineCylinder position={[-5.15, 0.35, 2.25]} args={[0.28, 0.36, 0.68, 24]} color="#101116" edge={decorEdge} />
      <group ref={plantRef} position={[-5.15, 1.08, 2.25]}>
        {[0, 1, 2, 3, 4].map((index) => (
          <mesh
            key={index}
            castShadow
            position={[
              Math.cos((index / 5) * Math.PI * 2) * 0.2,
              index * 0.03,
              Math.sin((index / 5) * Math.PI * 2) * 0.2,
            ]}
            rotation={[0, (index / 5) * Math.PI * 2, Math.PI / 5]}
          >
            <coneGeometry args={[0.16, 0.58, 5]} />
            <meshStandardMaterial color="#12151a" emissive="#284f3f" emissiveIntensity={0.06} roughness={0.9} />
            <Edges color={blendColor('#a9b5ad', '#38424a', dim)} threshold={8} />
          </mesh>
        ))}
      </group>

      <LineCylinder position={[4.8, 0.16, 1.72]} args={[0.18, 0.18, 0.12, 24]} color="#101116" edge={decorEdge} />
      <LineCylinder position={[4.8, 1.08, 1.72]} args={[0.05, 0.05, 1.76, 16]} color="#101116" edge={blendColor('#adb3bd', '#3b444f', dim)} />
      <LineSphere position={[4.8, 2.02, 1.72]} scale={[0.42, 0.42, 0.42]} color="#121317" edge={decorEdge} emissive="#000000" emissiveIntensity={0} />
      <LineBox position={[-3.92, 0.44, -2.76]} scale={[1.25, 0.88, 0.18]} color="#111216" edge={decorEdge} opacity={0.58 - dim * 0.14} />
      <LineBox position={[3.92, 0.58, -2.72]} scale={[1.2, 1.16, 0.18]} color="#111216" edge={blendColor('#59636f', '#303743', dim)} opacity={0.44 - dim * 0.12} />
    </group>
  )
}

function InteriorScene({ time }: { time: number }) {
  const focus = getFocusAmount(time)
  const automationDim = smoothStep(time, 21, 25) * 0.2
  const warmBrooch = smoothStep(time, 0.5, 3.5) * (1 - smoothStep(time, 5.4, 7))
  const speakerLight = smoothStep(time, 14, 17) * (1 - smoothStep(time, 22, 24))
  const homeLight = smoothStep(time, 22, 28) * (1 - smoothStep(time, 31, 33))

  return (
    <>
      <color attach="background" args={['#07080b']} />
      <fog attach="fog" args={['#07080b', 12, 24]} />

      <OrthographicCamera makeDefault position={[7.8, 5.6, 6.2]} zoom={90} />
      <CameraMotion time={time} />

      <ambientLight intensity={0.54 - automationDim - focus * 0.08} />
      <hemisphereLight intensity={0.28 - automationDim * 0.12 - focus * 0.03} color="#d8dde8" groundColor="#0a0b0f" />
      <directionalLight
        castShadow
        intensity={1.18 - focus * 0.2}
        position={[5, 8, 6]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <spotLight
        castShadow
        intensity={16 - focus * 3}
        angle={0.38}
        penumbra={0.85}
        position={[2.2, 5.5, 2.4]}
        color="#d9e1ef"
      />
      <pointLight intensity={2.2 * warmBrooch} distance={2.4} position={[-1.1, 1.15, 1.52]} color={ACTIVE_BLUE} />
      <pointLight intensity={1.8 * speakerLight} distance={3.2} position={[3.05, 1.05, -2.1]} color={ACTIVE_BLUE} />
      <pointLight intensity={1.35 * homeLight} distance={4.6} position={[0.3, 1.7, -2.65]} color={ACTIVE_BLUE} />
      <pointLight intensity={0.9 * homeLight} distance={2.6} position={[0.28, 0.7, 0.12]} color={ACTIVE_BLUE} />

      <group position={[0.18, -0.02, 0.06]} rotation={[0, -0.18, 0]}>
        <StylizedFloor focus={focus} />
        <RoomShell focus={focus} />
        <Suspense fallback={null}>
          <LivingArea time={time} focus={focus} />
        </Suspense>
        <Decor focus={focus} />
        <StoryObjectLabels time={time} />
      </group>

      <ContactShadows position={[0, 0.02, 0]} opacity={0.58} scale={18} blur={2.1} far={8} color="#000000" />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enableRotate={false}
        minDistance={8}
        maxDistance={14}
        minPolarAngle={0.82}
        maxPolarAngle={1.22}
        target={[0.05, 0.82, 0.02]}
      />
    </>
  )
}

function StoryOverlay({ time }: { time: number }) {
  const focus = getFocusAmount(time)
  const dimOpacity = 0.08 + focus * 0.18
  const narration = smoothStep(time, 29.4, 30.4) * (1 - smoothStep(time, 33.4, 34))

  return (
    <>
      <div className="story-dim" style={{ opacity: dimOpacity }} />
      {narration > 0.01 && (
        <div className="top-narration" style={{ opacity: narration, transform: `translateX(-50%) translateY(${10 - narration * 10}px)` }}>
          <strong>旁白</strong>
          <span>它只是把月光、热茶和阿姨的声音，安静地交还给他。</span>
        </div>
      )}
      <div className="story-progress">
        <i style={{ width: `${(time / STORY_DURATION) * 100}%` }} />
      </div>
    </>
  )
}

export function LivingRoomExperience() {
  const time = useStoryClock()

  return (
    <section className="interior-shell" aria-label="客厅三维样板间">
      <Canvas shadows dpr={[1, 2]}>
        <InteriorScene time={time} />
      </Canvas>
      <StoryOverlay time={time} />
    </section>
  )
}

export default LivingRoomExperience
