import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { ContactShadows, Edges, Html, OrbitControls, OrthographicCamera } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { Mesh, Object3D } from 'three'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import '../../App.css'

type Vec3 = [number, number, number]

const STORY_DURATION = 32
const ACTIVE_BLUE = '#9ed8ff'
const MAIN_BLUE = '#3f73ff'
const WARM_GLOW = '#ffd49a'
const WHITE_EDGE = '#eef1f6'
const SOFT_EDGE = '#7c8794'
const MUTED_EDGE = '#46515e'
const BROOCH_POINT = new THREE.Vector3(0.03, 1.22, 0.5)

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

function CameraMotion({ time }: { time: number }) {
  const { camera } = useThree()
  const lookAt = useRef(new THREE.Vector3(0, 1.2, 0.04))
  const frames = useMemo(
    () => [
      { at: 0, position: new THREE.Vector3(2.85, 2.35, 3.35), look: new THREE.Vector3(0, 1.16, 0.08), zoom: 118 },
      { at: 6.2, position: new THREE.Vector3(1.85, 1.92, 2.25), look: new THREE.Vector3(0.03, 1.25, 0.35), zoom: 148 },
      { at: 12.0, position: new THREE.Vector3(1.45, 1.72, 1.98), look: new THREE.Vector3(0.03, 1.32, 0.5), zoom: 164 },
      { at: 18.0, position: new THREE.Vector3(2.95, 2.95, 3.25), look: new THREE.Vector3(0.1, 1.14, -0.58), zoom: 108 },
      { at: 25.0, position: new THREE.Vector3(2.62, 2.24, 2.95), look: new THREE.Vector3(0, 1.2, 0.16), zoom: 128 },
      { at: 31.8, position: new THREE.Vector3(2.62, 2.24, 2.95), look: new THREE.Vector3(0, 1.2, 0.16), zoom: 128 },
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
    const ease = 1 - Math.exp(-delta * 2.6)

    camera.position.lerp(targetPosition, ease)
    lookAt.current.lerp(targetLookAt, ease)
    camera.zoom += (targetZoom - camera.zoom) * ease
    camera.lookAt(lookAt.current)
    camera.updateProjectionMatrix()
  })

  return null
}

function outlineImportedMeshes(root: Object3D, color: string, opacity = 1, edgeThreshold = 72, lineOpacityOverride?: number) {
  root.traverse((child) => {
    const mesh = child as Mesh
    if (!mesh.isMesh || !mesh.geometry) return
    mesh.castShadow = true
    mesh.receiveShadow = true
    const lineOpacity = lineOpacityOverride ?? (opacity >= 1 ? 0.42 : opacity * 0.34)
    if ((mesh as Mesh & { isSkinnedMesh?: boolean }).isSkinnedMesh) {
      mesh.material = new THREE.MeshBasicMaterial({
        color,
        wireframe: true,
        transparent: true,
        opacity: opacity >= 1 ? 0.14 : opacity * 0.18,
        depthWrite: false,
      })
      return
    }
    mesh.add(
      new THREE.LineSegments(
        new THREE.EdgesGeometry(mesh.geometry, edgeThreshold),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: lineOpacity }),
      ),
    )
  })
}

