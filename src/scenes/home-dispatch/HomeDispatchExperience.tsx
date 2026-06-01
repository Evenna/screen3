import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { ContactShadows, Edges, Html, OrbitControls, OrthographicCamera } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { Mesh } from 'three'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import '../../App.css'

type Vec3 = [number, number, number]

const WHITE_EDGE = '#eef1f6'
const MUTED_EDGE = WHITE_EDGE
const SOFT_EDGE = WHITE_EDGE
const ACTIVE_BLUE = '#9ed8ff'
const WARM_BLUE = '#b8e4ff'
const DEEP_BLUE = '#3f73ff'
const STORY_DURATION = 52
const FLOOR_TOP = 0.04

const ROBOT_SUPPORT_CHARGE = new THREE.Vector3(-0.34, FLOOR_TOP, 1.34)
const ROBOT_MEDICINE_CHARGE = new THREE.Vector3(-0.82, FLOOR_TOP, 1.34)
const BROOCH_POINT = new THREE.Vector3(-0.96, 0.34, -0.43)
const ROBOT_POINT = new THREE.Vector3(-0.58, 0.35, 1.34)
const LIVING_LAMP_POINT = new THREE.Vector3(-3.18, 0.76, -0.56)
const AC_POINT = new THREE.Vector3(-3.72, 0.98, -0.42)
const SPEAKER_POINT = new THREE.Vector3(-1.86, 0.5, 0.62)
const MESSAGE_LAYER_POINT = new THREE.Vector3(1.72, 1.42, 0.3)

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

function labelVisibility(time: number, start: number, end: number) {
  const fadeIn = smoothStep(time, start, start + 0.55)
  const fadeOut = 1 - smoothStep(time, end - 0.7, end)
  return clamp01(fadeIn * fadeOut)
}

function LineBox({
  position,
  scale,
  rotation = [0, 0, 0],
  color = '#111216',
  edge = WHITE_EDGE,
  opacity = 0.86,
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
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        roughness={0.76}
        metalness={0.02}
        transparent
        opacity={opacity}
      />
      <Edges color={edge} threshold={14} />
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
        roughness={0.8}
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
  distanceFactor = 7.8,
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
  distanceFactor?: number
}) {
  const visibility = labelVisibility(time, start, end)
  const layer = 16 + priority * 8

  if (visibility <= 0.01) return null

  return (
    <Html position={position} center distanceFactor={distanceFactor} transform sprite occlude={false} zIndexRange={[layer, 0]}>
      <div
        className={`object-label object-label--${align} object-label--${variant}`}
        style={{
          opacity: visibility,
          transform: `translate3d(${align === 'right' ? '-100%' : '0'}, ${5 - visibility * 5}px, 0) scale(${0.92 + visibility * 0.08})`,
        }}
      >
        <strong>{title}</strong>
        <span>{body}</span>
      </div>
    </Html>
  )
}

