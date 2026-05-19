import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { ContactShadows, Edges, Html, OrbitControls, OrthographicCamera } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { Mesh, Object3D } from 'three'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import '../../App.css'

type Vec3 = [number, number, number]

const STORY_DURATION = 42
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
    if (target <= length) {
      return points[index].clone().lerp(points[index + 1], length <= 0.001 ? 0 : target / length)
    }
    target -= length
  }

  return points[points.length - 1].clone()
}

function CameraMotion({ time }: { time: number }) {
  const { camera } = useThree()
  const lookAt = useRef(new THREE.Vector3(0, 1.18, 0.08))
  const frames = useMemo(
    () => [
      { at: 0, position: new THREE.Vector3(2.6, 2.16, 3.22), look: new THREE.Vector3(0.02, 1.12, 0.18), zoom: 128 },
      { at: 5.5, position: new THREE.Vector3(1.78, 1.82, 2.22), look: new THREE.Vector3(0.08, 1.24, 0.44), zoom: 158 },
      { at: 13.0, position: new THREE.Vector3(2.3, 2.4, 3.0), look: new THREE.Vector3(0.08, 1.56, 0.1), zoom: 126 },
      { at: 22.0, position: new THREE.Vector3(2.86, 2.12, 2.7), look: new THREE.Vector3(0.34, 1.28, 0.22), zoom: 136 },
      { at: 31.0, position: new THREE.Vector3(2.42, 1.95, 2.86), look: new THREE.Vector3(0.02, 1.08, 0.26), zoom: 142 },
      { at: 37.8, position: new THREE.Vector3(2.42, 1.95, 2.86), look: new THREE.Vector3(0.02, 1.08, 0.26), zoom: 142 },
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

function StudyDesk() {
  const deskLines = useMemo<Array<[Vec3, Vec3]>>(
    () => [
      [[-1.28, 0.96, 0.62], [1.28, 0.96, 0.62]],
      [[-1.28, 0.96, 0.62], [-1.28, 0.96, -0.54]],
      [[1.28, 0.96, 0.62], [1.28, 0.96, -0.54]],
      [[-1.28, 0.96, -0.54], [1.28, 0.96, -0.54]],
      [[-1.28, 0.84, 0.62], [1.28, 0.84, 0.62]],
      [[-1.28, 0.84, -0.54], [1.28, 0.84, -0.54]],
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
      <LineBox position={[-1.12, 0.46, 0.5]} scale={[0.11, 0.82, 0.11]} opacity={0.38} edge={SOFT_EDGE} />
      <LineBox position={[1.12, 0.46, 0.5]} scale={[0.11, 0.82, 0.11]} opacity={0.38} edge={SOFT_EDGE} />
      <LineBox position={[-1.12, 0.46, -0.44]} scale={[0.1, 0.82, 0.1]} opacity={0.26} edge={SOFT_EDGE} />
      <LineBox position={[1.12, 0.46, -0.44]} scale={[0.1, 0.82, 0.1]} opacity={0.26} edge={SOFT_EDGE} />
      <DeskLineSegments segments={deskLines} opacity={0.38} color={SOFT_EDGE} />
    </group>
  )
}

function DeskLamp({ time }: { time: number }) {
  const warm = smoothStep(time, 15.5, 22.0)
  const color = new THREE.Color('#dbe8ff').lerp(new THREE.Color(WARM_GLOW), warm).getStyle()
  const intensity = 0.08 + warm * 0.26

  return (
    <group position={[-0.92, 0.98, -0.24]} rotation={[0, -0.38, 0]}>
      <LineCylinder position={[0, 0.025, 0]} args={[0.12, 0.12, 0.05, 28]} color="#121923" edge={SOFT_EDGE} opacity={0.52} />
      <LineCylinder position={[0, 0.27, 0]} args={[0.018, 0.018, 0.5, 12]} color="#121923" edge={SOFT_EDGE} opacity={0.52} />
      <LineBox position={[0.08, 0.52, 0]} scale={[0.3, 0.09, 0.18]} rotation={[0, 0, -0.24]} color="#151b22" edge={SOFT_EDGE} opacity={0.62} emissive={color} emissiveIntensity={intensity} />
      <mesh position={[0.08, 0.45, 0]}>
        <coneGeometry args={[0.26, 0.66, 32, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.08 + warm * 0.12} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <pointLight intensity={1.3 + warm * 2.3} distance={2.3} position={[0.08, 0.42, 0.02]} color={color} />
    </group>
  )
}

function EvansBrooch({ time }: { time: number }) {
  const warm = smoothStep(time, 24.0, 28.0)
  const glowColor = new THREE.Color(ACTIVE_BLUE).lerp(new THREE.Color(WARM_GLOW), warm).getStyle()
  const glow = 0.42 + pulse(time, 2.4) * 0.28 + warm * 0.18

  return (
    <group position={[BROOCH_POINT.x - 0.05, BROOCH_POINT.y - 0.63, BROOCH_POINT.z - 0.56]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <torusGeometry args={[0.052, 0.004, 10, 36]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.76} />
      </mesh>
      <mesh position={[0, 0, 0.006]}>
        <sphereGeometry args={[0.028, 18, 12]} />
        <meshStandardMaterial color="#101722" emissive={glowColor} emissiveIntensity={glow} roughness={0.55} />
      </mesh>
      <mesh rotation={[0, 0, 0.4]}>
        <torusGeometry args={[0.09 + pulse(time, 1.8) * 0.012, 0.0028, 8, 42]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.16 + pulse(time, 2.1) * 0.12} />
      </mesh>
    </group>
  )
}

function SittingMan({ time }: { time: number }) {
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
    <group position={[0.08, 0.24, 0.9]} rotation={[0.1, Math.PI * 0.5, 0]} scale={[1.32, 1.32, 1.32]}>
      <primitive object={outline} scale={1.012} />
      <primitive object={model} />
      <EvansBrooch time={time} />
    </group>
  )
}

function StudyWorkstation({ time }: { time: number }) {
  const screenDim = 1 - smoothStep(time, 27.5, 32.0) * 0.72

  return (
    <group>
      <StudyDesk />
      <ImportedModel path={ASSETS.chair} position={[0, 0.02, 0.94]} rotation={[0, Math.PI, 0]} scale={[1.58, 1.58, 1.58]} edgeThreshold={34} lineOpacity={0.6} />
      <SittingMan time={time} />
      <ImportedModel path={ASSETS.computer} position={[0.18, 0.96, -0.3]} rotation={[0, Math.PI, 0]} scale={[0.72, 0.72, 0.72]} edgeThreshold={34} lineOpacity={0.48} />
      <LineBox position={[0.18, 1.21, -0.253]} scale={[0.56, 0.31, 0.012]} color="#06111e" edge={ACTIVE_BLUE} opacity={0.34 * screenDim} emissive={ACTIVE_BLUE} emissiveIntensity={0.09 * screenDim} />
      <ImportedModel path={ASSETS.keyboard} position={[0.0, 0.935, 0.18]} scale={[0.66, 0.66, 0.66]} />
      <ImportedModel path={ASSETS.mug} position={[-0.58, 0.94, 0.18]} rotation={[0, -0.28, 0]} scale={[0.28, 0.28, 0.28]} />
      <LineBox position={[-0.57, 1.02, 0.18]} scale={[0.12, 0.012, 0.12]} color="#030507" edge={MUTED_EDGE} opacity={0.38} />
      <DeskLamp time={time} />
    </group>
  )
}

function CityWindow() {
  const buildingSegments = useMemo<Array<[Vec3, Vec3]>>(() => {
    const lines: Array<[Vec3, Vec3]> = []
    for (let x = -1.35; x <= 1.35; x += 0.45) {
      lines.push([[x, -0.52, 0.032], [x, 0.52, 0.032]])
    }
    for (let y = -0.38; y <= 0.38; y += 0.22) {
      lines.push([[-1.45, y, 0.032], [1.45, y, 0.032]])
    }
    return lines
  }, [])
  const lights = [-1.12, -0.68, -0.22, 0.32, 0.92, 1.18]

  return (
    <group position={[0.1, 1.5, -2.05]}>
      <LineBox position={[0, 0, 0]} scale={[3.0, 1.22, 0.04]} color="#06111a" edge={MUTED_EDGE} opacity={0.28} emissive={ACTIVE_BLUE} emissiveIntensity={0.018} />
      <DeskLineSegments segments={buildingSegments} opacity={0.22} color={MUTED_EDGE} />
      {lights.map((x, index) => (
        <LineBox
          key={x}
          position={[x, -0.28 + (index % 3) * 0.28, 0.06]}
          scale={[0.08, 0.035, 0.012]}
          color="#f3d18d"
          edge="#f3d18d"
          opacity={0.52}
          emissive="#f3d18d"
          emissiveIntensity={0.18}
        />
      ))}
    </group>
  )
}

function StudyRoomShell() {
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
      <CityWindow />
      <LineBox position={[2.56, 0.92, -1.36]} scale={[0.54, 1.68, 0.32]} color="#090e15" edge={MUTED_EDGE} opacity={0.28} />
      {[-0.45, 0.05, 0.55].map((y) => (
        <LineBox key={y} position={[2.56, 1.04 + y, -1.15]} scale={[0.48, 0.04, 0.06]} color="#121923" edge={SOFT_EDGE} opacity={0.32} />
      ))}
    </group>
  )
}

function DataCard({ time }: { time: number }) {
  const opacity = visibilityBetween(time, 11.8, 38.5, 0.65)
  if (opacity <= 0.01) return null

  return (
    <Html position={[0.2, 1.82, 0.38]} center distanceFactor={8.9} transform sprite occlude={false} zIndexRange={[42, 0]}>
      <div className="decision-copilot-data-card" style={{ opacity, transform: `translateY(${6 - opacity * 6}px) scale(${0.7 + opacity * 0.08})` }}>
        <div className="decision-copilot-card-topbar">
          <span>Parallel Life Simulator / 23:08</span>
          <i>6 个月推演</i>
        </div>
        <header>
          <small>不替你选择，只把未来摊开</small>
          <strong>平行人生模拟器</strong>
        </header>
        <div className="decision-copilot-stats">
          <span><b>路径 A</b>接受 offer<br />年薪 +18 万</span>
          <span><b>路径 B</b>留下加薪<br />年薪 +6 万</span>
          <span><b>边界</b>决定权 100% 在你</span>
        </div>
        <section className="decision-copilot-compare">
          <div>
            <b>接受 offer</b>
            <span>焦虑指数 ↑↑↑</span>
            <span>与小雨关系 -60%</span>
            <span>倦怠概率 70%</span>
            <strong>满意度 58 / 100</strong>
          </div>
          <div>
            <b>留下加薪</b>
            <span>焦虑指数 →</span>
            <span>亲密关系稳定</span>
            <span>倦怠概率 25%</span>
            <strong>满意度 76 / 100</strong>
          </div>
        </section>
      </div>
    </Html>
  )
}

function ActionPanel({ time }: { time: number }) {
  const opacity = visibilityBetween(time, 16.0, 38.0, 0.62)
  if (opacity <= 0.01) return null

  return (
    <Html position={[1.72, 1.18, 0.68]} center distanceFactor={8.7} transform sprite occlude={false} zIndexRange={[40, 0]}>
      <div className="decision-copilot-action-card" style={{ opacity, transform: `translateY(${5 - opacity * 5}px) scale(${0.72 + opacity * 0.07})` }}>
        <strong>历史模式回溯</strong>
        <span>2021 跳 AA：3 个月后抱怨 14 次</span>
        <span>2023 跳 BB：失眠记录 +200%</span>
        <span>2024 选择留下：整体满意度提升</span>
        <span>共同模式：后悔原因不是薪资</span>
      </div>
    </Html>
  )
}

function ProfileCard({ time }: { time: number }) {
  const opacity = visibilityBetween(time, 6.0, 14.8, 0.45)
  if (opacity <= 0.01) return null

  return (
    <Html position={[-1.04, 2.02, 0.06]} center distanceFactor={7.8} transform sprite occlude={false} zIndexRange={[36, 0]}>
      <div className="object-label object-label--action decision-copilot-tool-card" style={{ opacity }}>
        <strong>长期画像档案</strong>
        <span>陪伴 213 天｜风险偏好中偏保守｜重视关系稳定</span>
      </div>
    </Html>
  )
}

function RelationCard({ time }: { time: number }) {
  const opacity = visibilityBetween(time, 6.7, 15.5, 0.45)
  if (opacity <= 0.01) return null

  return (
    <Html position={[1.04, 2.02, 0.06]} center distanceFactor={7.8} transform sprite occlude={false} zIndexRange={[36, 0]}>
      <div className="decision-copilot-network-card" style={{ opacity }}>
        <strong>关系网络影响</strong>
        <span>小雨：希望稳定 · 提到结婚</span>
        <span>父母：反对折腾</span>
        <span>现领导：许诺加薪 20%</span>
        <span>现团队：磨合度高</span>
      </div>
    </Html>
  )
}

function DialogueLayer({ time }: { time: number }) {
  const entries = [
    {
      start: 0.7,
      end: 5.2,
      kind: 'person',
      title: '李明',
      body: 'Evans，我收到那家创业公司的 offer 了，薪水高 40%，但我有点犹豫……我不知道该不该走。',
      position: [-0.44, 1.58, 0.94] as Vec3,
    },
    {
      start: 5.5,
      end: 9.5,
      kind: 'voice',
      title: 'Evans',
      body: '我陪你过了 213 天，你不需要一个答案，你需要把脑里的东西摊开来看。',
      position: [-0.44, 1.72, 0.9] as Vec3,
    },
    {
      start: 18.0,
      end: 23.5,
      kind: 'voice',
      title: 'Evans',
      body: '我注意到一件事：你过去 3 次跳槽，2 次后悔。后悔原因不是薪资，是你低估了高强度工作对你和小雨的影响。',
      position: [-0.44, 1.72, 0.9] as Vec3,
    },
    {
      start: 26.0,
      end: 32.0,
      kind: 'voice',
      title: 'Evans',
      body: '但这只是数据，不是命运。你现在跟两年前不一样了。最后还得你自己说。',
      position: [-0.44, 1.72, 0.9] as Vec3,
    },
  ]

  return (
    <>
      {entries.map((entry) => {
        const opacity = visibilityBetween(time, entry.start, entry.end)
        if (opacity <= 0.01) return null
        return (
          <Html key={entry.start} position={entry.position} center distanceFactor={7.8} transform sprite occlude={false} zIndexRange={[38, 0]}>
            <div className={`object-label object-label--${entry.kind} decision-copilot-dialog`} style={{ opacity, transform: `translateY(${8 - opacity * 8}px) scale(${0.94 + opacity * 0.06})` }}>
              <strong>{entry.title}</strong>
              <span>{entry.body}</span>
            </div>
          </Html>
        )
      })}
    </>
  )
}

function DeviceStatus({ time }: { time: number }) {
  const lampOpacity = visibilityBetween(time, 28.5, 38.0, 0.55)
  if (lampOpacity <= 0.01) return null

  return (
    <Html position={[0.08, 1.18, 0.86]} center distanceFactor={7.8} transform sprite occlude={false} zIndexRange={[36, 0]}>
      <div className="object-label object-label--action decision-copilot-device-note" style={{ opacity: lampOpacity }}>
        <strong>决定权声明</strong>
        决定权 100% 在你<br />
        Evans 不提交建议
      </div>
    </Html>
  )
}

function DispatchMotion({ time }: { time: number }) {
  const brooch = useMemo(() => new THREE.Vector3(0.05, 1.24, 0.52), [])
  const profile = useMemo(() => new THREE.Vector3(-1.04, 2.02, 0.06), [])
  const relation = useMemo(() => new THREE.Vector3(1.04, 2.02, 0.06), [])
  const simulator = useMemo(() => new THREE.Vector3(0.2, 1.82, 0.38), [])
  const history = useMemo(() => new THREE.Vector3(1.72, 1.18, 0.68), [])

  return (
    <group>
      <AnimatedRoute points={[brooch, new THREE.Vector3(-0.46, 1.64, 0.24), profile]} time={time} start={6.0} end={7.4} holdUntil={14.8} color={ACTIVE_BLUE} width={0.0048} opacity={0.48} />
      <AnimatedRoute points={[brooch, new THREE.Vector3(0.48, 1.66, 0.24), relation]} time={time} start={6.6} end={8.0} holdUntil={15.4} color={ACTIVE_BLUE} width={0.0048} opacity={0.48} />
      <AnimatedRoute points={[profile, new THREE.Vector3(-0.4, 1.96, 0.2), simulator]} time={time} start={10.0} end={12.0} holdUntil={19.0} color={MAIN_BLUE} width={0.006} opacity={0.62} />
      <AnimatedRoute points={[relation, new THREE.Vector3(0.58, 1.96, 0.2), simulator]} time={time} start={10.2} end={12.2} holdUntil={19.0} color={MAIN_BLUE} width={0.006} opacity={0.62} />
      <AnimatedRoute points={[brooch, new THREE.Vector3(0.96, 1.34, 0.64), history]} time={time} start={15.2} end={16.4} holdUntil={27.5} color={ACTIVE_BLUE} width={0.0048} opacity={0.48} />
      <ProfileCard time={time} />
      <RelationCard time={time} />
      <DataCard time={time} />
      <ActionPanel time={time} />
      <DialogueLayer time={time} />
      <DeviceStatus time={time} />
    </group>
  )
}

function DecisionCopilotSet({ time }: { time: number }) {
  return (
    <group>
      <StudyRoomShell />
      <StudyWorkstation time={time} />
      <DispatchMotion time={time} />
    </group>
  )
}

function AnimatedScene({ time }: { time: number }) {
  const warm = smoothStep(time, 16.0, 25.0)

  return (
    <>
      <color attach="background" args={['#03060b']} />
      <fog attach="fog" args={['#03060b', 5.2, 11]} />
      <OrthographicCamera makeDefault position={[2.6, 2.16, 3.22]} zoom={122} />
      <CameraMotion time={time} />
      <ambientLight intensity={0.32 + warm * 0.08} />
      <hemisphereLight intensity={0.22} color="#b9d7ff" groundColor="#080604" />
      <directionalLight castShadow intensity={0.8} position={[4.2, 6.8, 4.6]} shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <spotLight castShadow intensity={5.8 + warm * 2.3} angle={0.44} penumbra={0.84} position={[-0.7, 3.1, 1.2]} color={new THREE.Color('#dbe8ff').lerp(new THREE.Color(WARM_GLOW), warm).getStyle()} />
      <pointLight intensity={0.9} distance={2.2} position={[BROOCH_POINT.x, BROOCH_POINT.y, BROOCH_POINT.z]} color={ACTIVE_BLUE} />
      <group rotation={[0, -0.06, 0]}>
        <DecisionCopilotSet time={time} />
      </group>
      <ContactShadows position={[0, 0.02, 0]} opacity={0.6} scale={9} blur={2.4} far={6} color="#000000" />
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

export function DecisionCopilotExperience() {
  const time = useStoryClock()

  return (
    <section className="interior-shell" aria-label="深夜书房李明决策副驾三维静态场景">
      <Canvas shadows dpr={[1, 2]}>
        <Suspense fallback={null}>
          <AnimatedScene time={time} />
        </Suspense>
      </Canvas>
      <SceneOverlay time={time} />
    </section>
  )
}

export default DecisionCopilotExperience
