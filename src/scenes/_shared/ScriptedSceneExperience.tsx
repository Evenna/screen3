import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { ContactShadows, Edges, Html, OrbitControls, OrthographicCamera } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { Mesh, Object3D } from 'three'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import '../../App.css'

export type Vec3 = [number, number, number]
export type EnvironmentKind = 'kitchen' | 'living' | 'study' | 'balcony' | 'city-link' | 'choice-room' | 'meeting-room'
export type PoseKind = 'standing-phone' | 'seated-desk' | 'seated-sofa' | 'standing-child' | 'quiet-standing'

export type SceneDialogue = {
  start: number
  end: number
  kind: 'person' | 'voice'
  title: string
  body: string
  position?: Vec3
}

export type ScenePanel = {
  id: string
  title: string
  subtitle?: string
  lines: string[]
  position: Vec3
  start: number
  end: number
  variant?: 'main' | 'side' | 'mini' | 'warm'
}

export type SceneRoute = {
  to: Vec3
  via?: Vec3
  start: number
  end: number
  holdUntil: number
  color?: string
  width?: number
}

export type ScriptedSceneConfig = {
  ariaLabel: string
  duration: number
  environment: EnvironmentKind
  pose: PoseKind
  broochMode?: 'normal' | 'delayed' | 'off'
  progressClass?: string
  panels: ScenePanel[]
  dialogues: SceneDialogue[]
  routes: SceneRoute[]
  camera?: Array<{ at: number; position: THREE.Vector3; look: THREE.Vector3; zoom: number }>
}

export const ACTIVE_BLUE = '#9ed8ff'
export const MAIN_BLUE = '#3f73ff'
export const WARM_GLOW = '#ffd49a'
const WHITE_EDGE = '#eef1f6'
const SOFT_EDGE = '#77818f'
const MUTED_EDGE = '#46515e'
const BROOCH = new THREE.Vector3(0.03, 1.22, 0.38)
const POLY = '/models/poly-pizza/'
const ASSETS = {
  man: '/models/sitting-man/tripo_convert_32d5344d-740d-4b6c-8fca-9a3c4bb1bd55.obj',
  baseMale: '/models/base-male.glb',
  desk: `${POLY}desk.glb`,
  chair: `${POLY}chair.glb`,
  bedTwin: `${POLY}bed-twin.glb`,
  bedDouble: `${POLY}bed-double.glb`,
  nightStand: `${POLY}night-stand.glb`,
  closet: `${POLY}closet.glb`,
  bookcase: `${POLY}bookcase-with-books.glb`,
  door: `${POLY}door.glb`,
  meetingTable: `${POLY}meeting-table.glb`,
  projectorScreen: `${POLY}projector-screen.glb`,
  wallScreen: `${POLY}computer-screen-kenney.glb`,
  sofa: '/models/quaternius-furniture/sofa.glb',
  sofaSmall: '/models/quaternius-furniture/sofa-small.glb',
  table: '/models/quaternius-furniture/round-table-small.glb',
  lamp: '/models/quaternius-furniture/lamp-round-floor.glb',
  computer: '/models/open-office/computer-screen.glb',
  keyboard: '/models/open-office/keyboard.glb',
  mug: '/models/open-office/mug.glb',
}

function clamp01(value: number) { return Math.min(1, Math.max(0, value)) }
function smoothStep(value: number, start: number, end: number) { const x = clamp01((value - start) / (end - start)); return x * x * (3 - 2 * x) }
function visibilityBetween(time: number, start: number, end: number, fade = 0.55) { return smoothStep(time, start, start + fade) * (1 - smoothStep(time, end, end + fade)) }
function pulse(time: number, speed = 1) { return 0.5 + Math.sin(time * speed) * 0.5 }
function getPathPoint(points: THREE.Vector3[], progress: number) { const lengths = points.slice(0, -1).map((p, i) => p.distanceTo(points[i + 1])); const total = lengths.reduce((s, l) => s + l, 0); let target = clamp01(progress) * total; for (let i = 0; i < lengths.length; i += 1) { const l = lengths[i]; if (target <= l) return points[i].clone().lerp(points[i + 1], l <= 0.001 ? 0 : target / l); target -= l } return points[points.length - 1].clone() }

function useStoryClock(duration: number) {
  const [time, setTime] = useState(0)
  useEffect(() => { const startedAt = performance.now(); let frame = 0; const tick = () => { setTime(((performance.now() - startedAt) / 1000) % duration); frame = requestAnimationFrame(tick) }; frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame) }, [duration])
  return time
}