function CameraMotion({ time }: { time: number }) {
  const { camera } = useThree()
  const lookAt = useRef(new THREE.Vector3(-0.18, 0.46, -0.38))
  const targetLookAt = useRef(new THREE.Vector3())
  const targetPosition = useRef(new THREE.Vector3())
  const frames = useMemo(
    () => [
      { at: 0, position: new THREE.Vector3(-1.25, 6.7, 5.15), look: new THREE.Vector3(-0.2, 0.5, -0.45), zoom: 132 },
      { at: 7.5, position: new THREE.Vector3(-1.9, 5.2, 3.7), look: new THREE.Vector3(-1.45, 0.42, 0.08), zoom: 168 },
      { at: 17.5, position: new THREE.Vector3(0.1, 6.2, 4.35), look: new THREE.Vector3(0.42, 0.36, -0.58), zoom: 146 },
      { at: 28.5, position: new THREE.Vector3(1.05, 5.8, 3.88), look: new THREE.Vector3(2.1, 0.36, -1.25), zoom: 158 },
      { at: 39.0, position: new THREE.Vector3(-0.55, 6.3, 4.75), look: new THREE.Vector3(-0.75, 0.44, -0.2), zoom: 138 },
      { at: 47.0, position: new THREE.Vector3(-1.25, 6.7, 5.15), look: new THREE.Vector3(-0.18, 0.46, -0.38), zoom: 132 },
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
    const ease = 1 - Math.exp(-delta * 2.2)

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
  color = ACTIVE_BLUE,
}: {
  start: THREE.Vector3
  end: THREE.Vector3
  width: number
  opacity: number
  color?: string
}) {
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

function SurfaceRoute({
  points,
  time,
  start,
  end,
  width = 0.006,
  holdUntil = 44.5,
  color = ACTIVE_BLUE,
  opacity = 0.42,
}: {
  points: THREE.Vector3[]
  time: number
  start: number
  end: number
  width?: number
  holdUntil?: number
  color?: string
  opacity?: number
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

  if (lengths.total <= 0.001) return null

  let drawn = progress * lengths.total
  const visibleSegments = points.slice(0, -1).map((point, index) => {
    const length = lengths.segments[index]
    const amount = clamp01(drawn / length)
    drawn -= length
    if (amount <= 0) return null

    const next = points[index + 1]
    const segmentEnd = point.clone().lerp(next, amount)
    return <SegmentTube key={index} start={point} end={segmentEnd} width={width} opacity={0.08 + fade * opacity} color={color} />
  })

  if (progress <= 0.02 || fade <= 0.02) return null

  return (
    <group>
      {visibleSegments}
    </group>
  )
}

function DeviceMotionLine({
  points,
  time,
  start,
  end,
  holdUntil,
  width = 0.006,
}: {
  points: THREE.Vector3[]
  time: number
  start: number
  end: number
  holdUntil: number
  width?: number
}) {
  const visibility = labelVisibility(time, start, holdUntil)
  const progress = clamp01((time - start) / (end - start))
  const movingPoint = getPathPoint(points, progress)
  const endpoint = points[points.length - 1]

  if (visibility <= 0.01) return null

  return (
    <group>
      <SurfaceRoute
        points={points}
        time={time}
        start={start}
        end={end}
        holdUntil={holdUntil}
        width={width}
        color={ACTIVE_BLUE}
        opacity={0.76}
      />
      <LineSphere
        position={[movingPoint.x, movingPoint.y, movingPoint.z]}
        scale={[0.026, 0.026, 0.026]}
        color={ACTIVE_BLUE}
        edge={ACTIVE_BLUE}
        emissive={ACTIVE_BLUE}
        emissiveIntensity={0.76 + pulse(time, 5.2) * 0.28}
        opacity={0.9}
      />
      <LineSphere
        position={[endpoint.x, endpoint.y, endpoint.z]}
        scale={[0.018 + pulse(time, 3.2) * 0.006, 0.018 + pulse(time, 3.2) * 0.006, 0.018 + pulse(time, 3.2) * 0.006]}
        color={ACTIVE_BLUE}
        edge={ACTIVE_BLUE}
        emissive={ACTIVE_BLUE}
        emissiveIntensity={0.42}
        opacity={visibility * 0.72}
      />
    </group>
  )
}

function getPathPoint(points: THREE.Vector3[], progress: number) {
  const safeProgress = clamp01(progress)
  const segments = points.slice(0, -1).map((point, index) => point.distanceTo(points[index + 1]))
  const total = segments.reduce((sum, length) => sum + length, 0)
  let remaining = safeProgress * total

  for (let index = 0; index < segments.length; index += 1) {
    const length = segments[index]
    if (remaining <= length) {
      return points[index].clone().lerp(points[index + 1], length === 0 ? 0 : remaining / length)
    }
    remaining -= length
  }

  return points[points.length - 1].clone()
}

function getPathTrace(points: THREE.Vector3[], progress: number) {
  const safeProgress = clamp01(progress)
  const segments = points.slice(0, -1).map((point, index) => point.distanceTo(points[index + 1]))
  const total = segments.reduce((sum, length) => sum + length, 0)
  let remaining = safeProgress * total
  const trace = [points[0].clone()]

  for (let index = 0; index < segments.length; index += 1) {
    const length = segments[index]
    if (remaining >= length) {
      trace.push(points[index + 1].clone())
      remaining -= length
      continue
    }

    trace.push(points[index].clone().lerp(points[index + 1], length === 0 ? 0 : remaining / length))
    break
  }

  return trace
}

function ImportedFurniture({
  path,
  position,
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  tint = '#1a2028',
  outlineColor = WHITE_EDGE,
}: {
  path: string
  position: Vec3
  rotation?: Vec3
  scale?: Vec3
  tint?: string
  outlineColor?: string
}) {
  const gltf = useLoader(GLTFLoader, path)
  const model = useMemo(() => {
    const clone = gltf.scene.clone(true)
    const box = new THREE.Box3().setFromObject(clone)
    const center = box.getCenter(new THREE.Vector3())
    const minY = box.min.y
    const size = box.getSize(new THREE.Vector3())
    const normalize = 1 / Math.max(size.x, size.y, size.z)
    const furnitureMeshes: Mesh[] = []

    clone.traverse((child) => {
      const mesh = child as Mesh
      if (!mesh.isMesh) return
      furnitureMeshes.push(mesh)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.material = new THREE.MeshStandardMaterial({
        color: tint,
        emissive: tint,
        emissiveIntensity: 0.015,
        roughness: 0.84,
        metalness: 0.01,
      })
    })

    furnitureMeshes.forEach((mesh) => {
      const edgeGeometry = new THREE.EdgesGeometry(mesh.geometry, 16)
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: outlineColor,
        linewidth: 1,
      })
      const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial)
      mesh.add(edges)
    })

    clone.position.set(-center.x * normalize, -minY * normalize, -center.z * normalize)
    clone.scale.setScalar(normalize)

    return clone
  }, [gltf.scene, outlineColor, tint])

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={model} />
    </group>
  )
}

