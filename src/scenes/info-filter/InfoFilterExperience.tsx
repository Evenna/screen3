import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { ContactShadows, Edges, Html, OrbitControls, OrthographicCamera } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { Mesh, Object3D } from 'three'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import '../../App.css'

type Vec3 = [number, number, number]

const STORY_DURATION = 36
const ACTIVE_BLUE = '#9ed8ff'
const MAIN_BLUE = '#3f73ff'
const WARM_GLOW = '#ffd49a'
const WHITE_EDGE = '#eef1f6'
const SOFT_EDGE = '#77818f'
const MUTED_EDGE = '#46515e'
const BROOCH_POINT = new THREE.Vector3(0.05, 1.24, 0.52)

const ASSETS = {
  chair: '/models/open-office/office-chair.glb',
  computer: '/models/open-office/computer-screen.glb',
  keyboard: '/models/open-office/keyboard.glb',
  mug: '/models/open-office/mug.glb',
  sittingMan: '/models/sitting-man/tripo_convert_32d5344d-740d-4b6c-8fca-9a3c4bb1bd55.obj',
  bed: '/models/quaternius-furniture/bed-single.glb',
  bookcase: '/models/quaternius-furniture/bookcase-with-books.glb',
  shelf: '/models/quaternius-furniture/shelf-large.glb',
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function smoothStep(value: number, start: number, end: number) {
  const x = clamp01((value - start) / (end - start))
  return x * x * (3 - 2 * x)
}

function visibilityBetween(time: number, start: number, end: number, fade = 0.55) {
  return smoothStep(time, start, start + fade) * (1 - smoothStep(time, end, end + fade))
}

function pulse(time: number, speed = 1) {
  return 0.5 + Math.sin(time * speed) * 0.5
}

function wrapTime(time: number) {
  return time % STORY_DURATION
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

function getPathPoint(points: THREE.Vector3[], progress: number) {
  const lengths = points.slice(0, -1).map((point, index) => point.distanceTo(points[index + 1]))
  const total = lengths.reduce((sum, length) => sum + length, 0)
  let target = clamp01(progress) * total

  for (let index = 0; index < lengths.length; index += 1) {
    const length = lengths[index]
    if (target <= length) return points[index].clone().lerp(points[index + 1], length <= 0.001 ? 0 : target / length)
    target -= length
  }

  return points[points.length - 1].clone()
}

function CameraMotion({ time }: { time: number }) {
  const { camera } = useThree()
  const lookAt = useRef(new THREE.Vector3(0.05, 1.2, 0.12))
  const frames = useMemo(
    () => [
      { at: 0, position: new THREE.Vector3(2.7, 2.16, 3.34), look: new THREE.Vector3(0.02, 1.1, 0.2), zoom: 125 },
      { at: 5.5, position: new THREE.Vector3(1.88, 1.82, 2.34), look: new THREE.Vector3(0.06, 1.28, 0.5), zoom: 156 },
      { at: 11.2, position: new THREE.Vector3(2.36, 2.36, 3.0), look: new THREE.Vector3(0.04, 1.62, 0.12), zoom: 122 },
      { at: 20.0, position: new THREE.Vector3(2.72, 2.1, 2.72), look: new THREE.Vector3(0.32, 1.34, 0.26), zoom: 132 },
      { at: 29.0, position: new THREE.Vector3(2.24, 1.95, 2.78), look: new THREE.Vector3(0.0, 1.1, 0.28), zoom: 142 },
      { at: 35.8, position: new THREE.Vector3(2.24, 1.95, 2.78), look: new THREE.Vector3(0.0, 1.1, 0.28), zoom: 142 },
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
    const targetPosition = current.position.clone().lerp(next.position, blend)
    const targetLookAt = current.look.clone().lerp(next.look, blend)
    const targetZoom = current.zoom + (next.zoom - current.zoom) * blend
    const ease = 1 - Math.exp(-delta * 2.7)

    camera.position.lerp(targetPosition, ease)
    lookAt.current.lerp(targetLookAt, ease)
    camera.zoom += (targetZoom - camera.zoom) * ease
    camera.lookAt(lookAt.current)
    camera.updateProjectionMatrix()
  })

  return null
}

function LineBox({
  position,
  scale,
  rotation = [0, 0, 0],
  color = '#101721',
  edge = WHITE_EDGE,
  opacity = 0.72,
  emissive = '#000000',
  emissiveIntensity = 0,
}: {
  position: Vec3
  scale: Vec3
  rotation?: Vec3
  color?: string
  edge?: string
  opacity?: number
  emissive?: string
  emissiveIntensity?: number
}) {
  return (
    <mesh position={position} rotation={rotation} scale={scale} castShadow receiveShadow>
      <boxGeometry />
      <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} roughness={0.78} metalness={0.02} transparent opacity={opacity} />
      <Edges color={edge} threshold={10} />
    </mesh>
  )
}

function LineCylinder({
  position,
  args,
  rotation = [0, 0, 0],
  color = '#101721',
  edge = WHITE_EDGE,
  opacity = 0.72,
  emissive = '#000000',
  emissiveIntensity = 0,
}: {
  position: Vec3
  args: [number, number, number, number]
  rotation?: Vec3
  color?: string
  edge?: string
  opacity?: number
  emissive?: string
  emissiveIntensity?: number
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <cylinderGeometry args={args} />
      <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} roughness={0.8} transparent opacity={opacity} />
      <Edges color={edge} threshold={10} />
    </mesh>
  )
}