function CameraMotion({ time, cameraFrames }: { time: number; cameraFrames?: ScriptedSceneConfig['camera'] }) {
  const { camera } = useThree()
  const lookAt = useRef(new THREE.Vector3(0, 1.2, 0.12))
  const frames = useMemo(() => cameraFrames ?? [
    { at: 0, position: new THREE.Vector3(2.55, 2.1, 3.1), look: new THREE.Vector3(0, 1.16, 0.18), zoom: 126 },
    { at: 7, position: new THREE.Vector3(1.85, 1.76, 2.25), look: new THREE.Vector3(0.04, 1.22, 0.36), zoom: 154 },
    { at: 15, position: new THREE.Vector3(2.55, 2.34, 3.0), look: new THREE.Vector3(0.06, 1.62, 0.18), zoom: 122 },
    { at: 28, position: new THREE.Vector3(2.25, 1.92, 2.62), look: new THREE.Vector3(0.08, 1.12, 0.34), zoom: 142 },
    { at: 60, position: new THREE.Vector3(2.25, 1.92, 2.62), look: new THREE.Vector3(0.08, 1.12, 0.34), zoom: 142 },
  ], [cameraFrames])
  useFrame((_, delta) => { const index = Math.max(0, frames.findIndex((f, i) => { const n = frames[i + 1]; return n ? time >= f.at && time < n.at : time >= f.at })); const current = frames[index], next = frames[Math.min(index + 1, frames.length - 1)]; const blend = current === next ? 0 : smoothStep(time, current.at, next.at); const targetPosition = current.position.clone().lerp(next.position, blend); const targetLookAt = current.look.clone().lerp(next.look, blend); const targetZoom = current.zoom + (next.zoom - current.zoom) * blend; const ease = 1 - Math.exp(-delta * 2.7); camera.position.lerp(targetPosition, ease); lookAt.current.lerp(targetLookAt, ease); camera.zoom += (targetZoom - camera.zoom) * ease; camera.lookAt(lookAt.current); camera.updateProjectionMatrix() })
  return null
}

function LineBox({ position, scale, rotation = [0, 0, 0], color = '#101721', edge = WHITE_EDGE, opacity = 0.72, emissive = '#000', emissiveIntensity = 0 }: { position: Vec3; scale: Vec3; rotation?: Vec3; color?: string; edge?: string; opacity?: number; emissive?: string; emissiveIntensity?: number }) { return <mesh position={position} rotation={rotation} scale={scale} castShadow receiveShadow><boxGeometry /><meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} roughness={0.78} transparent opacity={opacity} /><Edges color={edge} threshold={10} /></mesh> }
function styleImported(root: Object3D, tint = '#101721', edge = WHITE_EDGE, fillOpacity = 0.48, lineOpacity = 0.34, threshold = 42) {
  root.traverse((child) => {
    const mesh = child as Mesh
    if (!mesh.isMesh || !mesh.geometry) return
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.material = new THREE.MeshStandardMaterial({ color: tint, emissive: tint, emissiveIntensity: 0.01, roughness: 0.82, metalness: 0.02, transparent: true, opacity: fillOpacity })
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, threshold), new THREE.LineBasicMaterial({ color: edge, transparent: true, opacity: lineOpacity })))
  })
}
function fitObject(root: Object3D, size = 1) {
  const box = new THREE.Box3().setFromObject(root)
  const dimensions = new THREE.Vector3()
  box.getSize(dimensions)
  const maxDim = Math.max(dimensions.x, dimensions.y, dimensions.z, 0.001)
  root.scale.multiplyScalar(size / maxDim)
  const fitted = new THREE.Box3().setFromObject(root)
  const center = new THREE.Vector3()
  fitted.getCenter(center)
  root.position.sub(center)
  root.position.y -= fitted.min.y - center.y
}
function GltfModel({ src, position, rotation = [0, 0, 0], scale = 1, tint = '#101721', edge = WHITE_EDGE, opacity = 0.5, lineOpacity = 0.34, threshold = 42 }: { src: string; position: Vec3; rotation?: Vec3; scale?: number; tint?: string; edge?: string; opacity?: number; lineOpacity?: number; threshold?: number }) {
  const gltf = useLoader(GLTFLoader, src)
  const object = useMemo(() => { const clone = gltf.scene.clone(true); fitObject(clone, scale); styleImported(clone, tint, edge, opacity, lineOpacity, threshold); return clone }, [edge, gltf.scene, lineOpacity, opacity, scale, threshold, tint])
  return <primitive object={object} position={position} rotation={rotation} />
}
function ObjModel({ src, position, rotation = [0, 0, 0], scale = 1, tint = '#101721', edge = WHITE_EDGE, opacity = 0.5, lineOpacity = 0.34, threshold = 42 }: { src: string; position: Vec3; rotation?: Vec3; scale?: number; tint?: string; edge?: string; opacity?: number; lineOpacity?: number; threshold?: number }) {
  const loaded = useLoader(OBJLoader, src)
  const object = useMemo(() => { const clone = loaded.clone(true); fitObject(clone, scale); styleImported(clone, tint, edge, opacity, lineOpacity, threshold); return clone }, [edge, lineOpacity, loaded, opacity, scale, threshold, tint])
  return <primitive object={object} position={position} rotation={rotation} />
}
function Model({ src, ...props }: Parameters<typeof GltfModel>[0]) { return src.endsWith('.obj') ? <ObjModel src={src} {...props} /> : <GltfModel src={src} {...props} /> }