function ImportedObjModel({
  path,
  position,
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  tint = '#1a2028',
  outlineColor = WHITE_EDGE,
}: {
  path: string
  position: Vec3
  rotation?: Vec3
  scale?: Vec3
  tint?: string
  outlineColor?: string
}) {
  const obj = useLoader(OBJLoader, path)
  const model = useMemo(() => {
    const clone = obj.clone(true)
    const box = new THREE.Box3().setFromObject(clone)
    const center = box.getCenter(new THREE.Vector3())
    const minY = box.min.y
    const size = box.getSize(new THREE.Vector3())
    const normalize = 1 / Math.max(size.x, size.y, size.z)
    const meshes: Mesh[] = []

    clone.traverse((child) => {
      const mesh = child as Mesh
      if (!mesh.isMesh) return
      meshes.push(mesh)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.material = new THREE.MeshStandardMaterial({
        color: tint,
        emissive: tint,
        emissiveIntensity: 0.012,
        roughness: 0.86,
        metalness: 0,
      })
    })

    meshes.forEach((mesh) => {
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(mesh.geometry, 18),
        new THREE.LineBasicMaterial({
          color: outlineColor,
          linewidth: 1,
        }),
      )
      mesh.add(edges)
    })

    clone.position.set(-center.x * normalize, -minY * normalize, -center.z * normalize)
    clone.scale.setScalar(normalize)

    return clone
  }, [obj, outlineColor, tint])

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={model} />
    </group>
  )
}