function DeskLineSegments({ segments, opacity, color = WHITE_EDGE }: { segments: Array<[Vec3, Vec3]>; opacity: number; color?: string }) {
  const geometry = useMemo(() => {
    const points = segments.flatMap(([start, end]) => [new THREE.Vector3(...start), new THREE.Vector3(...end)])
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [segments])

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </lineSegments>
  )
}

function outlineImportedMeshes(root: Object3D, color: string, opacity = 1, edgeThreshold = 72, lineOpacityOverride?: number) {
  root.traverse((child) => {
    const mesh = child as Mesh
    if (!mesh.isMesh || !mesh.geometry) return
    mesh.castShadow = true
    mesh.receiveShadow = true
    const lineOpacity = lineOpacityOverride ?? (opacity >= 1 ? 0.42 : opacity * 0.34)
    mesh.add(
      new THREE.LineSegments(
        new THREE.EdgesGeometry(mesh.geometry, edgeThreshold),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: lineOpacity }),
      ),
    )
  })
}

function styleImportedMeshFill(root: Object3D, opacity: number, tint = '#111821') {
  root.traverse((child) => {
    const mesh = child as Mesh
    if (!mesh.isMesh) return
    mesh.material = new THREE.MeshStandardMaterial({
      color: tint,
      emissive: tint,
      emissiveIntensity: 0.012,
      roughness: 0.84,
      metalness: 0.01,
      transparent: opacity < 1,
      opacity: Math.min(0.68, Math.max(0.16, opacity * 0.46)),
      depthWrite: opacity >= 0.55,
    })
  })
}

function normalizeModel(root: Object3D) {
  const box = new THREE.Box3().setFromObject(root)
  const center = box.getCenter(new THREE.Vector3())
  const minY = box.min.y
  const size = box.getSize(new THREE.Vector3())
  const normalizer = 1 / Math.max(size.x, size.y, size.z, 0.001)

  root.position.set(-center.x * normalizer, -minY * normalizer, -center.z * normalizer)
  root.scale.setScalar(normalizer)
}