function EvansBrooch({ time, warm = false }: { time: number; warm?: boolean }) { const color = new THREE.Color(ACTIVE_BLUE).lerp(new THREE.Color(WARM_GLOW), warm ? 0.72 : 0).getStyle(); return <group position={[BROOCH.x, BROOCH.y, BROOCH.z]} rotation={[Math.PI / 2, 0, 0]}><mesh><torusGeometry args={[0.05, 0.004, 10, 36]} /><meshBasicMaterial color={color} transparent opacity={0.76} /></mesh><mesh position={[0, 0, 0.006]}><sphereGeometry args={[0.027, 18, 12]} /><meshStandardMaterial color="#101722" emissive={color} emissiveIntensity={0.42 + pulse(time, 2.4) * 0.26} roughness={0.55} /></mesh></group> }

function Person({ time, pose, broochMode = 'normal' }: { time: number; pose: PoseKind; broochMode?: ScriptedSceneConfig['broochMode'] }) {
  const showBrooch = broochMode === 'normal' || (broochMode === 'delayed' && time >= 30)
  const isSeated = pose === 'seated-desk' || pose === 'seated-sofa'
  const src = isSeated ? ASSETS.man : ASSETS.baseMale
  const rotation: Vec3 = isSeated ? [0, Math.PI / 2, 0] : [0, -0.1, 0]
  const scale = pose === 'standing-child' ? 0.78 : isSeated ? 1.3 : 1.52
  return <group position={pose === 'standing-child' ? [0.42, 0, 0.22] : [0, 0, 0.18]}>
    <Model src={src} position={[0, 0, 0]} rotation={rotation} scale={scale} opacity={0.44} lineOpacity={0.36} threshold={56} />
    {(pose === 'standing-phone' || pose === 'quiet-standing') && <LineBox position={[0.26, 0.78, 0.32]} scale={[0.11, 0.18, 0.018]} rotation={[0.15, 0.08, -0.14]} color="#06111f" edge={ACTIVE_BLUE} opacity={0.42} emissive={ACTIVE_BLUE} emissiveIntensity={0.08} />}
    {showBrooch && <EvansBrooch time={time} warm={time > 26} />}
  </group>
}

function RoomShell({ windowSide = 'back' }: { windowSide?: 'back' | 'left' | 'right' }) {
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.25]} receiveShadow><planeGeometry args={[7.4, 4.8]} /><meshStandardMaterial color="#05080d" roughness={0.86} /><Edges color={MUTED_EDGE} threshold={5} /></mesh>
    <LineBox position={[0, 1.35, -2.32]} scale={[7.4, 2.7, 0.08]} color="#060910" edge={MUTED_EDGE} opacity={0.25} />
    <LineBox position={[-3.62, 1.25, -0.28]} scale={[0.08, 2.5, 4.3]} color="#060910" edge={MUTED_EDGE} opacity={0.18} />
    {windowSide === 'back' && <LineBox position={[1.8, 1.55, -2.26]} scale={[1.45, 0.78, 0.035]} color="#071421" edge={SOFT_EDGE} opacity={0.24} emissive={ACTIVE_BLUE} emissiveIntensity={0.025} />}
    {windowSide === 'left' && <LineBox position={[-3.54, 1.5, -0.35]} scale={[0.035, 0.8, 1.35]} color="#071421" edge={SOFT_EDGE} opacity={0.24} emissive={ACTIVE_BLUE} emissiveIntensity={0.025} />}
  </group>
}