function EvansBrooch({ time }: { time: number }) {
  const active = time < 15 || (time > 25 && time < 35)
  const glow = active ? 0.36 + pulse(time, 2.4) * 0.38 : 0.06

  return (
    <group position={[BROOCH_POINT.x, BROOCH_POINT.y, BROOCH_POINT.z]} rotation={[Math.PI / 2, 0, -0.72]}>
      <mesh>
        <torusGeometry args={[0.065, 0.006, 10, 28]} />
        <meshBasicMaterial color={ACTIVE_BLUE} transparent opacity={active ? 0.94 : 0.3} />
      </mesh>
      <LineSphere
        position={[0, 0, 0.006]}
        scale={[0.032, 0.032, 0.01]}
        color="#2b2618"
        edge={WHITE_EDGE}
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

function SeatedChen({ time }: { time: number }) {
  return (
    <group>
      <ImportedObjModel
        path="/models/human-lying-pose/tripo_convert_f19e5df7-085e-459c-b336-5084c02624f0.obj"
        position={[-0.88, FLOOR_TOP, -0.2]}
        rotation={[0, -0.82, 0]}
        scale={[1.05, 1.05, 1.05]}
        tint="#26303c"
        outlineColor={WHITE_EDGE}
      />
      <EvansBrooch time={time} />
      <StoryLabel
        position={[-1.02, 0.82, -0.14]}
        time={time}
        start={5.7}
        end={8.2}
        title="陈建国"
        body="哎哟……我滑了一跤,腰好像扭了。"
        variant="person"
        priority={8}
      />
    </group>
  )
}

function FloorPlan() {
  return (
    <group>
      <LineBox position={[-2.04, 0.02, 0.56]} scale={[3.82, 0.035, 2.78]} color="#090f16" edge={WHITE_EDGE} opacity={0.26} />
      <LineBox position={[0.0, 0.025, -0.42]} scale={[1.26, 0.035, 2.22]} color="#080d14" edge={WHITE_EDGE} opacity={0.22} />
      <LineBox position={[2.04, 0.02, -1.58]} scale={[2.9, 0.035, 2.28]} color="#090e15" edge={WHITE_EDGE} opacity={0.24} />
      <LineBox position={[-2.04, 0.42, 1.98]} scale={[3.9, 0.76, 0.08]} color="#05070a" edge={SOFT_EDGE} opacity={0.42} />
      <LineBox position={[-4.0, 0.42, 0.56]} scale={[0.08, 0.76, 2.84]} color="#05070a" edge={SOFT_EDGE} opacity={0.42} />
      <LineBox position={[-2.04, 0.42, -0.88]} scale={[3.9, 0.76, 0.08]} color="#05070a" edge={SOFT_EDGE} opacity={0.4} />
      <LineBox position={[-0.2, 0.42, 1.36]} scale={[0.08, 0.76, 0.72]} color="#05070a" edge={SOFT_EDGE} opacity={0.38} />
      <LineBox position={[-0.2, 0.42, -0.16]} scale={[0.08, 0.76, 0.5]} color="#05070a" edge={SOFT_EDGE} opacity={0.38} />
      <LineBox position={[0.7, 0.42, 0.62]} scale={[0.08, 0.76, 0.66]} color="#05070a" edge={SOFT_EDGE} opacity={0.38} />
      <LineBox position={[0.7, 0.42, -1.52]} scale={[0.08, 0.76, 0.38]} color="#05070a" edge={SOFT_EDGE} opacity={0.38} />
      <LineBox position={[1.6, 0.42, -0.46]} scale={[0.78, 0.76, 0.08]} color="#05070a" edge={SOFT_EDGE} opacity={0.4} />
      <LineBox position={[2.8, 0.42, -0.46]} scale={[1.16, 0.76, 0.08]} color="#05070a" edge={SOFT_EDGE} opacity={0.4} />
      <LineBox position={[3.5, 0.42, -1.58]} scale={[0.08, 0.76, 2.24]} color="#05070a" edge={SOFT_EDGE} opacity={0.4} />
      <LineBox position={[2.06, 0.42, -2.72]} scale={[2.9, 0.76, 0.08]} color="#05070a" edge={SOFT_EDGE} opacity={0.4} />
      <LineBox position={[0.34, 0.055, -0.58]} scale={[0.38, 0.012, 1.72]} color="#0a1118" edge={WHITE_EDGE} opacity={0.16} />
    </group>
  )
}

function DeviceActivationGlow({
  position,
  time,
  start,
  end,
  scale = 0.08,
  color = '#121a24',
}: {
  position: Vec3
  time: number
  start: number
  end: number
  scale?: number
  color?: string
}) {
  const visibility = labelVisibility(time, start, end)
  const glow = visibility * (0.95 + pulse(time, 4.8) * 0.55)

  if (visibility <= 0.01) return null

  return (
    <group>
      <LineSphere
        position={position}
        scale={[scale, scale, scale]}
        color={color}
        edge={WHITE_EDGE}
        emissive={ACTIVE_BLUE}
        emissiveIntensity={glow}
        opacity={0.34 + visibility * 0.6}
      />
      <pointLight color={ACTIVE_BLUE} intensity={glow * 1.8} position={position} distance={1.45} />
    </group>
  )
}

function Furniture({ time }: { time: number }) {
  return (
    <group>
      <ImportedFurniture
        path="/models/quaternius-furniture/sofa.glb"
        position={[-2.62, FLOOR_TOP, 1.16]}
        rotation={[0, Math.PI, 0]}
        scale={[2.05, 2.05, 2.05]}
        tint="#1c242e"
        outlineColor={WHITE_EDGE}
      />
      <LineBox position={[-2.18, 0.058, 0.0]} scale={[1.5, 0.035, 0.82]} color="#171510" edge={WHITE_EDGE} opacity={0.34} />
      <LineBox position={[-2.08, 0.18, 0.42]} scale={[0.9, 0.08, 0.38]} color="#090c11" edge={WHITE_EDGE} opacity={0.68} />
      <LineBox position={[-2.08, 0.24, 0.42]} scale={[0.78, 0.018, 0.3]} color="#050a0f" edge={WHITE_EDGE} opacity={0.2} emissive={ACTIVE_BLUE} emissiveIntensity={0.015} />
      <LineCylinder position={[-2.42, 0.13, 0.24]} args={[0.018, 0.018, 0.18, 8]} color="#0b0e12" edge={MUTED_EDGE} opacity={0.8} />
      <LineCylinder position={[-1.74, 0.13, 0.24]} args={[0.018, 0.018, 0.18, 8]} color="#0b0e12" edge={MUTED_EDGE} opacity={0.8} />
      <ImportedFurniture
        path="/models/quaternius-furniture/round-table-small.glb"
        position={[-2.12, FLOOR_TOP, 0.34]}
        scale={[0.52, 0.52, 0.52]}
        tint="#0d1117"
        outlineColor={WHITE_EDGE}
      />
      <LineCylinder position={[-2.18, 0.31, 0.45]} args={[0.055, 0.055, 0.08, 18]} color="#15120f" edge={WHITE_EDGE} opacity={0.9} />
      <LineCylinder position={[-1.96, 0.31, 0.57]} args={[0.048, 0.048, 0.08, 18]} color="#10141a" edge={WHITE_EDGE} opacity={0.75} />
      <DeviceActivationGlow position={[SPEAKER_POINT.x, SPEAKER_POINT.y, SPEAKER_POINT.z]} time={time} start={37.2} end={40.4} scale={0.06} color="#142337" />
      <LineBox position={[-2.08, 0.18, -0.58]} scale={[1.28, 0.28, 0.24]} color="#080c12" edge={WHITE_EDGE} opacity={0.64} />
      <LineBox position={[-2.08, 0.9, -0.82]} scale={[1.24, 0.58, 0.055]} color="#05070a" edge={WHITE_EDGE} opacity={0.6} />
      <LineBox position={[-2.08, 0.96, -0.77]} scale={[0.94, 0.38, 0.022]} color="#03080d" edge={WHITE_EDGE} opacity={0.48} emissive={ACTIVE_BLUE} emissiveIntensity={0.018} />
      <ImportedFurniture
        path="/models/quaternius-furniture/lamp-round-floor.glb"
        position={[-3.18, FLOOR_TOP, -0.56]}
        rotation={[0, 0.28, 0]}
        scale={[1.18, 1.18, 1.18]}
        tint="#0d131a"
        outlineColor={WHITE_EDGE}
      />
      <DeviceActivationGlow position={[LIVING_LAMP_POINT.x, LIVING_LAMP_POINT.y, LIVING_LAMP_POINT.z]} time={time} start={33.6} end={36.8} scale={0.11} color="#182a3d" />
      <ImportedFurniture
        path="/models/quaternius-furniture/bed-king.glb"
        position={[2.46, FLOOR_TOP, -1.86]}
        rotation={[0, (Math.PI * 3) / 2, 0]}
        scale={[1.42, 1.42, 1.42]}
        tint="#0d1218"
        outlineColor={WHITE_EDGE}
      />
      <ImportedFurniture
        path="/models/quaternius-furniture/night-stand.glb"
        position={[3.12, FLOOR_TOP, -0.92]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={[0.36, 0.36, 0.36]}
        tint="#090e14"
        outlineColor={WHITE_EDGE}
      />
      <LineBox position={[3.12, 0.44, -0.92]} scale={[0.15, 0.03, 0.12]} color="#241411" edge={WHITE_EDGE} opacity={0.68} />
      <LineBox position={[3.12, 0.49, -0.92]} scale={[0.1, 0.035, 0.08]} color="#321010" edge={WHITE_EDGE} opacity={0.7} />
      <ImportedFurniture
        path="/models/quaternius-furniture/drawer.glb"
        position={[0.96, FLOOR_TOP, -2.32]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[0.72, 0.72, 0.72]}
        tint="#090e15"
        outlineColor={WHITE_EDGE}
      />
      <LineBox position={[0.98, 0.58, -2.66]} scale={[0.86, 1.04, 0.08]} color="#0a0d12" edge={WHITE_EDGE} opacity={0.48} />
      <ImportedFurniture
        path="/models/quaternius-furniture/lamp-round-floor.glb"
        position={[1.16, FLOOR_TOP, -0.96]}
        rotation={[0, -0.42, 0]}
        scale={[1.18, 1.18, 1.18]}
        tint="#0d131a"
        outlineColor={WHITE_EDGE}
      />
    </group>
  )
}

const SUPPORT_ROUTE = [
  ROBOT_SUPPORT_CHARGE,
  new THREE.Vector3(-0.5, FLOOR_TOP, 0.96),
  new THREE.Vector3(-0.78, FLOOR_TOP, 0.5),
  new THREE.Vector3(-1.28, FLOOR_TOP, 0.34),
  new THREE.Vector3(-1.62, FLOOR_TOP, 0.28),
]

const MEDICINE_ROUTE = [
  ROBOT_MEDICINE_CHARGE,
  new THREE.Vector3(-0.18, FLOOR_TOP, 1.12),
  new THREE.Vector3(0.18, FLOOR_TOP, 0.48),
  new THREE.Vector3(0.18, FLOOR_TOP, -0.88),
  new THREE.Vector3(1.22, FLOOR_TOP, -1.14),
  new THREE.Vector3(3.08, FLOOR_TOP, -0.92),
  new THREE.Vector3(1.34, FLOOR_TOP, -1.04),
  new THREE.Vector3(0.48, FLOOR_TOP, -0.46),
  new THREE.Vector3(-0.12, FLOOR_TOP, 0.02),
  new THREE.Vector3(-0.82, FLOOR_TOP, 0.42),
  new THREE.Vector3(-1.34, FLOOR_TOP, 0.52),
]

function getRouteSnapshot(points: THREE.Vector3[], progress: number) {
  const position = getPathPoint(points, progress)
  const ahead = getPathPoint(points, Math.min(1, progress + 0.015))
  const direction = ahead.clone().sub(position)
  const yaw = direction.lengthSq() > 0.0001 ? Math.atan2(direction.x, direction.z) : Math.PI
  return { position, yaw }
}

function getSupportProgress(time: number) {
  return smoothStep(time, 8.0, 13.6)
}

function getMedicineProgress(time: number) {
  if (time < 28.4) return smoothStep(time, 12.0, 23.4) * 0.5
  return 0.5 + smoothStep(time, 28.4, 40.8) * 0.5
}

function getSupportRobotSnapshot(time: number) {
  return getRouteSnapshot(SUPPORT_ROUTE, getSupportProgress(time))
}

function getMedicineRobotSnapshot(time: number) {
  const waitAtMedicine = 1 - smoothStep(time, 23.4, 28.4)
  const progress = getMedicineProgress(time)
  const snapshot = getRouteSnapshot(MEDICINE_ROUTE, progress)
  return waitAtMedicine > 0.02 && time >= 23.4 ? getRouteSnapshot(MEDICINE_ROUTE, 0.5) : snapshot
}

function getMedicineRobotStatus(time: number) {
  if (time >= 40.2) return { start: 40.2, end: 42.8, text: '已就位｜膏药已交付' }
  if (time >= 31.0) return { start: 31.0, end: 33.2, text: '携药返程｜避开扶助位' }
  if (time >= 23.0) return { start: 23.0, end: 25.4, text: '取药中｜云南白药膏' }
  if (time >= 16.2) return { start: 16.2, end: 18.4, text: '移动中｜前往床头柜' }
  return { start: 12.2, end: 14.4, text: '已唤醒｜目标:卧室床头柜' }
}

function RobotUnit({
  position,
  yaw,
  time,
  label,
  labelText,
  labelStart,
  labelEnd,
  accent = ACTIVE_BLUE,
}: {
  position: THREE.Vector3
  yaw: number
  time: number
  label: string
  labelText?: string
  labelStart?: number
  labelEnd?: number
  accent?: string
}) {
  const statusOpacity = labelText && labelStart !== undefined && labelEnd !== undefined ? labelVisibility(time, labelStart, labelEnd) : 0
  const awake = smoothStep(time, 3.4, 5.4)

  return (
    <group position={[position.x, position.y, position.z]} rotation={[0, yaw, 0]}>
      <ImportedFurniture
        path="/models/quaternius-furniture/humanoid-robot.glb"
        position={[0, 0, 0]}
        scale={[0.72, 0.52, 0.72]}
        tint="#223448"
        outlineColor={WHITE_EDGE}
      />
      <LineBox position={[0.0, 0.58, 0.18]} scale={[0.18, 0.025, 0.11]} color="#143654" edge={WHITE_EDGE} opacity={0.7} emissive={accent} emissiveIntensity={0.12 + awake * 0.16} />
      {statusOpacity > 0.01 && (
        <Html position={[0.22, 0.86, 0.18]} center distanceFactor={7.2} transform sprite occlude={false} zIndexRange={[19, 0]}>
          <div
            className="object-label object-label--action"
            style={{
              opacity: statusOpacity,
              transform: `translateY(${5 - statusOpacity * 5}px) scale(${0.92 + statusOpacity * 0.08})`,
            }}
          >
            <strong>{label}</strong>
            <span>{labelText}</span>
          </div>
        </Html>
      )}
    </group>
  )
}

function Robots({ time }: { time: number }) {
  const support = getSupportRobotSnapshot(time)
  const medicine = getMedicineRobotSnapshot(time)
  const medicineStatus = getMedicineRobotStatus(time)

  return (
    <group>
      <LineBox position={[-0.58, 0.18, 1.74]} scale={[0.72, 0.28, 0.12]} color="#0b1018" edge={WHITE_EDGE} opacity={0.78} emissive={ACTIVE_BLUE} emissiveIntensity={0.04} />
      <LineBox position={[-0.58, 0.31, 1.66]} scale={[0.5, 0.06, 0.08]} color="#132337" edge={WHITE_EDGE} opacity={0.62} emissive={ACTIVE_BLUE} emissiveIntensity={0.18} />
      <LineBox position={[-0.58, 0.06, 1.5]} scale={[0.94, 0.035, 0.46]} color="#0a0d12" edge={WHITE_EDGE} opacity={0.28} emissive={ACTIVE_BLUE} emissiveIntensity={0.04} />
      <ImportedFurniture
        path="/models/quaternius-furniture/robot-vacuum.glb"
        position={[ROBOT_SUPPORT_CHARGE.x, ROBOT_SUPPORT_CHARGE.y, ROBOT_SUPPORT_CHARGE.z]}
        rotation={[0, Math.PI, 0]}
        scale={[0.58, 0.58, 0.58]}
        tint="#151e28"
        outlineColor={WHITE_EDGE}
      />
      <ImportedFurniture
        path="/models/quaternius-furniture/robot-vacuum.glb"
        position={[ROBOT_MEDICINE_CHARGE.x, ROBOT_MEDICINE_CHARGE.y, ROBOT_MEDICINE_CHARGE.z]}
        rotation={[0, Math.PI, 0]}
        scale={[0.58, 0.58, 0.58]}
        tint="#151e28"
        outlineColor={WHITE_EDGE}
      />
      <RobotUnit
        position={support.position}
        yaw={support.yaw}
        time={time}
        label="扶助机器人"
        labelText="已到位｜辅助坐起"
        labelStart={13.8}
        labelEnd={15.8}
      />
      <RobotUnit
        position={medicine.position}
        yaw={medicine.yaw}
        time={time}
        label="取药机器人"
        labelText={medicineStatus.text}
        labelStart={medicineStatus.start}
        labelEnd={medicineStatus.end}
        accent={WARM_BLUE}
      />
    </group>
  )
}

function DeviceStatusLabels({ time }: { time: number }) {
  return (
    <group>
      <StoryLabel
        position={[-2.76, 0.96, -0.48]}
        time={time}
        start={33.6}
        end={36.8}
        title="电视旁落地灯"
        body="亮度 → 65%（便于查看伤情）"
        variant="action"
        priority={5}
        distanceFactor={8.2}
      />
      <StoryLabel
        position={[-2.72, 1.02, -0.36]}
        time={time}
        start={18.4}
        end={21.6}
        title="空调"
        body="冷气 → 暂停（避免肌肉受寒）"
        variant="action"
        priority={5}
        distanceFactor={8.0}
      />
      <StoryLabel
        position={[SPEAKER_POINT.x + 0.08, SPEAKER_POINT.y + 0.06, SPEAKER_POINT.z + 0.04]}
        time={time}
        start={37.2}
        end={40.4}
        title="智能音箱"
        body="静音模式（避免分散注意力）"
        variant="device"
        priority={4}
        distanceFactor={7.6}
      />
    </group>
  )
}

function DispatchLines({ time }: { time: number }) {
  const supportPosition = getSupportRobotSnapshot(time).position
  const medicinePosition = getMedicineRobotSnapshot(time).position
  const supportRoute = SUPPORT_ROUTE.map((point) => new THREE.Vector3(point.x, point.y + 0.018, point.z))
  const medicineRoute = MEDICINE_ROUTE.map((point) => new THREE.Vector3(point.x, point.y + 0.024, point.z))
  const supportTrace = getPathTrace(supportRoute, getSupportProgress(time))
  const medicineTrace = getPathTrace(medicineRoute, getMedicineProgress(time))

  return (
    <group>
      <SurfaceRoute
        time={time}
        start={3.0}
        end={7.0}
        width={0.005}
        color={ACTIVE_BLUE}
        points={[BROOCH_POINT, new THREE.Vector3(-1.02, 0.74, 0.52), ROBOT_POINT]}
      />
      <SurfaceRoute
        time={time}
        start={0}
        end={0.01}
        width={0.007}
        color={WARM_BLUE}
        opacity={0.48}
        points={supportTrace}
        holdUntil={16.0}
      />
      <SurfaceRoute
        time={time}
        start={0}
        end={0.01}
        width={0.006}
        color={WARM_BLUE}
        opacity={0.42}
        points={medicineTrace}
        holdUntil={42.8}
      />
      <DeviceMotionLine
        time={time}
        start={33.2}
        end={35.0}
        width={0.006}
        holdUntil={36.8}
        points={[BROOCH_POINT, new THREE.Vector3(-2.08, 0.68, -0.48), LIVING_LAMP_POINT]}
      />
      <SurfaceRoute
        time={time}
        start={18.0}
        end={19.8}
        width={0.004}
        color={ACTIVE_BLUE}
        holdUntil={21.6}
        points={[BROOCH_POINT, new THREE.Vector3(-2.6, 0.82, -0.32), AC_POINT]}
      />
      <DeviceMotionLine
        time={time}
        start={36.8}
        end={38.6}
        width={0.006}
        holdUntil={40.4}
        points={[BROOCH_POINT, new THREE.Vector3(-1.4, 0.44, 0.18), SPEAKER_POINT]}
      />
      <SurfaceRoute
        time={time}
        start={41.0}
        end={44.4}
        width={0.0045}
        color={DEEP_BLUE}
        opacity={0.5}
        points={[BROOCH_POINT, new THREE.Vector3(0.2, 1.1, 0.34), MESSAGE_LAYER_POINT]}
      />
      <LineSphere
        position={[supportPosition.x, supportPosition.y + 0.06, supportPosition.z]}
        scale={[0.024, 0.024, 0.024]}
        color={WARM_BLUE}
        edge={WARM_BLUE}
        emissive={WARM_BLUE}
        emissiveIntensity={0.5}
        opacity={0.7}
      />
      <LineSphere
        position={[medicinePosition.x, medicinePosition.y + 0.06, medicinePosition.z]}
        scale={[0.02, 0.02, 0.02]}
        color={WARM_BLUE}
        edge={WARM_BLUE}
        emissive={WARM_BLUE}
        emissiveIntensity={0.44}
        opacity={0.66}
      />
    </group>
  )
}

function InteriorScene({ time }: { time: number }) {
  return (
    <>
      <color attach="background" args={['#05070a']} />
      <ambientLight intensity={0.56} />
      <directionalLight castShadow intensity={1.75} position={[3.5, 6.2, 4.2]} shadow-mapSize={[2048, 2048]} />
      <pointLight color={ACTIVE_BLUE} intensity={0.85} position={[-2.2, 1.3, 0.8]} distance={4.5} />
      <pointLight color={WARM_BLUE} intensity={0.38} position={[-1.1, 2.1, 0.2]} distance={3.8} />
      <OrthographicCamera makeDefault position={[-1.25, 6.7, 5.15]} zoom={132} />
      <CameraMotion time={time} />

      <group rotation={[0, -0.04, 0]} position={[0, -0.03, 0]}>
        <FloorPlan />
        <Furniture time={time} />
        <SeatedChen time={time} />
        <Robots time={time} />
        <DeviceStatusLabels time={time} />
        <DispatchLines time={time} />
      </group>

      <ContactShadows position={[0, 0.02, 0]} opacity={0.48} scale={13} blur={2} far={7} color="#000000" />
      <OrbitControls
        enableDamping={false}
        enablePan={false}
        enableRotate={false}
        enableZoom={false}
        maxZoom={160}
        minZoom={48}
        rotateSpeed={0.55}
        target={[0, 0.52, -0.6]}
        zoomSpeed={0.75}
      />
    </>
  )
}

function DispatchMessageEditor({ time }: { time: number }) {
  const show = smoothStep(time, 41.8, 42.8) * (1 - smoothStep(time, 50.4, 51.4))
  const done = smoothStep(time, 48.2, 49.0)
  const delivered = smoothStep(time, 49.3, 50.0)
  const body = `陈伟,

您父亲今天下午 15:23 在客厅轻度跌倒,腰部扭伤旧位置。

他意识清醒,生命体征正常（心率 95→82 已回落,血氧 96%）。我已经让家里的服务机器人给他送了云南白药膏,他正在自己敷药。

不需要您立刻返家,也不需要打他电话——他不希望您操心工作。

我会继续陪着他,半小时后再给您发一条更新。如有任何变化,我会立刻打给您。`
  const visibleLength = Math.floor(body.length * smoothStep(time, 43.0, 48.0))
  const status = delivered > 0.5 ? '已送达陈伟｜已读回执:待' : done > 0.5 ? '发送中' : '编辑中'

  if (show <= 0.01) return null

  return (
    <div
      className={`dispatch-phone-overlay ${done > 0.4 ? 'is-done' : ''} ${delivered > 0.4 ? 'is-delivered' : ''}`}
      style={{
        opacity: show,
        transform: `translateY(${10 - show * 10}px) scale(${1 - delivered * 0.04})`,
      }}
    >
      <div className="park-phone-shell dispatch-phone-shell">
        <div className="park-phone-island" />
        <div className="park-phone-screen">
          <div className="park-phone-status">
            <span>15:23</span>
            <span>{status}</span>
          </div>
          <div className="park-phone-appbar dispatch-phone-appbar">
            <span>Evans 跨端通报</span>
            <b>父亲端</b>
          </div>
          <div className="park-contact-summary dispatch-contact-summary">
            <div className="park-contact-avatar">陈</div>
            <div>
              <strong>陈伟（儿子｜北京）</strong>
              <span>轻度·非危急·告知性</span>
            </div>
          </div>
          <div className="dispatch-phone-message">
            <pre>{body.slice(0, visibleLength)}{delivered > 0.3 ? '' : <em />}</pre>
          </div>
          <div className="dispatch-phone-cards">
            <span>今日生命体征曲线</span>
            <span>服药记录已同步社区医生</span>
          </div>
          <div className="park-phone-homebar" />
        </div>
      </div>
    </div>
  )
}

function StoryOverlay({ time }: { time: number }) {
  const dim = 0.08 + smoothStep(time, 8, 24) * 0.12
  const opening = smoothStep(time, 2.4, 3.2) * (1 - smoothStep(time, 4.8, 5.5))
  const evansFirst = smoothStep(time, 7.8, 8.6) * (1 - smoothStep(time, 11.0, 11.8))
  const evansSecond = smoothStep(time, 31.8, 32.6) * (1 - smoothStep(time, 39.0, 39.8))

  return (
    <>
      <div className="story-dim" style={{ opacity: dim }} />
      <DispatchMessageEditor time={time} />
      {opening > 0.01 && (
        <div className="top-narration" style={{ opacity: opening, transform: `translateX(-50%) translateY(${10 - opening * 10}px)` }}>
          <strong>家庭调度</strong>
          <span>Evans 识别跌倒后分配两台机器人：一台先到身旁扶助，一台去取药。</span>
        </div>
      )}
      {(evansFirst > 0.01 || evansSecond > 0.01) && (
        <div className="park-dialogue-subtitles dispatch-dialogue-subtitles">
          <div className="park-dialogue-subtitle park-dialogue-subtitle--evans" style={{ opacity: evansFirst }}>
            <strong>Evans</strong>
            <span>建国叔,您慢点别动,我让一台机器人先到您身边扶助,另一台去拿膏药。</span>
          </div>
          <div className="park-dialogue-subtitle park-dialogue-subtitle--evans" style={{ opacity: evansSecond }}>
            <strong>Evans</strong>
            <span>取药机器人正在回客厅。我已经把台灯调亮,也让音箱静音,先让您安心处理腰部。</span>
          </div>
        </div>
      )}
      <div className="story-progress">
        <i style={{ width: `${(time / STORY_DURATION) * 100}%` }} />
      </div>
    </>
  )
}

export function HomeDispatchExperience() {
  const time = useStoryClock()

  return (
    <section className="interior-shell" aria-label="家庭调度三维平面图场景">
      <Canvas shadows dpr={[1, 2]}>
        <Suspense fallback={null}>
          <InteriorScene time={time} />
        </Suspense>
      </Canvas>
      <StoryOverlay time={time} />
    </section>
  )
}

export default HomeDispatchExperience
