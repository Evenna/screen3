import { useFrame, useThree } from '@react-three/fiber'
import { Edges } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

export type Vec3 = [number, number, number]

export const WHITE_EDGE = '#eef1f6'
export const UI_BLUE = '#8fd2ff'
export const MODEL_DARK = '#15191f'

export function smoothStep(value: number, start: number, end: number) {
  const x = Math.min(1, Math.max(0, (value - start) / (end - start)))
  return x * x * (3 - 2 * x)
}

export function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

export function useLoopClock(duration: number) {
  const [time, setTime] = useState(0)

  useEffect(() => {
    const startedAt = performance.now()
    let frame = 0
    const tick = () => {
      setTime(((performance.now() - startedAt) / 1000) % duration)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [duration])

  return time
}

export function LineBox({
  position,
  scale,
  rotation = [0, 0, 0],
  color = MODEL_DARK,
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
        roughness={0.78}
        metalness={0.03}
        transparent={opacity < 1}
        opacity={opacity}
      />
      <Edges color={edge} threshold={15} />
    </mesh>
  )
}

export function LineCylinder({
  position,
  rotation = [0, 0, 0],
  args,
  color = MODEL_DARK,
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
        metalness={0.02}
        transparent={opacity < 1}
        opacity={opacity}
      />
      <Edges color={edge} threshold={12} />
    </mesh>
  )
}

export function LineSphere({
  position,
  scale,
  color = MODEL_DARK,
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
        roughness={0.82}
        metalness={0.02}
        transparent={opacity < 1}
        opacity={opacity}
      />
      <Edges color={edge} threshold={10} />
    </mesh>
  )
}

export function CameraRig({
  time,
  keyframes,
}: {
  time: number
  keyframes: Array<{ at: number; position: Vec3; look: Vec3; zoom: number }>
}) {
  const { camera } = useThree()
  const lookAt = useRef(new THREE.Vector3(...keyframes[0].look))

  useFrame((_, delta) => {
    const index = Math.max(0, keyframes.findIndex((frame, frameIndex) => {
      const next = keyframes[frameIndex + 1]
      return next ? time >= frame.at && time < next.at : time >= frame.at
    }))
    const current = keyframes[index]
    const next = keyframes[Math.min(index + 1, keyframes.length - 1)]
    const blend = current === next ? 0 : smoothStep(time, current.at, next.at)
    const targetPosition = new THREE.Vector3(...current.position).lerp(new THREE.Vector3(...next.position), blend)
    const targetLook = new THREE.Vector3(...current.look).lerp(new THREE.Vector3(...next.look), blend)
    const targetZoom = current.zoom + (next.zoom - current.zoom) * blend
    const ease = 1 - Math.exp(-delta * 2.6)

    camera.position.lerp(targetPosition, ease)
    lookAt.current.lerp(targetLook, ease)
    camera.zoom += (targetZoom - camera.zoom) * ease
    camera.lookAt(lookAt.current)
    camera.updateProjectionMatrix()
  })

  return null
}

export function BlueTrail({
  time,
  start,
  end,
  points,
}: {
  time: number
  start: number
  end: number
  points: Vec3[]
}) {
  const progress = clamp01((time - start) / (end - start))
  const visible = smoothStep(time, start, start + 0.5) * (1 - smoothStep(time, end + 8, end + 11))
  const vectors = useMemo(() => points.map((point) => new THREE.Vector3(...point)), [points])
  const curve = useMemo(() => new THREE.CatmullRomCurve3(vectors, false, 'catmullrom', 0.35), [vectors])
  const geometry = useMemo(() => {
    const count = Math.max(3, Math.ceil(150 * progress))
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curve.getPoints(count)), 96, 0.011, 8, false)
  }, [curve, progress])
  const dot = curve.getPoint(progress)

  if (progress <= 0.02 || visible <= 0.02) return null

  return (
    <group>
      <mesh geometry={geometry}>
        <meshBasicMaterial color={UI_BLUE} transparent opacity={0.36 + visible * 0.38} />
      </mesh>
      <LineSphere
        position={[dot.x, dot.y, dot.z]}
        scale={[0.045, 0.045, 0.045]}
        color={UI_BLUE}
        edge={UI_BLUE}
        emissive={UI_BLUE}
        emissiveIntensity={1}
        opacity={0.9}
      />
    </group>
  )
}