function Environment({ kind }: { kind: EnvironmentKind }) {
  if (kind === 'kitchen') return <group><RoomShell windowSide="left" /><Model src={ASSETS.door} position={[-2.72, 0, -2.16]} rotation={[0, 0, 0]} scale={1.25} opacity={0.36} lineOpacity={0.24} edge={MUTED_EDGE} /><Model src={ASSETS.table} position={[0.08, 0.72, 0.12]} scale={1.16} opacity={0.42} lineOpacity={0.32} /><Model src={ASSETS.chair} position={[-0.72, 0.26, 0.42]} rotation={[0, 0.4, 0]} scale={0.8} opacity={0.42} lineOpacity={0.32} /><Model src={ASSETS.mug} position={[0.46, 1.0, 0.18]} scale={0.24} opacity={0.55} lineOpacity={0.36} /><LineBox position={[-1.35, 0.78, -1.18]} scale={[1.55, 0.2, 0.46]} color="#101721" edge={SOFT_EDGE} opacity={0.3} /></group>
  if (kind === 'living') return <group><RoomShell /><Model src={ASSETS.sofa} position={[0, 0.18, 0.36]} scale={1.6} opacity={0.46} lineOpacity={0.34} /><Model src={ASSETS.table} position={[0.12, 0.58, 1.0]} scale={0.8} opacity={0.42} lineOpacity={0.3} /><Model src={ASSETS.lamp} position={[-1.42, 0, -0.38]} scale={1.2} opacity={0.38} lineOpacity={0.28} /></group>
  if (kind === 'study') return <group><RoomShell /><Model src={ASSETS.desk} position={[0.15, 0.55, 0.02]} scale={1.55} opacity={0.42} lineOpacity={0.32} /><Model src={ASSETS.chair} position={[0.0, 0.16, 0.62]} rotation={[0, Math.PI, 0]} scale={0.96} opacity={0.42} lineOpacity={0.32} /><Model src={ASSETS.computer} position={[0.22, 1.05, -0.42]} scale={0.55} opacity={0.48} lineOpacity={0.34} edge={ACTIVE_BLUE} /><Model src={ASSETS.keyboard} position={[0.02, 0.96, 0.02]} scale={0.36} opacity={0.42} lineOpacity={0.28} /><Model src={ASSETS.bookcase} position={[-1.65, 0, -1.1]} scale={1.25} opacity={0.28} lineOpacity={0.24} edge={SOFT_EDGE} /></group>
  if (kind === 'city-link') return <group><RoomShell /><LineBox position={[0, 1.7, -2.18]} scale={[3.6, 1.05, 0.035]} color="#071421" edge={MUTED_EDGE} opacity={0.22} emissive={ACTIVE_BLUE} emissiveIntensity={0.02} /><Model src={ASSETS.desk} position={[-1.0, 0.46, 0.24]} rotation={[0, 0.24, 0]} scale={1.25} opacity={0.36} lineOpacity={0.28} /><Model src={ASSETS.chair} position={[0.85, 0.16, 0.12]} rotation={[0, -0.7, 0]} scale={0.86} opacity={0.36} lineOpacity={0.28} /><Model src={ASSETS.lamp} position={[1.72, 0, -0.58]} scale={1.0} opacity={0.32} lineOpacity={0.24} /></group>
  if (kind === 'balcony') return <group><RoomShell windowSide="back" /><Model src={ASSETS.bedDouble} position={[-1.38, 0.12, 0.08]} rotation={[0, 0.22, 0]} scale={1.55} opacity={0.38} lineOpacity={0.3} /><Model src={ASSETS.nightStand} position={[-2.26, 0.2, -0.82]} scale={0.64} opacity={0.34} lineOpacity={0.26} /><Model src={ASSETS.closet} position={[1.95, 0, -1.08]} rotation={[0, -0.16, 0]} scale={1.22} opacity={0.3} lineOpacity={0.22} edge={SOFT_EDGE} /><LineBox position={[0.55, 1.52, -2.26]} scale={[1.9, 1.0, 0.035]} color="#071421" edge={MUTED_EDGE} opacity={0.28} emissive={ACTIVE_BLUE} emissiveIntensity={0.018} /></group>
  if (kind === 'meeting-room') return <group>
    <RoomShell />
    <Model src={ASSETS.door} position={[-2.8, 0, -2.16]} rotation={[0, 0, 0]} scale={1.25} opacity={0.32} lineOpacity={0.24} edge={MUTED_EDGE} />
    <Model src={ASSETS.projectorScreen} position={[0.1, 1.52, -2.12]} rotation={[0, 0, 0]} scale={1.82} opacity={0.42} lineOpacity={0.34} edge={ACTIVE_BLUE} />
    <LineBox position={[0.1, 1.52, -2.06]} scale={[1.72, 0.86, 0.018]} color="#071421" edge={ACTIVE_BLUE} opacity={0.2} emissive={ACTIVE_BLUE} emissiveIntensity={0.06} />
    {[-0.72, 0, 0.72].map((x) => <Model key={`table-${x}`} src={ASSETS.meetingTable} position={[x, 0.55, 0.2]} rotation={[0, Math.PI / 2, 0]} scale={1.0} opacity={0.44} lineOpacity={0.32} />)}
    {[-1.35, -0.68, 0, 0.68, 1.35].map((x) => <Model key={`front-chair-${x}`} src={ASSETS.chair} position={[x, 0.16, 0.92]} rotation={[0, Math.PI, 0]} scale={0.58} opacity={0.42} lineOpacity={0.32} />)}
    {[-1.35, -0.68, 0, 0.68, 1.35].map((x) => <Model key={`back-chair-${x}`} src={ASSETS.chair} position={[x, 0.16, -0.56]} rotation={[0, 0, 0]} scale={0.58} opacity={0.38} lineOpacity={0.28} />)}
    <Model src={ASSETS.wallScreen} position={[1.92, 1.24, -1.68]} rotation={[0, -0.34, 0]} scale={0.72} opacity={0.38} lineOpacity={0.3} edge={ACTIVE_BLUE} />
    <LineBox position={[-0.85, 2.42, -0.1]} scale={[1.24, 0.035, 0.22]} color="#dbe8ff" edge={SOFT_EDGE} opacity={0.28} emissive="#dbe8ff" emissiveIntensity={0.16} />
    <LineBox position={[0.85, 2.42, -0.1]} scale={[1.24, 0.035, 0.22]} color="#dbe8ff" edge={SOFT_EDGE} opacity={0.28} emissive="#dbe8ff" emissiveIntensity={0.16} />
  </group>
  return <group><RoomShell /><Model src={ASSETS.sofaSmall} position={[-0.95, 0.2, 0.18]} scale={1.1} opacity={0.38} lineOpacity={0.3} /><Model src={ASSETS.chair} position={[0.9, 0.16, 0.18]} rotation={[0, -0.55, 0]} scale={0.88} opacity={0.38} lineOpacity={0.3} /><Model src={ASSETS.table} position={[0, 0.5, 0.76]} scale={0.72} opacity={0.34} lineOpacity={0.26} /></group>
}