function ImportedModel({
  path,
  position,
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  opacity = 1,
  edge = WHITE_EDGE,
  edgeThreshold = 72,
  lineOpacity,
}: {
  path: string
  position: Vec3
  rotation?: Vec3
  scale?: Vec3
  opacity?: number
  edge?: string
  edgeThreshold?: number
  lineOpacity?: number
}) {
  const gltf = useLoader(GLTFLoader, path)
  const model = useMemo(() => {
    const root = gltf.scene.clone(true)
    normalizeModel(root)
    outlineImportedMeshes(root, edge, opacity, edgeThreshold, lineOpacity)
    styleImportedMeshFill(root, opacity)
    return root
  }, [edge, edgeThreshold, gltf.scene, lineOpacity, opacity])

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={model} />
    </group>
  )
}

function SegmentTube({ start, end, width, opacity, color }: { start: THREE.Vector3; end: THREE.Vector3; width: number; opacity: number; color: string }) {
  const geometry = useMemo(() => {
    const curve = new THREE.LineCurve3(start, end)
    return new THREE.TubeGeometry(curve, 18, width, 6, false)
  }, [end, start, width])

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  )
}

function AnimatedRoute({
  points,
  time,
  start,
  end,
  holdUntil,
  color = ACTIVE_BLUE,
  width = 0.006,
  opacity = 0.62,
}: {
  points: THREE.Vector3[]
  time: number
  start: number
  end: number
  holdUntil: number
  color?: string
  width?: number
  opacity?: number
}) {
  const progress = clamp01((time - start) / (end - start))
  const visibility = smoothStep(time, start, start + 0.35) * (1 - smoothStep(time, holdUntil, holdUntil + 0.65))
  const lengths = useMemo(() => {
    let total = 0
    const segments = points.slice(0, -1).map((point, index) => {
      const length = point.distanceTo(points[index + 1])
      total += length
      return length
    })
    return { segments, total }
  }, [points])
  const movingPoint = getPathPoint(points, progress)

  if (visibility <= 0.01 || progress <= 0.01 || lengths.total <= 0.001) return null

  let drawn = progress * lengths.total
  const visibleSegments = points.slice(0, -1).map((point, index) => {
    const length = lengths.segments[index]
    const amount = clamp01(drawn / length)
    drawn -= length
    if (amount <= 0) return null

    return (
      <SegmentTube
        key={index}
        start={point}
        end={point.clone().lerp(points[index + 1], amount)}
        width={width}
        opacity={0.08 + visibility * opacity}
        color={color}
      />
    )
  })

  return (
    <group>
      {visibleSegments}
      <mesh position={[movingPoint.x, movingPoint.y, movingPoint.z]}>
        <sphereGeometry args={[width * 3.8, 14, 10]} />
        <meshBasicMaterial color={color} transparent opacity={0.58 + pulse(time, 8.5) * 0.32} />
      </mesh>
    </group>
  )
}

