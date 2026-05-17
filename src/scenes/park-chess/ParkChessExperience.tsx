import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { ContactShadows, Edges, Html, OrbitControls, OrthographicCamera } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { Mesh } from 'three'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import '../../App.css'

type Vec3 = [number, number, number]

const STORY_DURATION = 48
const WHITE_EDGE = '#eef1f6'
const MUTED_EDGE = '#68717d'
const SOFT_EDGE = '#7c8794'
const DEEP_EDGE = '#3d4450'
const ACTIVE_BLUE = '#9ed8ff'
const BROOCH_POINT = new THREE.Vector3(-1.18, 0.98, 0.45)
const STRANGER_POINT = new THREE.Vector3(0.86, 1.02, -0.12)
const PHONE_POINT = new THREE.Vector3(-0.5, 0.965, 0.62)
const SIGN_POINT = new THREE.Vector3(3.7, 1.08, -2.1)

function wrapTime(time: number) {
  return time % STORY_DURATION
}

function smoothStep(value: number, start: number, end: number) {
  const x = Math.min(1, Math.max(0, (value - start) / (end - start)))
  return x * x * (3 - 2 * x)
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function pulse(time: number, speed = 1) {
  return 0.5 + Math.sin(time * speed) * 0.5
}

function blendColor(from: string, to: string, amount: number) {
  return new THREE.Color(from).lerp(new THREE.Color(to), amount).getStyle()
}

function useStoryClock() {
  const [time, setTime] = useState(0)

  useEffect(() => {
    const startedAt = performance.now()
    let frame = 0

    const tick = () => {
      setTime(wrapTime((performance.now() - startedAt) / 1000))
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  return time
}

function LineBox({
  position,
  scale,
  color = '#111216',
  edge = WHITE_EDGE,
  opacity = 0.86,
  emissive = '#000000',
  emissiveIntensity = 0,
  rotation = [0, 0, 0],
}: {
  position: Vec3
  scale: Vec3
  color?: string
  edge?: string
  opacity?: number
  emissive?: string
  emissiveIntensity?: number
  rotation?: Vec3
}) {
  return (
    <mesh position={position} rotation={rotation} scale={scale} castShadow receiveShadow>
      <boxGeometry />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        roughness={0.78}
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
  edge = WHITE_EDGE,
  opacity = 1,
  emissive = '#000000',
  emissiveIntensity = 0,
}: {
  position: Vec3
  rotation?: Vec3
  args: [number, number, number, number]
  color?: string
  edge?: string
  opacity?: number
  emissive?: string
  emissiveIntensity?: number
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <cylinderGeometry args={args} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        roughness={0.82}
        metalness={0.01}
        transparent={opacity < 1}
        opacity={opacity}
      />
      <Edges color={edge} threshold={12} />
    </mesh>
  )
}

function LineSphere({
  position,
  scale,
  color = '#101116',
  edge = WHITE_EDGE,
  emissive = '#000000',
  emissiveIntensity = 0,
  opacity = 1,
}: {
  position: Vec3
  scale: Vec3
  color?: string
  edge?: string
  emissive?: string
  emissiveIntensity?: number
  opacity?: number
}) {
  return (
    <mesh position={position} scale={scale} castShadow receiveShadow>
      <icosahedronGeometry args={[1, 2]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        roughness={0.78}
        transparent={opacity < 1}
        opacity={opacity}
      />
      <Edges color={edge} threshold={10} />
    </mesh>
  )
}

function CameraMotion({ time }: { time: number }) {
  const { camera } = useThree()
  const lookAt = useRef(new THREE.Vector3(0, 0.78, 0.12))
  const targetLookAt = useRef(new THREE.Vector3())
  const targetPosition = useRef(new THREE.Vector3())
  const frames = useMemo(
    () => [
      { at: 0, position: new THREE.Vector3(0.02, 1.22, 1.55), look: new THREE.Vector3(0, 0.82, 0.05), zoom: 150 },
      { at: 6.2, position: new THREE.Vector3(1.58, 2.2, 3.05), look: new THREE.Vector3(0.02, 1.0, 0.0), zoom: 112 },
      { at: 13.8, position: new THREE.Vector3(2.82, 2.28, 2.72), look: new THREE.Vector3(-0.92, 1.55, 0.26), zoom: 126 },
      { at: 22.8, position: new THREE.Vector3(3.95, 2.9, 3.72), look: new THREE.Vector3(0.55, 1.02, -0.55), zoom: 84 },
      { at: 33.5, position: new THREE.Vector3(3.2, 4.6, 4.35), look: new THREE.Vector3(0.2, 0.92, 0.06), zoom: 92 },
      { at: 41.8, position: new THREE.Vector3(3.2, 4.6, 4.35), look: new THREE.Vector3(0.2, 0.92, 0.06), zoom: 92 },
    ],
    [],
  )

  useFrame((_, delta) => {
    const index = Math.max(0, frames.findIndex((frame, frameIndex) => {
      const next = frames[frameIndex + 1]
      return next ? time >= frame.at && time < next.at : time >= frame.at
    }))
    const current = frames[index]
    const next = frames[Math.min(index + 1, frames.length - 1)]
    const blend = current === next ? 0 : smoothStep(time, current.at, next.at)
    const ease = 1 - Math.exp(-delta * 2.45)

    targetPosition.current.copy(current.position).lerp(next.position, blend)
    targetLookAt.current.copy(current.look).lerp(next.look, blend)

    camera.position.lerp(targetPosition.current, ease)
    lookAt.current.lerp(targetLookAt.current, ease)
    camera.zoom += (current.zoom + (next.zoom - current.zoom) * blend - camera.zoom) * ease
    camera.lookAt(lookAt.current)
    camera.updateProjectionMatrix()
  })

  return null
}

function SegmentTube({
  start,
  end,
  width,
  opacity,
}: {
  start: THREE.Vector3
  end: THREE.Vector3
  width: number
  opacity: number
}) {
  const geometry = useMemo(() => {
    const curve = new THREE.LineCurve3(start, end)
    return new THREE.TubeGeometry(curve, 18, width, 6, false)
  }, [end, start, width])

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color={ACTIVE_BLUE} transparent opacity={opacity} />
    </mesh>
  )
}

function SurfaceRoute({
  points,
  time,
  start,
  end,
  width = 0.0042,
  holdUntil = 43.6,
}: {
  points: THREE.Vector3[]
  time: number
  start: number
  end: number
  width?: number
  holdUntil?: number
}) {
  const progress = clamp01((time - start) / (end - start))
  const fade = smoothStep(time, start, start + 0.45) * (1 - smoothStep(time, holdUntil, holdUntil + 1.0))
  const lengths = useMemo(() => {
    let total = 0
    const segments = points.slice(0, -1).map((point, index) => {
      const length = point.distanceTo(points[index + 1])
      total += length
      return length
    })
    return { segments, total }
  }, [points])

  let drawn = progress * lengths.total
  const visibleSegments = points.slice(0, -1).map((point, index) => {
    const length = lengths.segments[index]
    const amount = clamp01(drawn / length)
    drawn -= length
    if (amount <= 0) return null

    const next = points[index + 1]
    const segmentEnd = point.clone().lerp(next, amount)
    return <SegmentTube key={index} start={point} end={segmentEnd} width={width} opacity={0.12 + fade * 0.34} />
  })
  const activeIndex = Math.min(points.length - 2, Math.max(0, lengths.segments.findIndex((_, index) => {
    const used = lengths.segments.slice(0, index + 1).reduce((sum, length) => sum + length, 0)
    return progress * lengths.total <= used
  })))
  const beforeActive = lengths.segments.slice(0, activeIndex).reduce((sum, length) => sum + length, 0)
  const activeAmount = clamp01((progress * lengths.total - beforeActive) / lengths.segments[activeIndex])
  const dot = points[activeIndex].clone().lerp(points[activeIndex + 1], activeAmount)

  if (progress <= 0.02 || fade <= 0.02) return null

  return (
    <group>
      {visibleSegments}
      <LineSphere
        position={[dot.x, dot.y, dot.z]}
        scale={[0.018, 0.018, 0.018]}
        color={ACTIVE_BLUE}
        edge={ACTIVE_BLUE}
        emissive={ACTIVE_BLUE}
        emissiveIntensity={0.58}
        opacity={0.72}
      />
    </group>
  )
}

function ParkGround() {
  const leaves: Vec3[] = [
    [-2.8, 0.035, 1.1], [-2.18, 0.035, -0.8], [-1.3, 0.035, 1.64], [-0.4, 0.035, -1.68],
    [0.85, 0.035, 1.46], [1.5, 0.035, -1.45], [2.2, 0.035, 0.92], [2.92, 0.035, -0.45],
    [-3.4, 0.035, -1.52], [3.35, 0.035, 1.35],
  ]

  return (
    <group>
      <LineBox position={[0, -0.04, 0]} scale={[8.8, 0.08, 5.6]} color="#060a08" edge={WHITE_EDGE} opacity={0.88} />
      <LineBox position={[1.8, 0.0, -1.85]} rotation={[0, -0.18, 0]} scale={[5.9, 0.035, 0.62]} color="#0b0e11" edge={blendColor(WHITE_EDGE, DEEP_EDGE, 0.35)} opacity={0.5} />
      <LineBox position={[0.1, 0.012, 0.04]} scale={[2.45, 0.024, 1.75]} color="#0b0f0d" edge={blendColor(WHITE_EDGE, MUTED_EDGE, 0.28)} opacity={0.42} />
      {leaves.map((position, index) => (
        <LineBox
          key={index}
          position={position}
          rotation={[0, (index * 0.73) % Math.PI, 0]}
          scale={[0.12 + (index % 3) * 0.025, 0.012, 0.035]}
          color={index % 2 ? '#15100b' : '#17140c'}
          edge={blendColor(WHITE_EDGE, MUTED_EDGE, 0.55)}
          opacity={0.5}
        />
      ))}
    </group>
  )
}

function NatureTree({
  path,
  position,
  rotation = [0, 0, 0],
  scale = 1,
  tint = '#111a14',
}: {
  path: string
  position: Vec3
  rotation?: Vec3
  scale?: number
  tint?: string
}) {
  const gltf = useLoader(GLTFLoader, path)
  const { model, outline } = useMemo(() => {
    const clone = gltf.scene.clone(true)
    const box = new THREE.Box3().setFromObject(clone)
    const center = box.getCenter(new THREE.Vector3())
    const minY = box.min.y

    clone.traverse((child) => {
      const mesh = child as Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.material = new THREE.MeshStandardMaterial({
        color: tint,
        roughness: 0.84,
        metalness: 0,
      })
    })

    clone.position.set(-center.x, -minY, -center.z)
    const outlineClone = clone.clone(true)
    outlineClone.traverse((child) => {
      const mesh = child as Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = false
      mesh.receiveShadow = false
      mesh.material = new THREE.MeshBasicMaterial({
        color: blendColor(WHITE_EDGE, DEEP_EDGE, 0.62),
        side: THREE.BackSide,
      })
    })

    return { model: clone, outline: outlineClone }
  }, [gltf.scene, tint])

  return (
    <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
      <primitive object={outline} scale={1.012} />
      <primitive object={model} />
    </group>
  )
}

function ParkTrees() {
  return (
    <group>
      <Suspense fallback={null}>
        <NatureTree
          path="/models/quaternius-nature/poly_maple_trees.glb"
          position={[-3.35, 0.02, -1.58]}
          rotation={[0, 0.32, 0]}
          scale={0.38}
          tint="#1a221b"
        />
        <NatureTree
          path="/models/quaternius-nature/poly_pine_trees.glb"
          position={[3.15, 0.02, -1.24]}
          rotation={[0, -0.46, 0]}
          scale={0.34}
          tint="#18221d"
        />
        <NatureTree
          path="/models/quaternius-nature/poly_birch_trees.glb"
          position={[-3.85, 0.02, 1.25]}
          rotation={[0, -0.18, 0]}
          scale={0.28}
          tint="#20251f"
        />
        <NatureTree
          path="/models/quaternius-nature/poly_maple_trees.glb"
          position={[3.82, 0.02, 1.16]}
          rotation={[0, 0.72, 0]}
          scale={0.28}
          tint="#1d241c"
        />
      </Suspense>
      <mesh position={[-0.45, 0.025, -0.18]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.15, 72]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.14} />
      </mesh>
      <mesh position={[1.62, 0.024, -0.88]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.25, 56]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.08} />
      </mesh>
    </group>
  )
}

function ParkBench({ position, rotation = [0, 0, 0] }: { position: Vec3; rotation?: Vec3 }) {
  return (
    <group position={position} rotation={rotation}>
      <LineBox position={[0, 0.36, 0]} scale={[1.5, 0.12, 0.46]} color="#101116" edge={blendColor(WHITE_EDGE, MUTED_EDGE, 0.28)} opacity={0.62} />
      <LineBox position={[0, 0.68, -0.2]} scale={[1.5, 0.56, 0.1]} color="#0d0f12" edge={blendColor(WHITE_EDGE, MUTED_EDGE, 0.35)} opacity={0.48} />
      {[-0.55, 0.55].map((x) => (
        <LineBox key={x} position={[x, 0.18, 0]} scale={[0.1, 0.36, 0.34]} color="#0b0c10" edge={blendColor(WHITE_EDGE, MUTED_EDGE, 0.36)} opacity={0.7} />
      ))}
    </group>
  )
}

function StoneChessStool({ position, rotation = [0, 0, 0] }: { position: Vec3; rotation?: Vec3 }) {
  return (
    <group position={position} rotation={rotation}>
      <LineCylinder position={[0, 0.17, 0]} args={[0.32, 0.38, 0.12, 32]} color="#101113" edge={blendColor(WHITE_EDGE, MUTED_EDGE, 0.22)} opacity={0.86} />
      <LineCylinder position={[0, 0.42, 0]} args={[0.18, 0.23, 0.42, 24]} color="#0b0d10" edge={blendColor(WHITE_EDGE, MUTED_EDGE, 0.34)} opacity={0.82} />
      <LineCylinder position={[0, 0.67, 0]} args={[0.42, 0.36, 0.12, 34]} color="#121316" edge={WHITE_EDGE} opacity={0.84} />
      <LineBox position={[0, 0.735, 0]} scale={[0.52, 0.018, 0.18]} color="#1a1b1f" edge={blendColor(WHITE_EDGE, SOFT_EDGE, 0.18)} opacity={0.62} />
    </group>
  )
}

function ChessPiece({ position, camp }: { position: Vec3; camp: 'dark' | 'red' }) {
  return (
    <group position={position}>
      <LineCylinder
        position={[0, 0.025, 0]}
        args={[0.055, 0.066, 0.05, 24]}
        color={camp === 'red' ? '#2b1512' : '#08090c'}
        edge={WHITE_EDGE}
        opacity={0.92}
      />
      <LineSphere
        position={[0, 0.062, 0]}
        scale={[0.04, 0.014, 0.04]}
        color={camp === 'red' ? '#3a1b15' : '#111318'}
        edge={WHITE_EDGE}
        opacity={0.9}
      />
    </group>
  )
}

function ChessTable({ time }: { time: number }) {
  const boardGlow = smoothStep(time, 0.8, 4.8) * (1 - smoothStep(time, 8.5, 10.2))
  const lines = [-0.48, -0.32, -0.16, 0, 0.16, 0.32, 0.48]
  const pieces: Array<{ position: Vec3; camp: 'dark' | 'red' }> = [
    { position: [-0.4, 0.82, 0.32], camp: 'red' },
    { position: [-0.16, 0.82, 0.14], camp: 'dark' },
    { position: [0.04, 0.82, -0.02], camp: 'red' },
    { position: [0.28, 0.82, -0.2], camp: 'dark' },
    { position: [0.44, 0.82, 0.18], camp: 'red' },
    { position: [-0.28, 0.82, -0.34], camp: 'dark' },
  ]

  return (
    <group>
      <LineCylinder position={[0, 0.36, 0]} args={[0.56, 0.66, 0.72, 44]} color="#0a0b0d" edge={WHITE_EDGE} opacity={0.9} />
      <LineCylinder position={[0, 0.76, 0]} args={[0.96, 0.96, 0.14, 56]} color="#121216" edge={WHITE_EDGE} opacity={0.88} emissive={ACTIVE_BLUE} emissiveIntensity={boardGlow * 0.08} />
      <LineBox position={[0, 0.84, 0]} scale={[1.25, 0.032, 1.04]} color="#181417" edge={blendColor(WHITE_EDGE, ACTIVE_BLUE, boardGlow * 0.42)} opacity={0.78} />
      {lines.map((x) => <LineBox key={`x-${x}`} position={[x, 0.865, 0]} scale={[0.006, 0.008, 0.9]} color="#080f12" edge={blendColor(WHITE_EDGE, MUTED_EDGE, 0.3)} opacity={0.64} />)}
      {lines.map((z) => <LineBox key={`z-${z}`} position={[0, 0.868, z]} scale={[1.08, 0.008, 0.006]} color="#080f12" edge={blendColor(WHITE_EDGE, MUTED_EDGE, 0.3)} opacity={0.64} />)}
      {pieces.map((piece, index) => <ChessPiece key={index} position={piece.position} camp={piece.camp} />)}
      <TeaCup position={[-0.72, 0.91, -0.44]} />
      <TeaCup position={[0.7, 0.91, 0.42]} />
      <PhoneOnTable time={time} />
    </group>
  )
}

function TeaCup({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <LineCylinder position={[0, 0.06, 0]} args={[0.085, 0.07, 0.12, 22]} color="#12161a" edge={WHITE_EDGE} opacity={0.86} />
      <mesh position={[0.08, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.04, 0.006, 8, 20]} />
        <meshStandardMaterial color="#12161a" roughness={0.8} />
        <Edges color={WHITE_EDGE} threshold={10} />
      </mesh>
    </group>
  )
}

function PhoneOnTable({ time }: { time: number }) {
  const draft = smoothStep(time, 17.8, 20.5) * (1 - smoothStep(time, 23.0, 24.0))
  const added = smoothStep(time, 35.2, 36.2) * (1 - smoothStep(time, 39.0, 40.0))
  const ui = clamp01(draft + added)
  const confirmed = smoothStep(time, 35.2, 36.2)

  return (
    <group position={[-0.5, 0.91, 0.62]} rotation={[0, -0.3, 0.02]}>
      <LineBox position={[0, 0.018, 0]} scale={[0.17, 0.032, 0.29]} color="#05080c" edge={ACTIVE_BLUE} opacity={0.92} emissive={ACTIVE_BLUE} emissiveIntensity={ui * 0.18} />
      <LineBox position={[0, 0.04, 0]} scale={[0.13, 0.009, 0.21]} color="#07131d" edge={ACTIVE_BLUE} opacity={0.76} emissive={ACTIVE_BLUE} emissiveIntensity={0.12 + ui * 0.32} />
      <Html position={[-0.16, 0.075, 0.13]} center distanceFactor={6.1} transform sprite occlude={false} zIndexRange={[18, 0]}>
        <div className="park-calendar-card" style={{ opacity: 0.1 + ui * 0.9 }}>
          <b>{confirmed > 0.5 ? '周三 14:00' : '下次约棋待确认'}</b>
          <span>{confirmed > 0.5 ? '滨江公园｜与张大爷下棋' : '滨江公园'}</span>
          <i>{confirmed > 0.5 ? 'Calendar Added' : 'Calendar Draft'}</i>
        </div>
      </Html>
    </group>
  )
}

function ParkSign({ time }: { time: number }) {
  const active = smoothStep(time, 21.5, 25.6) * (1 - smoothStep(time, 38, 41))

  return (
    <group position={[3.7, 0, -2.15]} rotation={[0, -0.22, 0]}>
      <LineCylinder position={[-0.24, 0.52, 0]} args={[0.025, 0.025, 1.04, 10]} color="#0b0d10" edge={WHITE_EDGE} opacity={0.72} />
      <LineCylinder position={[0.24, 0.52, 0]} args={[0.025, 0.025, 1.04, 10]} color="#0b0d10" edge={WHITE_EDGE} opacity={0.72} />
      <LineBox position={[0, 1.05, 0]} scale={[0.78, 0.38, 0.07]} color="#11161a" edge={blendColor(WHITE_EDGE, ACTIVE_BLUE, active)} opacity={0.76} emissive={ACTIVE_BLUE} emissiveIntensity={active * 0.08} />
      <LineBox position={[0, 1.11, 0.044]} scale={[0.48, 0.035, 0.012]} color={WHITE_EDGE} edge={WHITE_EDGE} opacity={0.72} />
      <LineBox position={[0, 1.0, 0.044]} scale={[0.34, 0.026, 0.012]} color={ACTIVE_BLUE} edge={ACTIVE_BLUE} opacity={0.65 + active * 0.25} emissive={ACTIVE_BLUE} emissiveIntensity={active * 0.28} />
      <Html position={[-5.35, 1.08, 1.06]} center distanceFactor={10.2} transform sprite occlude={false} zIndexRange={[16, 0]}>
        <div className="object-label object-label--right" style={{ opacity: active * 0.82 }}>
          <strong>地点锚点</strong>
          <span>滨江公园入口</span>
        </div>
      </Html>
    </group>
  )
}

function StylizedElder({
  position,
  rotation,
  side,
  time,
}: {
  position: Vec3
  rotation: Vec3
  side: 'chen' | 'stranger'
  time: number
}) {
  const object = useLoader(OBJLoader, '/models/sitting-man/tripo_convert_32d5344d-740d-4b6c-8fca-9a3c4bb1bd55.obj')
  const { model, outline } = useMemo(() => {
    const clone = object.clone(true)
    const box = new THREE.Box3().setFromObject(clone)
    const center = box.getCenter(new THREE.Vector3())
    const minY = box.min.y

    clone.traverse((child) => {
      const mesh = child as Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.material = new THREE.MeshStandardMaterial({
        color: side === 'chen' ? '#1c2027' : '#17191d',
        roughness: 0.86,
        metalness: 0,
      })
    })

    clone.position.set(-center.x, -minY, -center.z)
    const outlineClone = clone.clone(true)
    outlineClone.traverse((child) => {
      const mesh = child as Mesh
      if (!mesh.isMesh) return
      mesh.material = new THREE.MeshBasicMaterial({ color: WHITE_EDGE, side: THREE.BackSide })
    })

    return { model: clone, outline: outlineClone }
  }, [object, side])
  const broochActive = side === 'chen' && (time < 5.8 || (time > 10.2 && time < 21.2) || (time > 34.8 && time < 38.2))
  const broochGlow = broochActive ? 0.38 + pulse(time, 2.6) * 0.46 : 0.08
  const candidateLabel = side === 'stranger' ? smoothStep(time, 13.8, 16.4) * (1 - smoothStep(time, 17.2, 18.0)) : 0

  return (
    <group position={position} rotation={rotation} scale={[0.9, 0.9, 0.9]}>
      <primitive object={outline} scale={1.012} />
      <primitive object={model} />
      {side === 'chen' && (
        <>
          <LineSphere
            position={[-0.08, 0.73, 0.18]}
            scale={[0.04, 0.04, 0.04]}
            color="#101722"
            edge={broochActive ? ACTIVE_BLUE : MUTED_EDGE}
            emissive={ACTIVE_BLUE}
            emissiveIntensity={broochGlow}
            opacity={0.94}
          />
          <mesh position={[-0.08, 0.73, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.1 + pulse(time, 1.7) * 0.03, 0.0035, 8, 48]} />
            <meshBasicMaterial color={ACTIVE_BLUE} transparent opacity={broochActive ? 0.26 + pulse(time, 2.4) * 0.22 : 0.08} />
          </mesh>
          {broochActive && (
            <mesh position={[-0.08, 0.73, 0.181]} rotation={[Math.PI / 2, 0, time * 0.8]}>
              <torusGeometry args={[0.062, 0.0028, 8, 32]} />
              <meshBasicMaterial color={ACTIVE_BLUE} transparent opacity={0.62} />
            </mesh>
          )}
        </>
      )}
      {side === 'stranger' && (
        <Html position={[0.52, 1.42, -0.18]} center distanceFactor={7.2} transform sprite occlude={false} zIndexRange={[17, 0]}>
          <div className="object-label object-label--action" style={{ opacity: candidateLabel }}>
            <strong>新棋友</strong>
            <span>待确认</span>
          </div>
        </Html>
      )}
    </group>
  )
}

function RelationLines({ time }: { time: number }) {
  return (
    <group>
      <SurfaceRoute
        time={time}
        start={12.4}
        end={15.8}
        points={[BROOCH_POINT, new THREE.Vector3(-0.22, 1.0, 0.1), STRANGER_POINT]}
      />
      <SurfaceRoute
        time={time}
        start={16.8}
        end={20.6}
        points={[BROOCH_POINT, new THREE.Vector3(-0.98, 0.99, 0.48), new THREE.Vector3(-0.72, 0.99, 0.56), PHONE_POINT]}
      />
      <SurfaceRoute
        time={time}
        start={21.0}
        end={26.2}
        points={[PHONE_POINT, new THREE.Vector3(0.18, 0.9, 0.18), new THREE.Vector3(0.76, 0.11, -0.22), new THREE.Vector3(2.62, 0.11, -1.52), SIGN_POINT]}
      />
      <SurfaceRoute
        time={time}
        start={35.2}
        end={37.6}
        width={0.0032}
        points={[new THREE.Vector3(-0.18, 1.3, -0.46), new THREE.Vector3(-0.48, 1.0, 0.12), PHONE_POINT]}
      />
    </group>
  )
}

function ParkChessScene({ time }: { time: number }) {
  const focus = smoothStep(time, 8.5, 24.0) * (1 - smoothStep(time, 37, 41.5))

  return (
    <>
      <color attach="background" args={['#06090a']} />
      <fog attach="fog" args={['#06090a', 11, 24]} />
      <OrthographicCamera makeDefault position={[0.02, 1.22, 1.55]} zoom={150} />
      <CameraMotion time={time} />

      <ambientLight intensity={0.5 - focus * 0.06} />
      <hemisphereLight intensity={0.34} color="#d8dde8" groundColor="#07100c" />
      <directionalLight castShadow intensity={1.18 - focus * 0.1} position={[4, 7, 5]} shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <spotLight castShadow intensity={9.5 + focus * 4} angle={0.44} penumbra={0.82} position={[0.8, 5.0, 2.8]} color="#dbe8d9" />

      <group position={[0.04, -0.02, 0.02]} rotation={[0, -0.12, 0]}>
        <ParkGround />
        <ParkTrees />
        <ParkBench position={[-2.95, 0, -0.45]} rotation={[0, 0.35, 0]} />
        <ParkBench position={[2.8, 0, 0.62]} rotation={[0, -0.62, 0]} />
        <StoneChessStool position={[-1.08, 0, 0.28]} rotation={[0, 0.25, 0]} />
        <StoneChessStool position={[1.08, 0, -0.2]} rotation={[0, -Math.PI + 0.12, 0]} />
        <ChessTable time={time} />
        <ParkSign time={time} />
        <Suspense fallback={null}>
          <StylizedElder position={[-1.08, 0.33, 0.28]} rotation={[0, 0.25, 0]} side="chen" time={time} />
          <StylizedElder position={[1.08, 0.33, -0.2]} rotation={[0, -Math.PI + 0.12, 0]} side="stranger" time={time} />
        </Suspense>
        <RelationLines time={time} />
      </group>

      <ContactShadows position={[0, 0.02, 0]} opacity={0.56} scale={14} blur={2.1} far={8} color="#000000" />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enableRotate={false}
        minDistance={7}
        maxDistance={14}
        minPolarAngle={0.7}
        maxPolarAngle={1.28}
        target={[0, 0.86, 0]}
      />
    </>
  )
}

function ScreenRelationshipGraph({ time }: { time: number }) {
  const show = smoothStep(time, 23.2, 24.4) * (1 - smoothStep(time, 45.0, 46.5))
  const candidate = smoothStep(time, 24.6, 25.6)
  const confirmed = smoothStep(time, 38.8, 39.8)
  const relationToast = smoothStep(time, 25.4, 26.1) * (1 - smoothStep(time, 29.0, 29.8))
  const calendarCard = smoothStep(time, 35.4, 36.2) * (1 - smoothStep(time, 39.4, 40.4))
  const logA = smoothStep(time, 25.4, 26.4)
  const logB = smoothStep(time, 39.2, 40.0)
  const logC = smoothStep(time, 40.2, 41.0)
  const familyOrbit = Array.from({ length: 18 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 18 - Math.PI / 2
    return {
      x: 72 + Math.cos(angle) * 43,
      y: 118 + Math.sin(angle) * 43,
      gender: index % 5 === 0 ? 'woman' : 'man',
    }
  })
  const friendOrbit = Array.from({ length: 11 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 11 - Math.PI / 2
    return {
      x: 174 + Math.cos(angle) * 34,
      y: 66 + Math.sin(angle) * 34,
      gender: index % 4 === 0 ? 'woman' : 'man',
    }
  })
  const branchNodes = [
    { x: 136, y: 138, gender: 'man' },
    { x: 165, y: 170, gender: 'man' },
    { x: 197, y: 176, gender: 'man' },
    { x: 178, y: 214, gender: 'man' },
    { x: 214, y: 222, gender: 'man' },
  ]

  if (show <= 0.01) return null

  return (
    <div className="park-screen-graph" style={{ opacity: show, transform: `translateY(-50%) translateY(${8 - show * 8}px)` }}>
      <div className="park-phone-shell">
        <div className="park-phone-island" />
        <div className="park-phone-screen">
          <div className="park-phone-status">
            <span>14:00</span>
            <span>Evans</span>
          </div>
          <div className="park-phone-appbar">
            <span>联系人</span>
            <b>{confirmed > 0.5 ? '已确认' : '待确认'}</b>
          </div>
          <div className="park-phone-search">搜索关系、地点或下次安排</div>
          <div className="park-contact-summary">
            <div className="park-contact-avatar">陈</div>
            <div>
              <strong>陈建国</strong>
              <span>家人 4 · 老友 6 · 社区 3</span>
            </div>
          </div>
          <div className="park-relation-board park-graph-panel">
            <div className="park-graph-map">
              <svg viewBox="0 0 240 250" aria-hidden="true">
                <g className="park-graph-grid">
                  <path d="M0 62.5H240M0 125H240M0 187.5H240M60 0V250M120 0V250M180 0V250" />
                </g>
                <g className="park-graph-links">
                  {familyOrbit.map((node, index) => <line key={`family-link-${index}`} x1="72" y1="118" x2={node.x} y2={node.y} />)}
                  {friendOrbit.map((node, index) => <line key={`friend-link-${index}`} x1="174" y1="66" x2={node.x} y2={node.y} />)}
                  <path d="M72 118 C92 108 106 105 122 110" />
                  <path d="M122 110 C140 96 152 82 174 66" />
                  <path d="M122 110 C130 126 134 134 136 138" />
                  <path d="M136 138 C150 154 154 164 165 170" />
                  <path d="M165 170 C178 174 188 176 197 176" />
                  <path d="M165 170 C174 188 176 200 178 214" />
                  <path d="M178 214 C190 220 202 222 214 222" />
                  <path className={confirmed > 0.5 ? 'park-graph-line--active' : 'park-graph-line--pending'} d="M122 110 C138 92 148 76 156 54" style={{ opacity: candidate }} />
                </g>
                <g className="park-graph-cluster">
                  {familyOrbit.map((node, index) => (
                    <circle key={`family-${index}`} className={`park-graph-dot park-graph-dot--${node.gender}`} cx={node.x} cy={node.y} r="4.5" />
                  ))}
                  {friendOrbit.map((node, index) => (
                    <circle key={`friend-${index}`} className={`park-graph-dot park-graph-dot--${node.gender}`} cx={node.x} cy={node.y} r="4.2" />
                  ))}
                  {branchNodes.map((node, index) => (
                    <circle key={`branch-${index}`} className={`park-graph-dot park-graph-dot--${node.gender}`} cx={node.x} cy={node.y} r="4.2" />
                  ))}
                  <circle className="park-graph-dot park-graph-dot--core" cx="72" cy="118" r="6.5" />
                  <circle className="park-graph-dot park-graph-dot--core park-graph-dot--small-core" cx="174" cy="66" r="5.8" />
                  <circle className="park-graph-dot park-graph-dot--key" cx="122" cy="110" r="5.4" />
                  <circle
                    className={`park-graph-dot park-graph-dot--candidate ${confirmed > 0.5 ? 'is-confirmed' : ''}`}
                    cx="156"
                    cy="54"
                    r="5.2"
                    style={{ opacity: candidate }}
                  />
                </g>
                <g className="park-graph-labels">
                  <text x="72" y="102">陈建国</text>
                  <text x="174" y="48">老友圈</text>
                  <text x="124" y="97">今日棋局</text>
                  <text x="160" y="42" style={{ opacity: candidate }}>{confirmed > 0.5 ? '张大爷' : '张大爷?'}</text>
                </g>
              </svg>
              <div className="park-graph-card">
                <span>{confirmed > 0.5 ? '张大爷｜棋友' : '张大爷？'}</span>
                <b>Event 3 · Entity 5</b>
              </div>
              <div className="park-graph-legend">
                <span><i className="is-woman" />家人</span>
                <span><i />老友</span>
              </div>
              <div className="park-relation-created" style={{ opacity: relationToast, transform: `translateY(${6 - relationToast * 6}px)` }}>
                <b>新建关系</b>
                <span>张大爷？ · 棋友候选</span>
              </div>
            </div>
            <p className="park-relation-board__sub">
              {confirmed > 0.5 ? '新棋友节点已确认，下次约棋已写入日历。' : '候选棋友节点已创建，等待陈建国确认。'}
            </p>
          </div>
          <div className="park-contact-list">
            <div className={`park-contact-row ${confirmed > 0.5 ? 'is-created' : ''}`}>
              <span>下周三 14:00</span>
              <b>{confirmed > 0.5 ? '已加入日历' : '滨江公园 · 草稿'}</b>
            </div>
            <div className={`park-contact-row ${candidate > 0.5 ? 'is-created' : ''}`}>
              <span>{confirmed > 0.5 ? '张大爷｜棋友' : '张大爷？｜待确认'}</span>
              <b>来自今日棋局</b>
            </div>
          </div>
          <div className="park-calendar-sheet" style={{ opacity: calendarCard, transform: `translateY(${100 - calendarCard * 100}%)` }}>
            <div className="park-sheet-grabber" />
            <div className="park-calendar-nav">
              <button>取消</button>
              <strong>新建日程</strong>
              <button className={confirmed > 0.5 ? 'is-ready' : ''}>添加</button>
            </div>
            <div className="park-calendar-fields">
              <div className="park-calendar-field park-calendar-field--title">
                <span>与张大爷下棋</span>
              </div>
              <div className="park-calendar-field">
                <b>位置</b>
                <span>滨江公园</span>
              </div>
              <div className="park-calendar-field">
                <b>开始</b>
                <span>下周三 14:00</span>
              </div>
              <div className="park-calendar-field">
                <b>结束</b>
                <span>下周三 15:30</span>
              </div>
            </div>
          </div>
          <div className="park-agent-log">
            <span className={logA > 0.5 ? 'is-active' : ''}>记录</span>
            <span className={logB > 0.5 ? 'is-active' : ''}>日历</span>
            <span className={logC > 0.5 ? 'is-active' : ''}>确认</span>
          </div>
        </div>
        <div className="park-phone-homebar" />
      </div>
    </div>
  )
}

function StoryOverlay({ time }: { time: number }) {
  const dim = 0.08 + smoothStep(time, 9, 24) * 0.18
  const opening = smoothStep(time, 0.8, 1.8) * (1 - smoothStep(time, 6.8, 8.2))
  const evansVoice = smoothStep(time, 28.5, 29.2) * (1 - smoothStep(time, 31.2, 31.9))
  const userReply = smoothStep(time, 32.4, 33.0) * (1 - smoothStep(time, 34.4, 35.0))
  const calendar = smoothStep(time, 35.6, 36.4) * (1 - smoothStep(time, 37.6, 38.4))
  const ending = smoothStep(time, 44.2, 45.0) * (1 - smoothStep(time, 47.0, 47.8))

  return (
    <>
      <div className="story-dim" style={{ opacity: dim }} />
      <ScreenRelationshipGraph time={time} />
      {opening > 0.01 && (
        <div className="top-narration" style={{ opacity: opening, transform: `translateX(-50%) translateY(${10 - opening * 10}px)` }}>
          <strong>公园棋局</strong>
          <span>午后石桌、残局、茶杯与陌生棋友都保持静止，镜头只沿真实物件建立关系。</span>
        </div>
      )}
      {(evansVoice > 0.01 || userReply > 0.01) && (
        <div className="park-dialogue-subtitles">
          <div className="park-dialogue-subtitle park-dialogue-subtitle--evans" style={{ opacity: evansVoice }}>
            <strong>Evans</strong>
            <span>建国叔，下次还约老张下棋吗？我可以帮您记着时间。</span>
          </div>
          <div className="park-dialogue-subtitle park-dialogue-subtitle--user" style={{ opacity: userReply }}>
            <strong>陈建国</strong>
            <span>好啊，约下周三下午。</span>
          </div>
        </div>
      )}
      {calendar > 0.01 && (
        <div className="top-narration top-narration--park" style={{ opacity: calendar, transform: `translateX(-50%) translateY(${10 - calendar * 10}px)` }}>
          <strong>日历</strong>
          <span>周三 14:00｜滨江公园｜与张大爷下棋</span>
        </div>
      )}
      {ending > 0.01 && (
        <div className="top-narration" style={{ opacity: ending, transform: `translateX(-50%) translateY(${10 - ending * 10}px)` }}>
          <strong>旁白</strong>
          <span>Evans 不主动判断陌生人是好是坏，只为你留下一个观察的入口。</span>
        </div>
      )}
      <div className="story-progress">
        <i style={{ width: `${(time / STORY_DURATION) * 100}%` }} />
      </div>
    </>
  )
}

export function ParkChessExperience() {
  const time = useStoryClock()

  return (
    <section className="interior-shell" aria-label="午后公园棋局三维静态场景">
      <Canvas shadows dpr={[1, 2]}>
        <ParkChessScene time={time} />
      </Canvas>
      <StoryOverlay time={time} />
    </section>
  )
}

export default ParkChessExperience