function SegmentTube({ start, end, width, opacity, color }: { start: THREE.Vector3; end: THREE.Vector3; width: number; opacity: number; color: string }) { const geometry = useMemo(() => new THREE.TubeGeometry(new THREE.LineCurve3(start, end), 18, width, 6, false), [end, start, width]); return <mesh geometry={geometry}><meshBasicMaterial color={color} transparent opacity={opacity} /></mesh> }
function AnimatedRoute({ route, time }: { route: SceneRoute; time: number }) { const end = new THREE.Vector3(...route.to); const points = useMemo(() => [BROOCH, route.via ? new THREE.Vector3(...route.via) : BROOCH.clone().lerp(end, 0.5).add(new THREE.Vector3(0, 0.35, 0)), end], [end, route.via]); const progress = clamp01((time - route.start) / (route.end - route.start)); const visibility = smoothStep(time, route.start, route.start + 0.35) * (1 - smoothStep(time, route.holdUntil, route.holdUntil + 0.65)); const lengths = useMemo(() => { let total = 0; const segments = points.slice(0, -1).map((p, i) => { const l = p.distanceTo(points[i + 1]); total += l; return l }); return { segments, total } }, [points]); const movingPoint = getPathPoint(points, progress); if (visibility <= 0.01 || progress <= 0.01 || lengths.total <= 0.001) return null; let drawn = progress * lengths.total; return <group>{points.slice(0, -1).map((p, i) => { const l = lengths.segments[i]; const amount = clamp01(drawn / l); drawn -= l; if (amount <= 0) return null; return <SegmentTube key={i} start={p} end={p.clone().lerp(points[i + 1], amount)} width={route.width ?? 0.005} opacity={0.08 + visibility * 0.55} color={route.color ?? ACTIVE_BLUE} /> })}<mesh position={[movingPoint.x, movingPoint.y, movingPoint.z]}><sphereGeometry args={[(route.width ?? 0.005) * 3.8, 14, 10]} /><meshBasicMaterial color={route.color ?? ACTIVE_BLUE} transparent opacity={0.58 + pulse(time, 8.5) * 0.32} /></mesh></group> }