function EvansBrooch({ time }: { time: number }) {
  const warm = smoothStep(time, 25.0, 30.0)
  const glowColor = new THREE.Color(ACTIVE_BLUE).lerp(new THREE.Color(WARM_GLOW), warm).getStyle()

  return (
    <group position={[BROOCH_POINT.x - 0.05, BROOCH_POINT.y - 0.63, BROOCH_POINT.z - 0.56]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <torusGeometry args={[0.052, 0.004, 10, 36]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.76} />
      </mesh>
      <mesh position={[0, 0, 0.006]}>
        <sphereGeometry args={[0.028, 18, 12]} />
        <meshStandardMaterial color="#101722" emissive={glowColor} emissiveIntensity={0.42 + pulse(time, 2.4) * 0.28 + warm * 0.18} roughness={0.55} />
      </mesh>
      <mesh rotation={[0, 0, 0.4]}>
        <torusGeometry args={[0.09 + pulse(time, 1.8) * 0.012, 0.0028, 8, 42]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.16 + pulse(time, 2.1) * 0.12} />
      </mesh>
    </group>
  )
}

function StudentGlasses() {
  return (
    <group position={[0.13, 1.18, 0.08]} rotation={[0, 0.02, 0]}>
      <mesh position={[-0.035, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.035, 0.003, 8, 24]} />
        <meshBasicMaterial color={WHITE_EDGE} transparent opacity={0.72} />
      </mesh>
      <mesh position={[0.035, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.035, 0.003, 8, 24]} />
        <meshBasicMaterial color={WHITE_EDGE} transparent opacity={0.72} />
      </mesh>
      <LineBox position={[0, 0, 0]} scale={[0.036, 0.004, 0.004]} color={WHITE_EDGE} edge={WHITE_EDGE} opacity={0.72} />
    </group>
  )
}

function SittingStudent({ time }: { time: number }) {
  const object = useLoader(OBJLoader, ASSETS.sittingMan)
  const { model, outline } = useMemo(() => {
    const root = object.clone(true)
    const box = new THREE.Box3().setFromObject(root)
    const center = box.getCenter(new THREE.Vector3())
    const minY = box.min.y

    root.traverse((child) => {
      const mesh = child as Mesh
      if (!mesh.isMesh || !mesh.geometry) return
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.material = new THREE.MeshStandardMaterial({
        color: '#151a22',
        emissive: '#151a22',
        emissiveIntensity: 0.012,
        roughness: 0.86,
        metalness: 0,
        transparent: true,
        opacity: 0.86,
      })
    })

    root.position.set(-center.x, -minY, -center.z)
    const outlineClone = root.clone(true)
    outlineClone.traverse((child) => {
      const mesh = child as Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = false
      mesh.receiveShadow = false
      mesh.material = new THREE.MeshBasicMaterial({
        color: WHITE_EDGE,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.48,
      })
    })

    return { model: root, outline: outlineClone }
  }, [object])

  return (
    <group position={[0.08, 0.24, 0.9]} rotation={[0.05, Math.PI * 0.5, 0]} scale={[1.28, 1.28, 1.28]}>
      <primitive object={outline} scale={1.012} />
      <primitive object={model} />
      <StudentGlasses />
      <EvansBrooch time={time} />
    </group>
  )
}

function DormDesk() {
  const deskLines = useMemo<Array<[Vec3, Vec3]>>(
    () => [
      [[-1.28, 0.96, 0.62], [1.28, 0.96, 0.62]],
      [[-1.28, 0.96, -0.54], [1.28, 0.96, -0.54]],
      [[-1.28, 0.96, 0.62], [-1.28, 0.96, -0.54]],
      [[1.28, 0.96, 0.62], [1.28, 0.96, -0.54]],
      [[-1.12, 0.9, 0.5], [-1.12, 0.08, 0.5]],
      [[1.12, 0.9, 0.5], [1.12, 0.08, 0.5]],
      [[-1.12, 0.9, -0.44], [-1.12, 0.08, -0.44]],
      [[1.12, 0.9, -0.44], [1.12, 0.08, -0.44]],
    ],
    [],
  )

  return (
    <group>
      <LineBox position={[0, 0.9, 0.04]} scale={[2.56, 0.1, 1.16]} opacity={0.26} edge={SOFT_EDGE} />
      <LineBox position={[-1.12, 0.46, 0.5]} scale={[0.11, 0.82, 0.11]} opacity={0.34} edge={SOFT_EDGE} />
      <LineBox position={[1.12, 0.46, 0.5]} scale={[0.11, 0.82, 0.11]} opacity={0.34} edge={SOFT_EDGE} />
      <LineBox position={[-1.12, 0.46, -0.44]} scale={[0.1, 0.82, 0.1]} opacity={0.24} edge={SOFT_EDGE} />
      <LineBox position={[1.12, 0.46, -0.44]} scale={[0.1, 0.82, 0.1]} opacity={0.24} edge={SOFT_EDGE} />
      <DeskLineSegments segments={deskLines} opacity={0.36} color={SOFT_EDGE} />
    </group>
  )
}

function PaperStack() {
  return (
    <group position={[-0.66, 0.965, -0.08]} rotation={[0, -0.12, 0]}>
      {[0, 1, 2, 3].map((index) => (
        <LineBox
          key={index}
          position={[index * 0.012, index * 0.01, index * 0.008]}
          scale={[0.34, 0.01, 0.24]}
          color="#dfe8f2"
          edge={WHITE_EDGE}
          opacity={0.42}
        />
      ))}
      <DeskLineSegments
        segments={[
          [[-0.13, 0.055, -0.06], [0.12, 0.055, -0.06]],
          [[-0.13, 0.055, 0.01], [0.08, 0.055, 0.01]],
          [[-0.13, 0.055, 0.07], [0.11, 0.055, 0.07]],
        ]}
        opacity={0.28}
        color={MUTED_EDGE}
      />
    </group>
  )
}

function DeskLamp() {
  return (
    <group position={[-0.95, 0.98, -0.25]} rotation={[0, -0.38, 0]}>
      <LineCylinder position={[0, 0.025, 0]} args={[0.11, 0.11, 0.05, 28]} color="#121923" edge={SOFT_EDGE} opacity={0.46} />
      <LineCylinder position={[0, 0.25, 0]} args={[0.016, 0.016, 0.46, 12]} color="#121923" edge={SOFT_EDGE} opacity={0.46} />
      <LineBox position={[0.08, 0.48, 0]} scale={[0.26, 0.08, 0.16]} rotation={[0, 0, -0.2]} color="#151b22" edge={SOFT_EDGE} opacity={0.5} emissive={WARM_GLOW} emissiveIntensity={0.1} />
      <pointLight intensity={1.6} distance={2.0} position={[0.08, 0.42, 0.02]} color={WARM_GLOW} />
    </group>
  )
}

function DormWorkstation({ time }: { time: number }) {
  return (
    <group>
      <DormDesk />
      <ImportedModel path={ASSETS.chair} position={[0, 0.02, 0.94]} rotation={[0, Math.PI, 0]} scale={[1.54, 1.54, 1.54]} edgeThreshold={34} lineOpacity={0.6} />
      <SittingStudent time={time} />
      <ImportedModel path={ASSETS.computer} position={[0.18, 0.96, -0.3]} rotation={[0, Math.PI, 0]} scale={[0.72, 0.72, 0.72]} edgeThreshold={34} lineOpacity={0.48} />
      <LineBox position={[0.18, 1.21, -0.253]} scale={[0.56, 0.31, 0.012]} color="#071421" edge={ACTIVE_BLUE} opacity={0.36} emissive={ACTIVE_BLUE} emissiveIntensity={0.12} />
      <ImportedModel path={ASSETS.keyboard} position={[0.0, 0.935, 0.18]} scale={[0.66, 0.66, 0.66]} />
      <ImportedModel path={ASSETS.mug} position={[0.62, 0.94, 0.16]} rotation={[0, 0.2, 0]} scale={[0.26, 0.26, 0.26]} />
      <PaperStack />
      <LineBox position={[-0.38, 0.975, 0.22]} rotation={[0, 0.24, 0]} scale={[0.32, 0.018, 0.22]} color="#111923" edge={SOFT_EDGE} opacity={0.42} />
      <DeskLamp />
    </group>
  )
}

function DormShell() {
  const floorLines = useMemo<Array<[Vec3, Vec3]>>(() => {
    const lines: Array<[Vec3, Vec3]> = []
    for (let x = -3.6; x <= 3.6; x += 0.6) lines.push([[x, 0.012, -2.6], [x, 0.012, 2.0]])
    for (let z = -2.6; z <= 2.0; z += 0.6) lines.push([[-3.6, 0.012, z], [3.6, 0.012, z]])
    return lines
  }, [])

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.3]} receiveShadow>
        <planeGeometry args={[7.2, 4.8]} />
        <meshStandardMaterial color="#05080d" roughness={0.86} />
        <Edges color={MUTED_EDGE} threshold={5} />
      </mesh>
      <DeskLineSegments segments={floorLines} opacity={0.1} color={MUTED_EDGE} />
      <LineBox position={[0, 1.35, -2.35]} scale={[7.2, 2.7, 0.12]} color="#060910" edge={MUTED_EDGE} opacity={0.28} />
      <LineBox position={[-3.55, 1.24, -0.25]} scale={[0.12, 2.48, 4.3]} color="#060910" edge={MUTED_EDGE} opacity={0.18} />
      <LineBox position={[-2.5, 1.45, -2.04]} scale={[1.18, 0.84, 0.04]} color="#08131c" edge={MUTED_EDGE} opacity={0.28} emissive={ACTIVE_BLUE} emissiveIntensity={0.018} />
      <ImportedModel path={ASSETS.bed} position={[-2.25, 0.05, -1.1]} rotation={[0, Math.PI * 0.5, 0]} scale={[1.38, 1.38, 1.38]} opacity={0.78} edge={SOFT_EDGE} edgeThreshold={42} lineOpacity={0.28} />
      <ImportedModel path={ASSETS.bookcase} position={[2.58, 0.05, -1.36]} rotation={[0, -Math.PI * 0.5, 0]} scale={[1.18, 1.18, 1.18]} opacity={0.76} edge={SOFT_EDGE} edgeThreshold={48} lineOpacity={0.28} />
      <ImportedModel path={ASSETS.shelf} position={[2.78, 0.05, 0.1]} rotation={[0, -Math.PI * 0.5, 0]} scale={[0.72, 0.72, 0.72]} opacity={0.62} edge={MUTED_EDGE} edgeThreshold={48} lineOpacity={0.2} />
    </group>
  )
}