function styleImportedMeshFill(root: Object3D, opacity: number, tint = '#121821') {
  root.traverse((child) => {
    const mesh = child as Mesh
    if (!mesh.isMesh) return
    if ((mesh as Mesh & { isSkinnedMesh?: boolean }).isSkinnedMesh) return
    mesh.material = new THREE.MeshStandardMaterial({
      color: tint,
      emissive: tint,
      emissiveIntensity: 0.01,
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

function DeskLineSegments({ segments, opacity, color = WHITE_EDGE }: { segments: Array<[Vec3, Vec3]>; opacity: number; color?: string }) {
  const geometry = useMemo(() => {
    const points = segments.flatMap(([start, end]) => [
      new THREE.Vector3(...start),
      new THREE.Vector3(...end),
    ])
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [segments])

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </lineSegments>
  )
}

function DeskPart({ position, scale, opacity }: { position: Vec3; scale: Vec3; opacity: number }) {
  return (
    <mesh position={position} scale={scale} castShadow receiveShadow>
      <boxGeometry />
      <meshStandardMaterial color="#101721" emissive="#101721" emissiveIntensity={0.01} roughness={0.82} transparent opacity={opacity * 0.34} />
    </mesh>
  )
}

function DeskLeg({ position, scale, opacity }: { position: Vec3; scale: Vec3; opacity: number }) {
  return (
    <mesh position={position} scale={scale} castShadow receiveShadow>
      <boxGeometry />
      <meshStandardMaterial color="#111923" emissive="#111923" emissiveIntensity={0.012} roughness={0.82} transparent opacity={opacity * 0.58} />
    </mesh>
  )
}

function SimpleDesk({ opacity = 0.56 }: { opacity?: number }) {
  const front = useMemo<Array<[Vec3, Vec3]>>(
    () => [
      [[-1.36, 0.96, 0.64], [1.36, 0.96, 0.64]],
      [[-1.36, 0.96, 0.64], [-1.36, 0.96, -0.6]],
      [[1.36, 0.96, 0.64], [1.36, 0.96, -0.6]],
      [[-1.36, 0.84, 0.64], [1.36, 0.84, 0.64]],
      [[-1.36, 0.96, 0.64], [-1.36, 0.84, 0.64]],
      [[1.36, 0.96, 0.64], [1.36, 0.84, 0.64]],
      [[-1.36, 0.84, 0.64], [-1.36, 0.84, -0.6]],
      [[1.36, 0.84, 0.64], [1.36, 0.84, -0.6]],
      [[-1.18, 0.9, 0.52], [-1.18, 0.08, 0.52]],
      [[1.18, 0.9, 0.52], [1.18, 0.08, 0.52]],
    ],
    [],
  )
  const back = useMemo<Array<[Vec3, Vec3]>>(
    () => [
      [[-1.36, 0.96, -0.6], [1.36, 0.96, -0.6]],
      [[-1.36, 0.84, -0.6], [1.36, 0.84, -0.6]],
      [[-1.36, 0.96, -0.6], [-1.36, 0.84, -0.6]],
      [[1.36, 0.96, -0.6], [1.36, 0.84, -0.6]],
      [[-1.18, 0.9, -0.5], [-1.18, 0.08, -0.5]],
      [[1.18, 0.9, -0.5], [1.18, 0.08, -0.5]],
    ],
    [],
  )

  return (
    <group>
      <DeskPart position={[0, 0.9, 0.02]} scale={[2.7, 0.1, 1.24]} opacity={opacity} />
      <DeskLeg position={[-1.18, 0.46, 0.5]} scale={[0.12, 0.82, 0.12]} opacity={opacity * 0.86} />
      <DeskLeg position={[1.18, 0.46, 0.5]} scale={[0.12, 0.82, 0.12]} opacity={opacity * 0.86} />
      <DeskLeg position={[-1.18, 0.46, -0.48]} scale={[0.1, 0.82, 0.1]} opacity={opacity * 0.46} />
      <DeskLeg position={[1.18, 0.46, -0.48]} scale={[0.1, 0.82, 0.1]} opacity={opacity * 0.46} />
      <DeskLineSegments segments={front} opacity={opacity * 0.76} />
      <DeskLineSegments segments={back} opacity={opacity * 0.34} />
    </group>
  )
}

function FloorTiles() {
  const segments = useMemo<Array<[Vec3, Vec3]>>(() => {
    const lines: Array<[Vec3, Vec3]> = []
    for (let x = -4; x <= 4; x += 0.8) {
      lines.push([[x, 0.012, -4.1], [x, 0.012, 2.4]])
    }
    for (let z = -4; z <= 2.4; z += 0.8) {
      lines.push([[-4.3, 0.012, z], [4.3, 0.012, z]])
    }
    return lines
  }, [])

  return <DeskLineSegments segments={segments} opacity={0.16} />
}

function CeilingLights() {
  const lightPositions = [-2.6, 0, 2.6].flatMap((x) => [
    [x, 2.44, -0.88] as Vec3,
    [x, 2.44, -2.28] as Vec3,
  ])
  const suspensionLines = useMemo<Array<[Vec3, Vec3]>>(
    () =>
      lightPositions.flatMap(([x, y, z]) => [
        [[x - 0.46, y + 0.04, z], [x - 0.46, y + 0.46, z]],
        [[x + 0.46, y + 0.04, z], [x + 0.46, y + 0.46, z]],
      ]),
    [lightPositions],
  )

  return (
    <group>
      <DeskLineSegments segments={suspensionLines} opacity={0.34} />
      {lightPositions.map(([x, y, z]) => (
        <mesh key={`${x}-${z}`} position={[x, y, z]} scale={[1.04, 0.035, 0.2]}>
          <boxGeometry />
          <meshStandardMaterial color="#dbe8ff" emissive={ACTIVE_BLUE} emissiveIntensity={0.11} transparent opacity={0.52} />
          <Edges color={ACTIVE_BLUE} threshold={8} />
        </mesh>
      ))}
    </group>
  )
}

function SideWallWindows() {
  return (
    <group>
      {[-2.3, -0.9, 0.5].map((z) => (
        <group key={z} position={[-4.145, 1.48, z]}>
          <mesh>
            <boxGeometry args={[0.035, 0.72, 1.16]} />
            <meshStandardMaterial color="#0d1824" emissive={ACTIVE_BLUE} emissiveIntensity={0.018} transparent opacity={0.14} roughness={0.72} />
            <Edges color={MUTED_EDGE} threshold={8} />
          </mesh>
          <DeskLineSegments
            segments={[
              [[0.026, 0, -0.58], [0.026, 0, 0.58]],
              [[0.026, -0.36, 0], [0.026, 0.36, 0]],
            ]}
            opacity={0.24}
            color={MUTED_EDGE}
          />
        </group>
      ))}
    </group>
  )
}

function SegmentTube({
  start,
  end,
  width,
  opacity,
  color,
}: {
  start: THREE.Vector3
  end: THREE.Vector3
  width: number
  opacity: number
  color: string
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

const TOOL_CARD_DATA = [
  { name: '邮件', body: '已扫描｜3 封 Q3 相关｜核心:老板昨晚转发的留存数据', position: [-1.18, 2.02, 0.02] as Vec3 },
  { name: 'Slack', body: '已扫描 #growth-q3｜47 条｜留存讨论 31 条', position: [-0.58, 2.24, -0.02] as Vec3 },
  { name: 'Notion', body: '找到 Q3 思路草稿 v0.3｜未提交', position: [0, 2.34, -0.04] as Vec3 },
  { name: '飞书', body: '读取 Q2 留存复盘｜关键:第 3 天流失', position: [0.58, 2.24, -0.02] as Vec3 },
  { name: '日历', body: '确认 15:00 会议｜CEO+小蕾+小冯', position: [1.18, 2.02, 0.02] as Vec3 },
]

function ToolCard({ name, body, position, time, index }: { name: string; body: string; position: Vec3; time: number; index: number }) {
  const appear = 10.8 + index * 0.16
  const opacity = visibilityBetween(time, appear, 15.0, 0.34)
  const gather = smoothStep(time, 13.4, 15.0)

  if (opacity <= 0.01) return null

  return (
    <Html position={position} center distanceFactor={7.4} transform sprite occlude={false} zIndexRange={[32, 0]}>
      <div
        className="object-label object-label--action open-office-tool-card"
        style={{
          opacity,
          transform: `translate3d(0, ${6 - opacity * 6 + gather * 8}px, 0) scale(${0.9 + opacity * 0.1 - gather * 0.08})`,
        }}
      >
        <strong>{name}</strong>
        <span>{body}</span>
      </div>
    </Html>
  )
}

function BattleCard({ time }: { time: number }) {
  const opacity = smoothStep(time, 15.3, 16.2) * (time < 31.5 ? 1 : 1 - smoothStep(time, 31.5, 32))
  if (opacity <= 0.01) return null

  return (
    <Html position={[2.08, 1.46, 0.54]} center distanceFactor={8.9} transform sprite occlude={false} zIndexRange={[42, 0]}>
      <div className="open-office-web-card" style={{ opacity, transform: `translateY(${4 - opacity * 4}px) scale(${0.62 + opacity * 0.05})` }}>
        <div className="open-office-web-topbar">
          <span>Evans Workspace / Q3 Growth Brief</span>
          <i>Auto-saved · 14:52</i>
        </div>
        <header>
          <div>
            <small>15:00 会议 · 剩余 8 分钟</small>
            <strong>Q3 用户增长讨论 · 作战卡</strong>
          </div>
          <em>1 页速读</em>
        </header>
        <div className="open-office-web-summary">
          <b>先说结论</b>
          <span>老板最在意的是留存，不是拉新。开场 60 秒内先抛 3 个数，再给 3 个可执行杠杆。</span>
        </div>
        <div className="open-office-web-metrics">
          <span><b>48% → 41%</b>30 天留存下降 7pt</span>
          <span><b>第 3 天</b>新用户流失最集中</span>
          <span><b>52%</b>同类基准，差距 11pt</span>
        </div>
        <section className="open-office-web-section">
          <h4>开场话术</h4>
          <p>“我建议这次 Q3 先把重点放在留存修复。核心问题不是获客不够，而是新用户第 3 天掉得太快。”</p>
        </section>
        <section className="open-office-web-grid">
          <div>
            <h4>三个杠杆</h4>
            <ul>
              <li>onboarding 重设计：沿用你 Notion 草稿 v0.3。</li>
              <li>第 3 天召回：产品触达 + 推送 + EDM。</li>
              <li>增长小组扩编：2 名前端 + 1 名设计。</li>
            </ul>
          </div>
          <div>
            <h4>注意</h4>
            <ul>
              <li>前 3 分钟先抛结论。</li>
              <li>别说“可能、也许、大概”。</li>
              <li>老板上次打断你 3 次，原因是节奏慢。</li>
            </ul>
          </div>
        </section>
      </div>
    </Html>
  )
}

function DialogueLayer({ time }: { time: number }) {
  const entries = [
    {
      start: 0.6,
      end: 4.4,
      kind: 'person',
      title: '李明',
      body: 'Evans，10 分钟后老板让我开会讨论 Q3 用户增长方案，我都没准备……完蛋了。',
      position: [-0.46, 1.56, 0.94] as Vec3,
    },
    {
      start: 4.6,
      end: 8.1,
      kind: 'voice',
      title: 'Evans',
      body: '别慌。我看了你今天所有相关的邮件、Slack、Notion 和上次会议记录，帮你整理好了。',
      position: [-0.44, 1.72, 0.88] as Vec3,
    },
    {
      start: 8.3,
      end: 10.7,
      kind: 'voice',
      title: 'Evans',
      body: '剩下 8 分钟，你过一遍这三条就够了。我不会再打扰你。',
      position: [-0.44, 1.72, 0.88] as Vec3,
    },
  ]

  return (
    <>
      {entries.map((entry) => {
        const opacity = visibilityBetween(time, entry.start, entry.end)
        if (opacity <= 0.01) return null
        return (
          <Html key={entry.start} position={entry.position} center distanceFactor={7.8} transform sprite occlude={false} zIndexRange={[38, 0]}>
            <div className={`object-label object-label--${entry.kind} open-office-dialog`} style={{ opacity, transform: `translateY(${8 - opacity * 8}px) scale(${0.94 + opacity * 0.06})` }}>
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
  const monitorOpacity = visibilityBetween(time, 18.2, 23.0, 0.5)
  const quietOpacity = visibilityBetween(time, 20.4, 24.8, 0.5)

  return (
    <>
      {monitorOpacity > 0.01 && (
        <Html position={[0.64, 1.34, -0.14]} center distanceFactor={7.4} transform sprite occlude={false} zIndexRange={[36, 0]}>
          <div className="object-label object-label--action object-label--right open-office-device-note" style={{ opacity: monitorOpacity }}>
            <strong>显示器</strong>
            作战卡已推送 · 1 页 · 预计阅读 5 分钟
          </div>
        </Html>
      )}
      {quietOpacity > 0.01 && (
        <Html position={[1.34, 1.02, 0.86]} center distanceFactor={8.8} transform sprite occlude={false} zIndexRange={[34, 0]}>
          <div className="open-office-web-toast" style={{ opacity: quietOpacity, transform: `translateY(${4 - quietOpacity * 4}px) scale(${0.9 + quietOpacity * 0.05})` }}>
            <strong>通讯静默已开启</strong>
            <span>Slack 勿扰至 16:00</span>
            <span>日历静默通知 · 手机静音</span>
          </div>
        </Html>
      )}
    </>
  )
}

function DispatchMotion({ time }: { time: number }) {
  const brooch = useMemo(() => new THREE.Vector3(0.16, 1.55, 0.55), [])
  const monitor = useMemo(() => new THREE.Vector3(0.16, 1.22, -0.25), [])
  const webCardAnchor = useMemo(() => new THREE.Vector3(1.55, 1.46, 0.42), [])

  return (
    <group>
      {TOOL_CARD_DATA.map((card, index) => {
        const target = new THREE.Vector3(...card.position)
        return (
          <AnimatedRoute
            key={`scan-${card.name}`}
            points={[brooch, new THREE.Vector3(target.x * 0.32, 1.72 + index * 0.025, 0.06), monitor]}
            time={time}
            start={10.7 + index * 0.14}
            end={12.5 + index * 0.16}
            holdUntil={15.8}
            color={ACTIVE_BLUE}
            width={0.0048}
            opacity={0.46}
          />
        )
      })}
      <AnimatedRoute points={[webCardAnchor, new THREE.Vector3(0.9, 1.4, 0.05), monitor]} time={time} start={16.6} end={18.0} holdUntil={21.2} color={MAIN_BLUE} width={0.008} opacity={0.8} />
      <AnimatedRoute points={[brooch, new THREE.Vector3(-0.46, 1.82, 0.2), new THREE.Vector3(...TOOL_CARD_DATA[1].position)]} time={time} start={19.0} end={20.0} holdUntil={22.0} color={ACTIVE_BLUE} width={0.0048} opacity={0.42} />
      <AnimatedRoute points={[brooch, new THREE.Vector3(0.76, 1.82, 0.2), new THREE.Vector3(...TOOL_CARD_DATA[4].position)]} time={time} start={19.4} end={20.4} holdUntil={22.2} color={ACTIVE_BLUE} width={0.0048} opacity={0.42} />
      {TOOL_CARD_DATA.map((card, index) => <ToolCard key={card.name} {...card} time={time} index={index} />)}
      <BattleCard time={time} />
      <DialogueLayer time={time} />
      <DeviceStatus time={time} />
    </group>
  )
}

function EvansBrooch({ time }: { time: number }) {
  const glow = 0.42 + pulse(time, 2.4) * 0.26
  const warm = smoothStep(time, 23.5, 25.0)
  const glowColor = new THREE.Color(ACTIVE_BLUE).lerp(new THREE.Color(WARM_GLOW), warm).getStyle()

  return (
    <group position={[BROOCH_POINT.x, BROOCH_POINT.y - 0.55, BROOCH_POINT.z - 0.62]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <torusGeometry args={[0.052, 0.004, 10, 36]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.78} />
      </mesh>
      <mesh position={[0, 0, 0.006]}>
        <sphereGeometry args={[0.028, 18, 12]} />
        <meshStandardMaterial color="#101722" emissive={glowColor} emissiveIntensity={glow + warm * 0.24} roughness={0.55} />
      </mesh>
      <mesh rotation={[0, 0, 0.4]}>
        <torusGeometry args={[0.09 + pulse(time, 1.8) * 0.012, 0.0028, 8, 42]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.18 + pulse(time, 2.1) * 0.14} />
      </mesh>
    </group>
  )
}

function OfficeSittingMan({
  time,
  position = [0, 0.18, 0.92],
  scale = 1.16,
  opacity = 1,
  showBrooch = true,
}: {
  time: number
  position?: Vec3
  scale?: number
  opacity?: number
  showBrooch?: boolean
}) {
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
        color: '#171c24',
        emissive: '#171c24',
        emissiveIntensity: 0.012,
        roughness: 0.86,
        metalness: 0,
        transparent: true,
        opacity: opacity >= 1 ? 0.86 : opacity * 0.62,
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
        opacity: opacity >= 1 ? 0.5 : opacity * 0.38,
      })
    })

    return { model: root, outline: outlineClone }
  }, [object, opacity])

  return (
    <group position={position} rotation={[0, Math.PI * 0.5, 0]} scale={[scale, scale, scale]}>
      <primitive object={outline} scale={1.012} />
      <primitive object={model} />
      {showBrooch && opacity >= 1 && <EvansBrooch time={time} />}
    </group>
  )
}

function Workstation({ time, opacity = 1, showBrooch = true }: { time: number; opacity?: number; showBrooch?: boolean }) {
  return (
    <group>
      <SimpleDesk opacity={0.74 * opacity} />
      <ImportedModel path={ASSETS.chair} position={[0, 0.02, 0.94]} rotation={[0, Math.PI, 0]} scale={[1.58, 1.58, 1.58]} opacity={opacity} edgeThreshold={34} lineOpacity={0.6 * opacity} />
      <ImportedModel path={ASSETS.computer} position={[0.12, 0.96, -0.32]} rotation={[0, Math.PI, 0]} scale={[0.72, 0.72, 0.72]} opacity={opacity} edgeThreshold={34} lineOpacity={0.46 * opacity} />
      <ImportedModel path={ASSETS.keyboard} position={[0.02, 0.935, 0.18]} rotation={[0, 0, 0]} scale={[0.66, 0.66, 0.66]} opacity={opacity} />
      <ImportedModel path={ASSETS.mug} position={[-0.82, 0.94, 0.16]} rotation={[0, -0.35, 0]} scale={[0.28, 0.28, 0.28]} opacity={opacity} />
      <OfficeSittingMan time={time} position={[0.08, 0.26, 0.9]} scale={1.34} opacity={opacity} showBrooch={showBrooch} />
    </group>
  )
}

function MainWorkstation({ time }: { time: number }) {
  return <Workstation time={time} />
}

function BackgroundStation({ position, scale = 1, rotation = [0, 0, 0] }: { position: Vec3; scale?: number; rotation?: Vec3 }) {
  return (
    <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
      <Workstation time={0} opacity={1} showBrooch={false} />
    </group>
  )
}

function OfficeShell() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.8]} receiveShadow>
        <planeGeometry args={[8.6, 6.6]} />
        <meshStandardMaterial color="#06090d" roughness={0.82} />
        <Edges color={SOFT_EDGE} threshold={5} />
      </mesh>
      <FloorTiles />
      <mesh position={[0, 1.38, -3.88]} receiveShadow>
        <boxGeometry args={[8.6, 2.76, 0.12]} />
        <meshStandardMaterial color="#070a0f" transparent opacity={0.32} roughness={0.8} />
        <Edges color={MUTED_EDGE} threshold={8} />
      </mesh>
      <mesh position={[-4.22, 1.34, -0.8]} receiveShadow>
        <boxGeometry args={[0.12, 2.68, 6.4]} />
        <meshStandardMaterial color="#070a0f" transparent opacity={0.22} roughness={0.8} />
        <Edges color={MUTED_EDGE} threshold={8} />
      </mesh>
      <SideWallWindows />
      <CeilingLights />
    </group>
  )
}

function BackgroundOffice() {
  const rows = [
    { z: -1.65, scale: 0.72, xs: [-3.0, 0, 3.0] },
    { z: -2.72, scale: 0.58, xs: [-3.45, -1.15, 1.15, 3.45] },
    { z: -3.55, scale: 0.48, xs: [-3.6, -1.8, 0, 1.8, 3.6] },
    { z: -4.18, scale: 0.4, xs: [-2.7, -0.9, 0.9, 2.7] },
  ]

  return (
    <group>
      {rows.flatMap((row) =>
        row.xs.map((x, stationIndex) => (
          <BackgroundStation
            key={`${row.z}-${x}`}
            position={[x, 0, row.z - stationIndex * 0.025]}
            scale={row.scale}
          />
        )),
      )}
    </group>
  )
}

function OpenOfficeSet({ time }: { time: number }) {
  return (
    <group>
      <OfficeShell />
      <BackgroundOffice />
      <MainWorkstation time={time} />
      <DispatchMotion time={time} />
    </group>
  )
}

function AnimatedScene({ time }: { time: number }) {
  return (
    <>
      <color attach="background" args={['#06090d']} />
      <fog attach="fog" args={['#06090d', 6.5, 15]} />
      <OrthographicCamera makeDefault position={[3.55, 2.75, 4.15]} zoom={96} />
      <CameraMotion time={time} />
      <ambientLight intensity={0.5} />
      <hemisphereLight intensity={0.3} color="#d8dde8" groundColor="#07100c" />
      <directionalLight castShadow intensity={1.15} position={[4.2, 7.2, 5.2]} shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <spotLight castShadow intensity={9.5} angle={0.42} penumbra={0.82} position={[1.9, 5.2, 2.8]} color="#dbe8ff" />
      <pointLight intensity={1.1} distance={2.4} position={[0.03, 1.22, 0.5]} color={ACTIVE_BLUE} />
      <group rotation={[0, -0.08, 0]}>
        <OpenOfficeSet time={time} />
      </group>
      <ContactShadows position={[0, 0.02, 0]} opacity={0.56} scale={12} blur={2.2} far={8} color="#000000" />
      <OrbitControls enabled={false} enablePan={false} enableZoom={false} enableRotate={false} target={[0, 1.2, 0.05]} />
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

export function OpenOfficeExperience() {
  const time = useStoryClock()

  return (
    <section className="interior-shell" aria-label="开放办公室李明工位三维静态场景">
      <Canvas shadows dpr={[1, 2]}>
        <Suspense fallback={null}>
          <AnimatedScene time={time} />
        </Suspense>
      </Canvas>
      <SceneOverlay time={time} />
    </section>
  )
}

export default OpenOfficeExperience