function Panels({ panels, time }: { panels: ScenePanel[]; time: number }) { return <>{panels.map(panel => { const opacity = visibilityBetween(time, panel.start, panel.end); if (opacity <= 0.01) return null; return <Html key={panel.id} position={panel.position} center distanceFactor={panel.variant === 'main' ? 8.8 : 8.2} transform sprite occlude={false} zIndexRange={[panel.variant === 'main' ? 42 : 38, 0]}><div className={`scripted-panel scripted-panel--${panel.variant ?? 'side'}`} style={{ opacity, transform: `translateY(${5 - opacity * 5}px) scale(${0.76 + opacity * 0.07})` }}><div className="scripted-panel-topbar"><span>{panel.title}</span>{panel.subtitle && <i>{panel.subtitle}</i>}</div>{panel.lines.map((line, index) => <p key={`${panel.id}-${index}`}>{line}</p>)}</div></Html> })}</> }
function Dialogues({ dialogues, time }: { dialogues: SceneDialogue[]; time: number }) { return <>{dialogues.map(entry => { const opacity = visibilityBetween(time, entry.start, entry.end); if (opacity <= 0.01) return null; return <Html key={`${entry.title}-${entry.start}`} position={entry.position ?? [-0.46, entry.kind === 'person' ? 1.58 : 1.72, 0.86]} center distanceFactor={7.8} transform sprite occlude={false} zIndexRange={[39, 0]}><div className={`object-label object-label--${entry.kind} scripted-dialog`} style={{ opacity, transform: `translateY(${8 - opacity * 8}px) scale(${0.94 + opacity * 0.06})` }}><strong>{entry.title}</strong><span>{entry.body}</span></div></Html> })}</> }
function SceneContent({ config, time }: { config: ScriptedSceneConfig; time: number }) { return <><Environment kind={config.environment} /><Person time={time} pose={config.pose} broochMode={config.broochMode} /><group>{config.routes.map((route, index) => <AnimatedRoute key={index} route={route} time={time} />)}<Panels panels={config.panels} time={time} /><Dialogues dialogues={config.dialogues} time={time} /></group></> }
function AnimatedScene({ config, time }: { config: ScriptedSceneConfig; time: number }) { return <><color attach="background" args={['#05080d']} /><fog attach="fog" args={['#05080d', 5.6, 11.5]} /><OrthographicCamera makeDefault position={[2.55, 2.1, 3.1]} zoom={122} /><CameraMotion time={time} cameraFrames={config.camera} /><ambientLight intensity={0.42} /><hemisphereLight intensity={0.26} color="#d8e6ff" groundColor="#080604" /><directionalLight castShadow intensity={1.05} position={[4.2, 6.8, 4.6]} shadow-mapSize-width={2048} shadow-mapSize-height={2048} /><spotLight castShadow intensity={6.2} angle={0.46} penumbra={0.84} position={[0.4, 3.6, 2.0]} color="#dcecff" /><pointLight intensity={0.9} distance={2.2} position={[BROOCH.x, BROOCH.y, BROOCH.z]} color={ACTIVE_BLUE} /><group rotation={[0, -0.06, 0]}><SceneContent config={config} time={time} /></group><ContactShadows position={[0, 0.02, 0]} opacity={0.58} scale={9} blur={2.35} far={6} color="#000000" /><OrbitControls enabled={false} enablePan={false} enableZoom={false} enableRotate={false} target={[0, 1.18, 0.15]} /></> }
function SceneOverlay({ time, duration }: { time: number; duration: number }) { return <div className="story-progress"><i style={{ width: `${(time / duration) * 100}%` }} /></div> }
export function ScriptedSceneExperience({ config }: { config: ScriptedSceneConfig }) { const time = useStoryClock(config.duration); return <section className="interior-shell" aria-label={config.ariaLabel}><Canvas shadows dpr={[1, 2]}><Suspense fallback={null}><AnimatedScene config={config} time={time} /></Suspense></Canvas><SceneOverlay time={time} duration={config.duration} /></section> }