const SCAN_CARDS = [
  { name: '邮件', body: '89 封 → 已分类', position: [-1.05, 2.02, 0.04] as Vec3 },
  { name: '微信', body: '34 条 → 已分类', position: [-0.35, 2.2, -0.02] as Vec3 },
  { name: '钉钉', body: '12 条 → 已处理', position: [0.35, 2.2, -0.02] as Vec3 },
  { name: '导师语音', body: '3 条 → 已转文字', position: [1.05, 2.02, 0.04] as Vec3 },
]

function ScanCard({ name, body, position, time, index }: { name: string; body: string; position: Vec3; time: number; index: number }) {
  const opacity = visibilityBetween(time, 6.8 + index * 0.12, 12.6, 0.34)
  const gather = smoothStep(time, 10.8, 12.6)
  if (opacity <= 0.01) return null

  return (
    <Html position={position} center distanceFactor={7.4} transform sprite occlude={false} zIndexRange={[34, 0]}>
      <div className="object-label object-label--action info-filter-tool-card" style={{ opacity, transform: `translate3d(0, ${6 - opacity * 6 + gather * 7}px, 0) scale(${0.9 + opacity * 0.1 - gather * 0.08})` }}>
        <strong>{name}</strong>
        <span>{body}</span>
      </div>
    </Html>
  )
}

function PriorityCard({ time }: { time: number }) {
  const opacity = visibilityBetween(time, 12.2, 33.5, 0.65)
  if (opacity <= 0.01) return null

  return (
    <Html position={[0.42, 1.72, 0.44]} center distanceFactor={8.9} transform sprite occlude={false} zIndexRange={[42, 0]}>
      <div className="info-filter-main-card" style={{ opacity, transform: `translateY(${5 - opacity * 5}px) scale(${0.66 + opacity * 0.07})` }}>
        <div className="info-filter-topbar">
          <span>Evans Inbox Triage / 08:23</span>
          <i>138 → 5</i>
        </div>
        <header>
          <small>今天真正需要你处理的</small>
          <strong>5 件真要务</strong>
        </header>
        <ol>
          <li><b>导师论文意见</b><span>第二章补 Ricoeur + McAdams；第三章方法论周五前改完。</span></li>
          <li><b>答辩流程通知</b><span>6 月 12 日 09:00 已加进日历。</span></li>
          <li><b>师姐 2 篇文献</b><span>已存入 Zotero，标签“叙事认同”。</span></li>
          <li><b>实习周报</b><span>已用上周数据填好 60%，待补本周个人进度。</span></li>
          <li><b>室友聚餐</b><span>已先回复：“晚上跟你商量”。</span></li>
        </ol>
      </div>
    </Html>
  )
}

function AutoPanel({ time }: { time: number }) {
  const opacity = visibilityBetween(time, 16.2, 32.5, 0.55)
  if (opacity <= 0.01) return null

  return (
    <Html position={[1.62, 1.0, 0.78]} center distanceFactor={8.5} transform sprite occlude={false} zIndexRange={[39, 0]}>
      <div className="info-filter-side-card" style={{ opacity, transform: `translateY(${5 - opacity * 5}px) scale(${0.78 + opacity * 0.06})` }}>
        <strong>已自动处理</strong>
        <span>营销邮件 75 封 · 已归档</span>
        <span>重复公众号 8 个 · 已退订</span>
        <span>群闲聊 22 条 · 已静默</span>
        <span>24 小时后再扫描一次</span>
      </div>
    </Html>
  )
}

function CalendarPanel({ time }: { time: number }) {
  const opacity = visibilityBetween(time, 17.8, 33.2, 0.55)
  if (opacity <= 0.01) return null

  return (
    <Html position={[-1.46, 0.98, 0.7]} center distanceFactor={8.5} transform sprite occlude={false} zIndexRange={[39, 0]}>
      <div className="info-filter-calendar-card" style={{ opacity, transform: `translateY(${5 - opacity * 5}px) scale(${0.78 + opacity * 0.06})` }}>
        <strong>深度工作锁定</strong>
        <b>周三 09:00-12:00</b>
        <span>第三章方法论修改</span>
        <i>静默所有 IM · 仅导师消息可达</i>
      </div>
    </Html>
  )
}

function DialogueLayer({ time }: { time: number }) {
  const entries = [
    {
      start: 0.7,
      end: 5.0,
      kind: 'person',
      title: '林涵',
      body: '我看看今天有什么……天哪，89 封未读邮件，34 个微信，导师还发了三条语音。',
      position: [-0.46, 1.58, 0.94] as Vec3,
    },
    {
      start: 5.3,
      end: 9.0,
      kind: 'voice',
      title: 'Evans',
      body: '林涵，你今天看着信息多，其实需要你亲自处理的只有 5 件事。',
      position: [-0.46, 1.72, 0.9] as Vec3,
    },
    {
      start: 20.5,
      end: 25.6,
      kind: 'voice',
      title: 'Evans',
      body: '剩下的事都不用你今天处理。你先喝杯水，然后我们开始第三章好吗？',
      position: [-0.46, 1.72, 0.9] as Vec3,
    },
  ]

  return (
    <>
      {entries.map((entry) => {
        const opacity = visibilityBetween(time, entry.start, entry.end)
        if (opacity <= 0.01) return null
        return (
          <Html key={entry.start} position={entry.position} center distanceFactor={7.8} transform sprite occlude={false} zIndexRange={[38, 0]}>
            <div className={`object-label object-label--${entry.kind} info-filter-dialog`} style={{ opacity, transform: `translateY(${8 - opacity * 8}px) scale(${0.94 + opacity * 0.06})` }}>
              <strong>{entry.title}</strong>
              <span>{entry.body}</span>
            </div>
          </Html>
        )
      })}
    </>
  )
}

function DispatchMotion({ time }: { time: number }) {
  const brooch = useMemo(() => new THREE.Vector3(0.05, 1.24, 0.52), [])
  const main = useMemo(() => new THREE.Vector3(0.42, 1.62, 0.44), [])
  const autoPanel = useMemo(() => new THREE.Vector3(1.62, 1.0, 0.78), [])
  const calendar = useMemo(() => new THREE.Vector3(-1.46, 0.98, 0.7), [])

  return (
    <group>
      {SCAN_CARDS.map((card, index) => {
        const target = new THREE.Vector3(...card.position)
        return (
          <AnimatedRoute
            key={`scan-${card.name}`}
            points={[brooch, new THREE.Vector3(target.x * 0.36, 1.66 + index * 0.04, 0.18), target]}
            time={time}
            start={6.4 + index * 0.12}
            end={7.9 + index * 0.14}
            holdUntil={12.4}
            color={ACTIVE_BLUE}
            width={0.0048}
            opacity={0.46}
          />
        )
      })}
      {SCAN_CARDS.map((card, index) => (
        <AnimatedRoute
          key={`gather-${card.name}`}
          points={[new THREE.Vector3(...card.position), new THREE.Vector3(0.2 + index * 0.05, 1.88, 0.2), main]}
          time={time}
          start={10.4 + index * 0.1}
          end={12.5 + index * 0.08}
          holdUntil={16.2}
          color={MAIN_BLUE}
          width={0.006}
          opacity={0.6}
        />
      ))}
      <AnimatedRoute points={[brooch, new THREE.Vector3(0.82, 1.28, 0.78), autoPanel]} time={time} start={15.6} end={16.8} holdUntil={25.2} color={ACTIVE_BLUE} width={0.0048} opacity={0.44} />
      <AnimatedRoute points={[brooch, new THREE.Vector3(-0.78, 1.22, 0.74), calendar]} time={time} start={17.2} end={18.5} holdUntil={26.2} color={MAIN_BLUE} width={0.0056} opacity={0.58} />
      {SCAN_CARDS.map((card, index) => <ScanCard key={card.name} {...card} time={time} index={index} />)}
      <PriorityCard time={time} />
      <AutoPanel time={time} />
      <CalendarPanel time={time} />
      <DialogueLayer time={time} />
    </group>
  )
}

function InfoFilterSet({ time }: { time: number }) {
  return (
    <group>
      <DormShell />
      <DormWorkstation time={time} />
      <DispatchMotion time={time} />
    </group>
  )
}

function AnimatedScene({ time }: { time: number }) {
  return (
    <>
      <color attach="background" args={['#05080d']} />
      <fog attach="fog" args={['#05080d', 5.5, 11.5]} />
      <OrthographicCamera makeDefault position={[2.7, 2.16, 3.34]} zoom={122} />
      <CameraMotion time={time} />
      <ambientLight intensity={0.42} />
      <hemisphereLight intensity={0.26} color="#d8e6ff" groundColor="#080604" />
      <directionalLight castShadow intensity={1.05} position={[4.2, 6.8, 4.6]} shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <spotLight castShadow intensity={6.6} angle={0.46} penumbra={0.84} position={[0.4, 3.6, 2.0]} color="#dcecff" />
      <pointLight intensity={0.9} distance={2.2} position={[BROOCH_POINT.x, BROOCH_POINT.y, BROOCH_POINT.z]} color={ACTIVE_BLUE} />
      <group rotation={[0, -0.06, 0]}>
        <InfoFilterSet time={time} />
      </group>
      <ContactShadows position={[0, 0.02, 0]} opacity={0.58} scale={9} blur={2.35} far={6} color="#000000" />
      <OrbitControls enabled={false} enablePan={false} enableZoom={false} enableRotate={false} target={[0, 1.18, 0.15]} />
    </>
  )
}

function SceneOverlay({ time }: { time: number }) {
  return (
    <div className="story-progress">
      <i style={{ width: `${(time / STORY_DURATION) * 100}%` }} />
    </div>
  )
}

export function InfoFilterExperience() {
  const time = useStoryClock()

  return (
    <section className="interior-shell" aria-label="清晨宿舍工作位信息洪流过滤三维静态场景">
      <Canvas shadows dpr={[1, 2]}>
        <Suspense fallback={null}>
          <AnimatedScene time={time} />
        </Suspense>
      </Canvas>
      <SceneOverlay time={time} />
    </section>
  )
}

export default InfoFilterExperience
