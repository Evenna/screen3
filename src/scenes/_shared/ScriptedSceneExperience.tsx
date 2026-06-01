import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { ContactShadows, Edges, Html, OrbitControls, OrthographicCamera } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { Mesh, Object3D } from 'three'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import '../../App.css'

export type Vec3 = [number, number, number]
export type EnvironmentKind =
  | 'kitchen'
  | 'living'
  | 'study'
  | 'balcony'
  | 'city-link'
  | 'choice-room'
  | 'meeting-room'
  | 'home-study'
  | 'dorm-loft'
  | 'cozy-study'
  | 'asset-scene6'
  | 'asset-late-work'
  | 'asset-generation-office'
  | 'asset-anniversary-kitchen'
  | 'asset-third-option-office'
  | 'asset-hotel-care'
  | 'asset-quiet-window'
  | 'asset-cozy-study'
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
  showPerson?: boolean
  broochMode?: 'normal' | 'delayed' | 'off'
  progressClass?: string
  disableEnvironmentMotion?: boolean
  enableOrbitControls?: boolean
  panels: ScenePanel[]
  dialogues: SceneDialogue[]
  routes: SceneRoute[]
  camera?: Array<{ at: number; position: THREE.Vector3; look: THREE.Vector3; zoom: number }>
}

export const ACTIVE_BLUE = '#9ed8ff'
export const MAIN_BLUE = '#3f73ff'
export const WARM_GLOW = '#ffd49a'
export const WHITE_EDGE = '#ffffff'
export const SOFT_EDGE = '#77818f'
export const MUTED_EDGE = '#46515e'
const BROOCH = new THREE.Vector3(0.03, 1.22, 0.38)
const POLY = '/models/poly-pizza/'
const MODEL_ASSET = '/models/user-provided/model-assets/'
export const ASSETS = {
  man: '/models/sitting-man/tripo_convert_32d5344d-740d-4b6c-8fca-9a3c4bb1bd55.obj',
  baseMale: '/models/base-male.glb',
  desk: `${POLY}desk.glb`,
  chair: `${POLY}chair.glb`,
  bedTwin: `${POLY}bed-twin.glb`,
  bunkBed: '/models/user-provided/dorm-loft-bed.glb',
  bedDouble: `${POLY}bed-double.glb`,
  nightStand: `${POLY}night-stand.glb`,
  closet: `${POLY}closet.glb`,
  bookcase: `${POLY}bookcase-with-books.glb`,
  door: `${POLY}door.glb`,
  meetingTable: `${POLY}meeting-table.glb`,
  projectorScreen: `${POLY}projector-screen.glb`,
  wallScreen: `${POLY}computer-screen-kenney.glb`,
  armchair: `${POLY}armchair.glb`,
  curtain: `${POLY}curtain.glb`,
  rug: `${POLY}rug-square.glb`,
  sofa: '/models/quaternius-furniture/sofa.glb',
  sofaSmall: '/models/quaternius-furniture/sofa-small.glb',
  table: '/models/quaternius-furniture/round-table-small.glb',
  lamp: '/models/quaternius-furniture/lamp-round-floor.glb',
  computer: '/models/open-office/computer-screen.glb',
  keyboard: '/models/open-office/keyboard.glb',
  mug: '/models/open-office/mug.glb',
  assetDesk: `${MODEL_ASSET}desk.glb`,
  stickyDesk: `${MODEL_ASSET}sticky-desk.glb`,
  assetLamp: `${MODEL_ASSET}desk-lamp.glb`,
  phone: `${MODEL_ASSET}phone.glb`,
  plant: `${MODEL_ASSET}plant.glb`,
  assetKeyboard: `${MODEL_ASSET}keyboard.glb`,
  whiteboard: `${MODEL_ASSET}whiteboard.glb`,
  assetMonitor: `${MODEL_ASSET}monitor.glb`,
  laptop: `${MODEL_ASSET}laptop.glb`,
  officeDesk: `${MODEL_ASSET}office-desk.glb`,
  kitchenIsland: `${MODEL_ASSET}kitchen-island.glb`,
  fridge: `${MODEL_ASSET}fridge.glb`,
  paper: `${MODEL_ASSET}paper.glb`,
  coffeeCup: `${MODEL_ASSET}coffee-cup.glb`,
  seatedYoungMan: `${MODEL_ASSET}seated-young-man.glb`,
  seatedWoman: `${MODEL_ASSET}seated-woman.glb`,
  floorBookshelf: `${MODEL_ASSET}floor-bookshelf.glb`,
  desktopBookshelf: `${MODEL_ASSET}desktop-bookshelf.glb`,
  hotelBed: `${MODEL_ASSET}hotel-bed.glb`,
  nightstandLamp: `${MODEL_ASSET}nightstand-lamp.glb`,
  openSuitcase: `${MODEL_ASSET}open-suitcase.glb`,
  comfyChair: `${MODEL_ASSET}comfy-chair.glb`,
  singleSofaChair: `${MODEL_ASSET}single-sofa-chair.glb`,
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

function StaticCameraLookAt({ frame }: { frame: NonNullable<ScriptedSceneConfig['camera']>[number] }) {
  const { camera } = useThree()

  useEffect(() => {
    camera.position.copy(frame.position)
    camera.zoom = frame.zoom
    camera.lookAt(frame.look)
    camera.updateProjectionMatrix()
  }, [camera, frame])

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
  return <group position={position} rotation={rotation}><primitive object={object} /></group>
}
function ObjModel({ src, position, rotation = [0, 0, 0], scale = 1, tint = '#101721', edge = WHITE_EDGE, opacity = 0.5, lineOpacity = 0.34, threshold = 42 }: { src: string; position: Vec3; rotation?: Vec3; scale?: number; tint?: string; edge?: string; opacity?: number; lineOpacity?: number; threshold?: number }) {
  const loaded = useLoader(OBJLoader, src)
  const object = useMemo(() => { const clone = loaded.clone(true); fitObject(clone, scale); styleImported(clone, tint, edge, opacity, lineOpacity, threshold); return clone }, [edge, lineOpacity, loaded, opacity, scale, threshold, tint])
  return <group position={position} rotation={rotation}><primitive object={object} /></group>
}
export function Model({ src, ...props }: Parameters<typeof GltfModel>[0]) { return src.endsWith('.obj') ? <ObjModel src={src} {...props} /> : <GltfModel src={src} {...props} /> }

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
    {windowSide === 'right' && <LineBox position={[3.54, 1.5, -0.35]} scale={[0.035, 0.8, 1.35]} color="#071421" edge={SOFT_EDGE} opacity={0.24} emissive={ACTIVE_BLUE} emissiveIntensity={0.025} />}
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
    <LineBox position={[0, 1.36, -2.28]} scale={[7.35, 2.68, 0.05]} color="#0b121a" edge={SOFT_EDGE} opacity={0.16} emissive="#0b121a" emissiveIntensity={0.04} />
    <LineBox position={[-0.85, 2.42, -0.1]} scale={[1.24, 0.035, 0.22]} color="#eef4ff" edge={WHITE_EDGE} opacity={0.4} emissive="#eef4ff" emissiveIntensity={0.28} />
    <LineBox position={[0.85, 2.42, -0.1]} scale={[1.24, 0.035, 0.22]} color="#eef4ff" edge={WHITE_EDGE} opacity={0.4} emissive="#eef4ff" emissiveIntensity={0.28} />
    <LineBox position={[0, 2.28, -0.1]} scale={[3.45, 0.02, 1.48]} color="#0e1721" edge={SOFT_EDGE} opacity={0.14} emissive="#dbe8ff" emissiveIntensity={0.08} />
    <Model src={ASSETS.door} position={[-2.8, 0, -2.16]} rotation={[0, 0, 0]} scale={1.25} opacity={0.4} lineOpacity={0.3} edge={SOFT_EDGE} />
    <Model src={ASSETS.projectorScreen} position={[0.1, 1.52, -2.12]} rotation={[0, 0, 0]} scale={1.82} opacity={0.5} lineOpacity={0.44} edge={ACTIVE_BLUE} />
    <LineBox position={[0.1, 1.52, -2.06]} scale={[1.72, 0.86, 0.018]} color="#102130" edge={ACTIVE_BLUE} opacity={0.28} emissive={ACTIVE_BLUE} emissiveIntensity={0.1} />
    {[-0.96, 0, 0.96].map((x) => <Model key={`table-${x}`} src={ASSETS.desk} position={[x, 0.48, 0.18]} rotation={[0, Math.PI / 2, 0]} scale={1.12} opacity={0.66} lineOpacity={0.5} edge={WHITE_EDGE} />)}
    {[-1.62, -0.86, -0.08, 0.7, 1.48].map((x) => <Model key={`front-chair-${x}`} src={ASSETS.chair} position={[x, 0.16, 0.98]} rotation={[0, Math.PI, 0]} scale={0.62} opacity={0.62} lineOpacity={0.5} edge={WHITE_EDGE} />)}
    {[-1.62, -0.86, -0.08, 0.7, 1.48].map((x) => <Model key={`back-chair-${x}`} src={ASSETS.chair} position={[x, 0.16, -0.62]} rotation={[0, 0, 0]} scale={0.62} opacity={0.58} lineOpacity={0.46} edge={WHITE_EDGE} />)}
    <Model src={ASSETS.whiteboard} position={[-1.82, 1.2, -1.68]} rotation={[0, 0.32, 0]} scale={0.84} opacity={0.5} lineOpacity={0.5} edge={WHITE_EDGE} threshold={12} />
    <Model src={ASSETS.wallScreen} position={[1.92, 1.24, -1.68]} rotation={[0, -0.34, 0]} scale={0.72} opacity={0.46} lineOpacity={0.38} edge={ACTIVE_BLUE} />
  </group>
  if (kind === 'home-study') return <group><RoomShell windowSide="back" /><Model src={ASSETS.bookcase} position={[-1.92, 0, -1.16]} scale={1.34} opacity={0.34} lineOpacity={0.28} edge={SOFT_EDGE} /><Model src={ASSETS.bookcase} position={[-2.66, 0, -1.02]} scale={1.0} opacity={0.28} lineOpacity={0.24} edge={SOFT_EDGE} /><Model src={ASSETS.desk} position={[0.18, 0.54, 0.02]} scale={1.58} opacity={0.48} lineOpacity={0.36} edge={WHITE_EDGE} /><Model src={ASSETS.chair} position={[0.0, 0.18, 0.72]} rotation={[0, Math.PI, 0]} scale={0.94} opacity={0.46} lineOpacity={0.34} /><Model src={ASSETS.computer} position={[0.28, 1.02, -0.42]} scale={0.56} opacity={0.48} lineOpacity={0.34} edge={ACTIVE_BLUE} /><Model src={ASSETS.keyboard} position={[0.06, 0.95, -0.02]} scale={0.38} opacity={0.42} lineOpacity={0.28} /><Model src={ASSETS.mug} position={[-0.3, 0.98, 0.08]} scale={0.22} opacity={0.46} lineOpacity={0.32} /><Model src={ASSETS.curtain} position={[1.74, 0.42, -2.12]} scale={1.36} opacity={0.34} lineOpacity={0.28} edge={SOFT_EDGE} /><Model src={ASSETS.curtain} position={[2.2, 0.42, -2.12]} scale={1.36} opacity={0.34} lineOpacity={0.28} edge={SOFT_EDGE} /><Model src={ASSETS.rug} position={[0.34, 0.03, 0.5]} rotation={[-Math.PI / 2, 0, 0]} scale={1.42} opacity={0.2} lineOpacity={0.18} edge={SOFT_EDGE} /><Model src={ASSETS.lamp} position={[1.62, 0, -0.62]} scale={1.08} opacity={0.36} lineOpacity={0.26} /></group>
  if (kind === 'asset-scene6') return <group>
    <RoomShell windowSide="left" />
    {[-2.2, -0.6, 1.0, 2.35].map((x) => <LineBox key={`scene6-lamp-${x}`} position={[x, 2.05, -0.35]} scale={[0.22, 0.08, 0.22]} color="#111722" edge={WHITE_EDGE} opacity={0.46} emissive="#f3f0df" emissiveIntensity={0.1} />)}
    <Model src={ASSETS.stickyDesk} position={[-1.32, 0.94, 0.2]} rotation={[0, 0, 0]} scale={2.2} opacity={0.5} lineOpacity={0.66} edge={WHITE_EDGE} threshold={8} />
    {[[-2.02, -0.18], [-0.62, -0.18], [-2.02, 0.62], [-0.62, 0.62]].map(([x, z]) => (
      <LineBox key={`scene6-desk-leg-${x}-${z}`} position={[x, 0.49, z]} scale={[0.06, 0.98, 0.06]} color="#101721" edge={WHITE_EDGE} opacity={0.68} />
    ))}
    <Model src={ASSETS.seatedYoungMan} position={[0.3, 0, 0.7]} rotation={[0, -Math.PI / 2, 0]} scale={1.8} tint="#172231" opacity={0.62} lineOpacity={0.86} edge={WHITE_EDGE} threshold={8} />
    <Model src={ASSETS.assetMonitor} position={[-0.3, 1.07, 0.38]} rotation={[0, Math.PI / 2, 0]} scale={0.78} opacity={0.58} lineOpacity={0.72} edge={ACTIVE_BLUE} threshold={8} />
    <Model src={ASSETS.assetMonitor} position={[-1.72, 1.1, 0.5]} rotation={[0, Math.PI / 2, 0]} scale={0.52} opacity={0.56} lineOpacity={0.68} edge={ACTIVE_BLUE} threshold={8} />
    <Model src={ASSETS.laptop} position={[-1.3, 1.12, 0.92]} rotation={[0, 0.45, 0]} scale={0.56} opacity={0.62} lineOpacity={0.82} edge={WHITE_EDGE} threshold={8} />
    <Model src={ASSETS.assetKeyboard} position={[-1.07, 1.1, 0.55]} rotation={[0, -0.08, 0]} scale={0.35} opacity={0.5} lineOpacity={0.58} edge={WHITE_EDGE} threshold={8} />
    <Model src={ASSETS.paper} position={[-0.82, 1.1, 0.7]} rotation={[0, -0.22, 0.04]} scale={0.3} opacity={0.54} lineOpacity={0.64} edge={WHITE_EDGE} threshold={7} />
    <Model src={ASSETS.coffeeCup} position={[-1.62, 1.1, 0.6]} scale={0.13} opacity={0.5} lineOpacity={0.56} edge={WHITE_EDGE} threshold={8} />
    <Model src={ASSETS.phone} position={[-1.87, 1.1, 0.7]} rotation={[0, 0.38, 0.1]} scale={0.15} opacity={0.5} lineOpacity={0.58} edge={ACTIVE_BLUE} threshold={7} />
    <Model src={ASSETS.plant} position={[-2.4, 0, 0.4]} scale={1.0} opacity={0.42} lineOpacity={0.42} edge={SOFT_EDGE} threshold={12} />
    <Model src={ASSETS.whiteboard} position={[2.2, 0, -1.5]} rotation={[0, -0.12, 0]} scale={1.8} opacity={0.42} lineOpacity={0.52} edge={WHITE_EDGE} threshold={10} />
  </group>
  if (kind === 'asset-late-work') return <group>
    <RoomShell windowSide="back" />
    <LineBox position={[-1.65, 1.42, -2.28]} scale={[1.55, 1.0, 0.035]} color="#071421" edge={MUTED_EDGE} opacity={0.2} emissive={ACTIVE_BLUE} emissiveIntensity={0.012} />
    <Model src={ASSETS.curtain} position={[-2.28, 0.66, -2.18]} rotation={[0, 0, 0]} scale={1.16} opacity={0.56} lineOpacity={0.86} edge={WHITE_EDGE} threshold={8} />
    <Model src={ASSETS.curtain} position={[-1.02, 0.66, -2.18]} rotation={[0, Math.PI, 0]} scale={1.16} opacity={0.56} lineOpacity={0.86} edge={WHITE_EDGE} threshold={8} />
    <group position={[-0.48, 0, -0.18]} scale={1.08}>
      <Model src={ASSETS.seatedYoungMan} position={[-0.52, 0, -0.04]} rotation={[0, -Math.PI / 2, 0]} scale={1.28} tint="#172231" opacity={0.6} lineOpacity={0.86} edge={WHITE_EDGE} threshold={8} />
      <Model src={ASSETS.assetMonitor} position={[-1.08, 0.62, -0.28]} rotation={[0, Math.PI / 2, 0]} scale={0.46} opacity={0.58} lineOpacity={0.7} edge={ACTIVE_BLUE} threshold={8} />
      <Model src={ASSETS.laptop} position={[-0.66, 0.61, 0.08]} rotation={[0, 1.18, 0]} scale={0.34} opacity={0.56} lineOpacity={0.68} edge={ACTIVE_BLUE} threshold={8} />
      <Model src={ASSETS.assetKeyboard} position={[-0.86, 0.6, 0.02]} rotation={[0, Math.PI / 2, 0]} scale={0.24} opacity={0.5} lineOpacity={0.58} edge={WHITE_EDGE} threshold={8} />
      <Model src={ASSETS.coffeeCup} position={[-1.18, 0.6, 0.16]} scale={0.1} opacity={0.52} lineOpacity={0.56} edge={WHITE_EDGE} threshold={8} />
      <Model src={ASSETS.paper} position={[-0.55, 0.6, 0.18]} rotation={[0, 0.28, 0.08]} scale={0.17} opacity={0.52} lineOpacity={0.58} edge={WHITE_EDGE} threshold={8} />
      <Model src={ASSETS.phone} position={[-0.42, 0.6, 0.04]} rotation={[0, -0.18, 0.1]} scale={0.085} opacity={0.5} lineOpacity={0.56} edge={ACTIVE_BLUE} threshold={8} />
    </group>
    <Model src={ASSETS.floorBookshelf} position={[1.16, 0, -1.3]} rotation={[0, -0.03, 0]} scale={1.68} opacity={0.42} lineOpacity={0.54} edge={SOFT_EDGE} threshold={10} />
    <LineBox position={[1.18, 1.34, -1.05]} scale={[0.18, 0.09, 0.035]} color={ACTIVE_BLUE} edge={ACTIVE_BLUE} opacity={0.62} emissive={ACTIVE_BLUE} emissiveIntensity={0.2} />
    <Model src={ASSETS.hotelBed} position={[1.72, 0.16, 0.58]} rotation={[0, -0.34, 0]} scale={2.55} opacity={0.5} lineOpacity={0.64} edge={WHITE_EDGE} threshold={10} />
    <Model src={ASSETS.nightStand} position={[3.16, 0.18, -0.46]} rotation={[0, -0.12, 0]} scale={0.66} opacity={0.4} lineOpacity={0.36} edge={SOFT_EDGE} />
    <Model src={ASSETS.nightstandLamp} position={[3.14, 0.52, -0.48]} scale={0.56} opacity={0.44} lineOpacity={0.48} edge={WARM_GLOW} threshold={10} />
    <LineBox position={[3.14, 0.96, -0.48]} scale={[0.2, 0.17, 0.2]} color="#ffd49a" edge={WARM_GLOW} opacity={0.38} emissive={WARM_GLOW} emissiveIntensity={0.25} />
    <Model src={ASSETS.plant} position={[-2.92, 0, 0.72]} scale={0.92} opacity={0.5} lineOpacity={0.72} edge={WHITE_EDGE} threshold={10} />
  </group>
  if (kind === 'dorm-loft') return <group><RoomShell windowSide="left" />
    <Model src={ASSETS.bunkBed} position={[-1.38, 0.86, 1.02]} rotation={[0, Math.PI, 0]} scale={1.72} tint="#1b2330" opacity={0.78} lineOpacity={1} edge="#ffffff" threshold={6} />
    <Model src={ASSETS.bunkBed} position={[1.38, 0.86, 1.02]} rotation={[0, Math.PI, 0]} scale={1.72} tint="#1b2330" opacity={0.78} lineOpacity={1} edge="#ffffff" threshold={6} />
    <Model src={ASSETS.bunkBed} position={[-1.38, 0.86, -1.18]} rotation={[0, 0, 0]} scale={1.72} tint="#1b2330" opacity={0.78} lineOpacity={1} edge="#ffffff" threshold={6} />
    <Model src={ASSETS.bunkBed} position={[1.38, 0.86, -1.18]} rotation={[0, 0, 0]} scale={1.72} tint="#1b2330" opacity={0.78} lineOpacity={1} edge="#ffffff" threshold={6} />
  </group>
  if (kind === 'cozy-study') return <group><RoomShell windowSide="back" /><Model src={ASSETS.rug} position={[0.1, 0.03, 0.48]} rotation={[-Math.PI / 2, 0, 0]} scale={1.86} opacity={0.24} lineOpacity={0.2} edge={SOFT_EDGE} /><Model src={ASSETS.sofaSmall} position={[0.02, 0.18, 0.34]} scale={1.2} opacity={0.44} lineOpacity={0.34} edge={WHITE_EDGE} /><Model src={ASSETS.armchair} position={[-1.2, 0.16, 0.52]} rotation={[0, 0.34, 0]} scale={0.98} opacity={0.42} lineOpacity={0.32} edge={WHITE_EDGE} /><Model src={ASSETS.table} position={[0.66, 0.46, 1.02]} scale={0.74} opacity={0.38} lineOpacity={0.28} /><Model src={ASSETS.bookcase} position={[1.96, 0, -1.04]} scale={1.3} opacity={0.32} lineOpacity={0.26} edge={SOFT_EDGE} /><Model src={ASSETS.bookcase} position={[-2.02, 0, -1.06]} scale={1.12} opacity={0.28} lineOpacity={0.22} edge={SOFT_EDGE} /><Model src={ASSETS.lamp} position={[-1.88, 0, -0.22]} scale={1.08} opacity={0.34} lineOpacity={0.24} /><Model src={ASSETS.curtain} position={[1.48, 0.38, -2.12]} scale={1.28} opacity={0.3} lineOpacity={0.24} edge={SOFT_EDGE} /><Model src={ASSETS.curtain} position={[2.06, 0.38, -2.12]} scale={1.28} opacity={0.3} lineOpacity={0.24} edge={SOFT_EDGE} /></group>
  if (kind === 'asset-cozy-study') return <group><RoomShell windowSide="back" /><Model src={ASSETS.rug} position={[0.1, 0.03, 0.48]} rotation={[-Math.PI / 2, 0, 0]} scale={1.86} opacity={0.2} lineOpacity={0.18} edge={SOFT_EDGE} /><Model src={ASSETS.singleSofaChair} position={[0.0, 0.2, 0.34]} rotation={[0, -0.12, 0]} scale={1.22} opacity={0.46} lineOpacity={0.5} edge={WHITE_EDGE} threshold={10} /><Model src={ASSETS.comfyChair} position={[-1.18, 0.18, 0.52]} rotation={[0, 0.34, 0]} scale={1.0} opacity={0.42} lineOpacity={0.46} edge={WHITE_EDGE} threshold={10} /><Model src={ASSETS.table} position={[0.66, 0.46, 1.02]} scale={0.74} opacity={0.38} lineOpacity={0.28} /><Model src={ASSETS.floorBookshelf} position={[1.86, 0, -1.02]} scale={1.28} opacity={0.36} lineOpacity={0.42} edge={SOFT_EDGE} threshold={12} /><Model src={ASSETS.desktopBookshelf} position={[-1.88, 0.78, -1.12]} scale={0.86} opacity={0.38} lineOpacity={0.42} edge={SOFT_EDGE} threshold={12} /><Model src={ASSETS.assetLamp} position={[-1.8, 0.02, -0.2]} scale={0.94} opacity={0.34} lineOpacity={0.38} edge={WHITE_EDGE} threshold={12} /><Model src={ASSETS.plant} position={[1.42, 0, 0.86]} scale={0.72} opacity={0.34} lineOpacity={0.36} edge={SOFT_EDGE} threshold={12} /></group>
  if (kind === 'asset-generation-office') return <group><RoomShell windowSide="back" /><Model src={ASSETS.officeDesk} position={[0.18, 0.54, 0.02]} scale={1.52} opacity={0.46} lineOpacity={0.52} edge={WHITE_EDGE} threshold={10} /><Model src={ASSETS.seatedWoman} position={[0.02, 0.64, 0.52]} rotation={[0, Math.PI / 2, 0]} scale={1.28} tint="#172231" opacity={0.56} lineOpacity={0.7} edge={WHITE_EDGE} threshold={10} /><Model src={ASSETS.assetMonitor} position={[0.32, 1.02, -0.42]} scale={0.52} opacity={0.48} lineOpacity={0.48} edge={ACTIVE_BLUE} threshold={10} /><Model src={ASSETS.assetKeyboard} position={[0.06, 0.96, -0.02]} scale={0.34} opacity={0.42} lineOpacity={0.44} edge={WHITE_EDGE} threshold={10} /><Model src={ASSETS.phone} position={[0.62, 0.98, 0.2]} rotation={[0, -0.24, 0.1]} scale={0.2} opacity={0.5} lineOpacity={0.54} edge={ACTIVE_BLUE} threshold={8} /><Model src={ASSETS.coffeeCup} position={[-0.42, 0.98, 0.12]} scale={0.18} opacity={0.46} lineOpacity={0.42} edge={WHITE_EDGE} threshold={10} /><Model src={ASSETS.plant} position={[1.72, 0, -0.96]} scale={0.72} opacity={0.34} lineOpacity={0.34} edge={SOFT_EDGE} threshold={12} /></group>
  if (kind === 'asset-anniversary-kitchen') return <group><RoomShell windowSide="left" /><Model src={ASSETS.kitchenIsland} position={[0.16, 0.68, 0.16]} scale={1.5} opacity={0.48} lineOpacity={0.52} edge={WHITE_EDGE} threshold={10} /><Model src={ASSETS.fridge} position={[-1.92, 0, -1.1]} rotation={[0, 0.18, 0]} scale={1.22} opacity={0.42} lineOpacity={0.46} edge={SOFT_EDGE} threshold={12} /><Model src={ASSETS.phone} position={[0.52, 1.02, 0.16]} rotation={[0, -0.22, 0.1]} scale={0.2} opacity={0.54} lineOpacity={0.58} edge={ACTIVE_BLUE} threshold={8} /><Model src={ASSETS.coffeeCup} position={[-0.34, 1.0, 0.22]} scale={0.18} opacity={0.46} lineOpacity={0.42} edge={WHITE_EDGE} threshold={10} /><Model src={ASSETS.plant} position={[1.82, 0, -0.88]} scale={0.7} opacity={0.34} lineOpacity={0.34} edge={SOFT_EDGE} threshold={12} /></group>
  if (kind === 'asset-third-option-office') return <group><RoomShell /><LineBox position={[0, 1.72, -2.18]} scale={[3.6, 1.05, 0.035]} color="#071421" edge={MUTED_EDGE} opacity={0.22} emissive={ACTIVE_BLUE} emissiveIntensity={0.02} /><Model src={ASSETS.officeDesk} position={[-0.82, 0.54, 0.14]} rotation={[0, 0.18, 0]} scale={1.44} opacity={0.46} lineOpacity={0.52} edge={WHITE_EDGE} threshold={10} /><Model src={ASSETS.laptop} position={[-0.64, 1.0, -0.1]} rotation={[0, 0.34, 0]} scale={0.42} opacity={0.5} lineOpacity={0.52} edge={ACTIVE_BLUE} threshold={10} /><Model src={ASSETS.phone} position={[-0.18, 1.0, 0.26]} rotation={[0, -0.2, 0.12]} scale={0.18} opacity={0.54} lineOpacity={0.58} edge={ACTIVE_BLUE} threshold={8} /><Model src={ASSETS.whiteboard} position={[1.62, 1.22, -1.42]} rotation={[0, -0.34, 0]} scale={0.92} opacity={0.44} lineOpacity={0.48} edge={WHITE_EDGE} threshold={12} /><Model src={ASSETS.plant} position={[1.72, 0, 0.78]} scale={0.72} opacity={0.32} lineOpacity={0.34} edge={SOFT_EDGE} threshold={12} /></group>
  if (kind === 'asset-hotel-care') return <group><RoomShell windowSide="back" /><Model src={ASSETS.hotelBed} position={[-1.08, 0.18, 0.1]} rotation={[0, 0.2, 0]} scale={1.7} opacity={0.48} lineOpacity={0.54} edge={WHITE_EDGE} threshold={10} /><Model src={ASSETS.nightstandLamp} position={[-2.18, 0.12, -0.86]} scale={0.78} opacity={0.42} lineOpacity={0.44} edge={WHITE_EDGE} threshold={12} /><Model src={ASSETS.openSuitcase} position={[1.28, 0.08, 0.68]} rotation={[0, -0.36, 0]} scale={1.0} opacity={0.44} lineOpacity={0.48} edge={WHITE_EDGE} threshold={10} /><Model src={ASSETS.phone} position={[0.6, 0.7, 0.88]} rotation={[0, -0.2, 0.1]} scale={0.18} opacity={0.54} lineOpacity={0.58} edge={ACTIVE_BLUE} threshold={8} /><Model src={ASSETS.comfyChair} position={[1.66, 0.18, -0.48]} rotation={[0, -0.72, 0]} scale={0.86} opacity={0.36} lineOpacity={0.38} edge={SOFT_EDGE} threshold={12} /></group>
  if (kind === 'asset-quiet-window') return <group><RoomShell windowSide="back" /><Model src={ASSETS.comfyChair} position={[0.04, 0.18, 0.34]} rotation={[0, -0.16, 0]} scale={1.08} opacity={0.42} lineOpacity={0.48} edge={WHITE_EDGE} threshold={10} /><Model src={ASSETS.phone} position={[0.42, 0.88, 0.52]} rotation={[0, -0.28, 0.1]} scale={0.18} opacity={0.46} lineOpacity={0.52} edge={ACTIVE_BLUE} threshold={8} /><Model src={ASSETS.plant} position={[-1.68, 0, -0.88]} scale={0.78} opacity={0.32} lineOpacity={0.34} edge={SOFT_EDGE} threshold={12} /><Model src={ASSETS.assetLamp} position={[1.6, 0, -0.62]} scale={0.92} opacity={0.3} lineOpacity={0.32} edge={SOFT_EDGE} threshold={12} /><LineBox position={[1.2, 1.52, -2.26]} scale={[1.9, 1.0, 0.035]} color="#071421" edge={MUTED_EDGE} opacity={0.28} emissive={ACTIVE_BLUE} emissiveIntensity={0.018} /></group>
  return <group><RoomShell /><Model src={ASSETS.sofaSmall} position={[-0.95, 0.2, 0.18]} scale={1.1} opacity={0.38} lineOpacity={0.3} /><Model src={ASSETS.chair} position={[0.9, 0.16, 0.18]} rotation={[0, -0.55, 0]} scale={0.88} opacity={0.38} lineOpacity={0.3} /><Model src={ASSETS.table} position={[0, 0.5, 0.76]} scale={0.72} opacity={0.34} lineOpacity={0.26} /></group>
}

function SegmentTube({ start, end, width, opacity, color }: { start: THREE.Vector3; end: THREE.Vector3; width: number; opacity: number; color: string }) { const geometry = useMemo(() => new THREE.TubeGeometry(new THREE.LineCurve3(start, end), 18, width, 6, false), [end, start, width]); return <mesh geometry={geometry}><meshBasicMaterial color={color} transparent opacity={opacity} /></mesh> }
function AnimatedRoute({ route, time }: { route: SceneRoute; time: number }) { const end = new THREE.Vector3(...route.to); const points = useMemo(() => [BROOCH, route.via ? new THREE.Vector3(...route.via) : BROOCH.clone().lerp(end, 0.5).add(new THREE.Vector3(0, 0.35, 0)), end], [end, route.via]); const progress = clamp01((time - route.start) / (route.end - route.start)); const visibility = smoothStep(time, route.start, route.start + 0.35) * (1 - smoothStep(time, route.holdUntil, route.holdUntil + 0.65)); const lengths = useMemo(() => { let total = 0; const segments = points.slice(0, -1).map((p, i) => { const l = p.distanceTo(points[i + 1]); total += l; return l }); return { segments, total } }, [points]); const movingPoint = getPathPoint(points, progress); if (visibility <= 0.01 || progress <= 0.01 || lengths.total <= 0.001) return null; let drawn = progress * lengths.total; return <group>{points.slice(0, -1).map((p, i) => { const l = lengths.segments[i]; const amount = clamp01(drawn / l); drawn -= l; if (amount <= 0) return null; return <SegmentTube key={i} start={p} end={p.clone().lerp(points[i + 1], amount)} width={route.width ?? 0.005} opacity={0.08 + visibility * 0.55} color={route.color ?? ACTIVE_BLUE} /> })}<mesh position={[movingPoint.x, movingPoint.y, movingPoint.z]}><sphereGeometry args={[(route.width ?? 0.005) * 3.8, 14, 10]} /><meshBasicMaterial color={route.color ?? ACTIVE_BLUE} transparent opacity={0.58 + pulse(time, 8.5) * 0.32} /></mesh></group> }

const SCENE6_TOOL_CARDS = [
  { name: '邮件', body: '3 封 Q3 相关｜老板昨晚转发留存数据', position: [-1.18, 2.02, 0.02] as Vec3 },
  { name: 'Slack', body: '#growth-q3｜47 条讨论｜留存占 31 条', position: [-0.58, 2.24, -0.02] as Vec3 },
  { name: 'Notion', body: '找到 Q3 思路草稿 v0.3｜可转提纲', position: [0, 2.34, -0.04] as Vec3 },
  { name: '飞书', body: 'Q2 留存复盘｜关键:第 3 天流失', position: [0.58, 2.24, -0.02] as Vec3 },
  { name: '日历', body: '15:00 会议｜CEO + 小蕾 + 小冯', position: [1.18, 2.02, 0.02] as Vec3 },
]

function Scene6ToolCard({ name, body, position, time, index }: { name: string; body: string; position: Vec3; time: number; index: number }) {
  const appear = 10.8 + index * 0.16
  const opacity = visibilityBetween(time, appear, 15.0, 0.34)
  const gather = smoothStep(time, 13.4, 15.0)
  if (opacity <= 0.01) return null
  return <Html position={position} center distanceFactor={7.4} transform sprite occlude={false} zIndexRange={[32, 0]}>
    <div className="object-label object-label--action open-office-tool-card" style={{ opacity, transform: `translate3d(0, ${6 - opacity * 6 + gather * 8}px, 0) scale(${0.9 + opacity * 0.1 - gather * 0.08})` }}>
      <strong>{name}</strong>
      <span>{body}</span>
    </div>
  </Html>
}

function Scene6BattleCard({ time }: { time: number }) {
  const opacity = smoothStep(time, 15.3, 16.2) * (time < 39.5 ? 1 : 1 - smoothStep(time, 39.5, 41.2))
  if (opacity <= 0.01) return null
  return <Html position={[1.78, 1.48, 0.56]} center distanceFactor={8.9} transform sprite occlude={false} zIndexRange={[42, 0]}>
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
        <span><b>48% -&gt; 41%</b>30 天留存下降 7pt</span>
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
            <li>onboarding 重设计：沿用你 Notion 草稿。</li>
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
}

function Scene6DialogueLayer({ time }: { time: number }) {
  const entries = [
    { start: 0.6, end: 4.4, kind: 'person', title: '李明', body: 'Evans，10 分钟后老板让我开会讨论 Q3 用户增长方案，我都没准备……完蛋了。', position: [0.58, 1.58, 0.82] as Vec3 },
    { start: 4.6, end: 8.1, kind: 'voice', title: 'Evans', body: '别慌。我看了你今天所有相关的邮件、Slack、Notion 和上次会议记录，帮你整理好了。', position: [-0.48, 1.72, 0.82] as Vec3 },
    { start: 8.3, end: 10.7, kind: 'voice', title: 'Evans', body: '剩下 8 分钟，你过一遍这三条就够了。我不会再打扰你。', position: [-0.48, 1.72, 0.82] as Vec3 },
  ]
  return <>{entries.map((entry) => {
    const opacity = visibilityBetween(time, entry.start, entry.end)
    if (opacity <= 0.01) return null
    return <Html key={entry.start} position={entry.position} center distanceFactor={7.8} transform sprite occlude={false} zIndexRange={[38, 0]}>
      <div className={`object-label object-label--${entry.kind} open-office-dialog`} style={{ opacity, transform: `translateY(${8 - opacity * 8}px) scale(${0.94 + opacity * 0.06})` }}>
        <strong>{entry.title}</strong>
        <span>{entry.body}</span>
      </div>
    </Html>
  })}</>
}

function Scene6DeviceStatus({ time }: { time: number }) {
  const monitorOpacity = visibilityBetween(time, 18.2, 23.0, 0.5)
  const quietOpacity = visibilityBetween(time, 20.4, 25.8, 0.5)
  return <>
    {monitorOpacity > 0.01 && <Html position={[-0.62, 1.34, 0.5]} center distanceFactor={7.4} transform sprite occlude={false} zIndexRange={[36, 0]}>
      <div className="object-label object-label--action object-label--right open-office-device-note" style={{ opacity: monitorOpacity }}>
        <strong>显示器</strong>
        作战卡已推送 · 1 页 · 预计阅读 5 分钟
      </div>
    </Html>}
    {quietOpacity > 0.01 && <Html position={[1.34, 1.02, 0.86]} center distanceFactor={8.8} transform sprite occlude={false} zIndexRange={[34, 0]}>
      <div className="open-office-web-toast" style={{ opacity: quietOpacity, transform: `translateY(${4 - quietOpacity * 4}px) scale(${0.9 + quietOpacity * 0.05})` }}>
        <strong>通讯静默已开启</strong>
        <span>Slack 勿扰至 16:00</span>
        <span>日历静默通知 · 手机静音</span>
      </div>
    </Html>}
  </>
}

function Scene6DispatchMotion({ time }: { time: number }) {
  const monitor = useMemo(() => new THREE.Vector3(-0.3, 1.12, 0.38), [])
  const webCardAnchor = useMemo(() => new THREE.Vector3(1.35, 1.46, 0.46), [])
  return <group>
    {SCENE6_TOOL_CARDS.map((card, index) => {
      const target = new THREE.Vector3(...card.position)
      return <AnimatedRoute
        key={`scene6-scan-${card.name}`}
        route={{ to: [monitor.x, monitor.y, monitor.z], via: [target.x * 0.32, 1.72 + index * 0.025, 0.06], start: 10.7 + index * 0.14, end: 12.5 + index * 0.16, holdUntil: 15.8, color: ACTIVE_BLUE, width: 0.0048 }}
        time={time}
      />
    })}
    <AnimatedRoute route={{ to: [monitor.x, monitor.y, monitor.z], via: [0.72, 1.4, 0.16], start: 16.6, end: 18.0, holdUntil: 21.2, color: MAIN_BLUE, width: 0.008 }} time={time} />
    <AnimatedRoute route={{ to: SCENE6_TOOL_CARDS[1].position, via: [-0.46, 1.82, 0.2], start: 19.0, end: 20.0, holdUntil: 22.0, color: ACTIVE_BLUE, width: 0.0048 }} time={time} />
    <AnimatedRoute route={{ to: SCENE6_TOOL_CARDS[4].position, via: [0.76, 1.82, 0.2], start: 19.4, end: 20.4, holdUntil: 22.2, color: ACTIVE_BLUE, width: 0.0048 }} time={time} />
    <AnimatedRoute route={{ to: [webCardAnchor.x, webCardAnchor.y, webCardAnchor.z], via: [0.48, 1.76, 0.24], start: 13.6, end: 15.2, holdUntil: 17.2, color: MAIN_BLUE, width: 0.007 }} time={time} />
    {SCENE6_TOOL_CARDS.map((card, index) => <Scene6ToolCard key={card.name} {...card} time={time} index={index} />)}
    <Scene6BattleCard time={time} />
    <Scene6DialogueLayer time={time} />
    <Scene6DeviceStatus time={time} />
  </group>
}

function Scene7DialogueLayer({ time }: { time: number }) {
  const entries = [
    { start: 0.8, end: 5.2, kind: 'person', title: '李明', body: '这个方案明早要交,我得再改一稿……', position: [0.44, 1.54, 0.78] as Vec3 },
    { start: 5.8, end: 13.0, kind: 'voice', title: 'Evans', body: '李明,我得告诉你一件事——你最近 90 天,凌晨 0 点后改的方案,第二天大改概率 84%。', position: [-0.58, 1.7, 0.72] as Vec3 },
    { start: 18.0, end: 27.0, kind: 'voice', title: 'Evans', body: '剩下的 8% 是排版和数据图,明早 30 分钟就能搞定。现在睡,6:30 我叫你起来,9 点提交完全来得及。', position: [-0.58, 1.7, 0.72] as Vec3 },
    { start: 32.0, end: 42.5, kind: 'voice', title: 'Evans', body: '或者你坚持改完,我也不拦你。但我想让你知道你自己的数据。', position: [-0.58, 1.7, 0.72] as Vec3 },
  ]
  return <>{entries.map((entry) => {
    const opacity = visibilityBetween(time, entry.start, entry.end, 0.45)
    if (opacity <= 0.01) return null
    return <Html key={entry.start} position={entry.position} center distanceFactor={7.7} transform sprite occlude={false} zIndexRange={[38, 0]}>
      <div className={`object-label object-label--${entry.kind} scripted-dialog`} style={{ opacity, transform: `translateY(${8 - opacity * 8}px) scale(${0.94 + opacity * 0.06})` }}>
        <strong>{entry.title}</strong>
        <span>{entry.body}</span>
      </div>
    </Html>
  })}</>
}

function Scene7DataCard({ time }: { time: number }) {
  const opacity = smoothStep(time, 8.0, 9.2) * (time < 46 ? 1 : 1 - smoothStep(time, 46, 49))
  if (opacity <= 0.01) return null
  return <Html position={[-0.24, 1.72, 0.18]} center distanceFactor={8.3} transform sprite occlude={false} zIndexRange={[42, 0]}>
    <div className="late-work-data-card" style={{ opacity, transform: `translateY(${5 - opacity * 5}px) scale(${0.58 + opacity * 0.04})` }}>
      <div className="late-work-card-topbar"><span>你的最近 90 天产出数据</span><i>Personal Baseline</i></div>
      <section className="late-work-metric-list">
        <p><b>凌晨 0 点后产出</b><strong>第二天返工率 78%</strong></p>
        <p><b>凌晨改方案</b><strong>第二天大改率 84%</strong></p>
        <p><b>凌晨发邮件</b><strong>第二天后悔率 67%</strong></p>
      </section>
      <section className="late-work-positive-list">
        <p><b>最佳产出时段</b><span>早晨 09:00-11:00</span></p>
        <p><b>当前方案完成度</b><span>92% · 剩余 8% 明早 30 分钟可完成</span></p>
      </section>
    </div>
  </Html>
}

function Scene7ArrangeCard({ time }: { time: number }) {
  const opacity = smoothStep(time, 18.0, 19.2) * (time < 47 ? 1 : 1 - smoothStep(time, 47, 50))
  if (opacity <= 0.01) return null
  return <Html position={[0.72, 1.58, 0.24]} center distanceFactor={8.3} transform sprite occlude={false} zIndexRange={[40, 0]}>
    <div className="late-work-arrange-card" style={{ opacity, transform: `translateY(${5 - opacity * 5}px) scale(${0.6 + opacity * 0.04})` }}>
      <div className="late-work-card-topbar"><span>已为你安排好</span><i>Auto Scheduled</i></div>
      <div className="late-work-action-row"><b>闹钟与日程</b><span>06:30 柔和铃声 · 07:00-07:30 完成最后 8%</span></div>
      <div className="late-work-action-row"><b>邮件定时发送</b><span>Q3 增长讨论 · 终稿 · 明日 09:00 · 待早起确认</span></div>
      <div className="late-work-action-row"><b>Slack 睡眠模式</b><span>持续至明日 08:00 · 紧急绕过:老板 + 小雨</span></div>
    </div>
  </Html>
}

function Scene7DeviceStatus({ time }: { time: number }) {
  const lampOpacity = visibilityBetween(time, 22.5, 38.0, 0.45)
  const sleepOpacity = visibilityBetween(time, 25.0, 41.0, 0.45)
  return <>
    {lampOpacity > 0.01 && <Html position={[1.02, 1.1, -0.48]} center distanceFactor={7.2} transform sprite occlude={false} zIndexRange={[35, 0]}>
      <div className="object-label object-label--action object-label--right" style={{ opacity: lampOpacity }}>
        <strong>智能台灯</strong>
        冷白 5500K -&gt; 暖橙 2700K | 亮度 80% -&gt; 30%
      </div>
    </Html>}
    {sleepOpacity > 0.01 && <Html position={[0.38, 1.88, -0.02]} center distanceFactor={7.6} transform sprite occlude={false} zIndexRange={[34, 0]}>
      <div className="late-work-sleep-pill" style={{ opacity: sleepOpacity, transform: `translateY(${4 - sleepOpacity * 4}px) scale(${0.9 + sleepOpacity * 0.05})` }}>
        <strong>Slack 睡眠模式</strong>
        <span>已开启 · 持续至明日 08:00</span>
      </div>
    </Html>}
  </>
}

function Scene7LampWarmth({ time }: { time: number }) {
  const warm = smoothStep(time, 22, 31)
  const glow = 0.08 + warm * (0.58 + pulse(time, 1.4) * 0.08)
  return <group>
    <pointLight intensity={warm * 2.2} distance={2.2} position={[1.32, 1.18, -0.62]} color={WARM_GLOW} />
    {warm > 0.01 && <mesh position={[1.15, 0.92, -0.38]} rotation={[-0.35, 0, 0]} scale={[0.52, 0.04, 0.34]}>
      <sphereGeometry args={[1, 32, 16]} />
      <meshBasicMaterial color={WARM_GLOW} transparent opacity={glow} depthWrite={false} />
    </mesh>}
    <LineBox position={[0.42, 1.34, -1.92]} scale={[1.75, 0.84, 0.028]} color="#071421" edge={SOFT_EDGE} opacity={0.22} emissive={ACTIVE_BLUE} emissiveIntensity={0.02} />
    {[-0.18, 0.2, 0.68, 1.12].map((x, index) => <LineBox key={`scene7-city-${index}`} position={[x, 1.18 + (index % 2) * 0.18, -1.88]} scale={[0.08, 0.18, 0.018]} color="#142033" edge={ACTIVE_BLUE} opacity={0.2} emissive={ACTIVE_BLUE} emissiveIntensity={0.035 + pulse(time + index, 0.8) * 0.02} />)}
  </group>
}

function Scene7ClosingLaptop({ time }: { time: number }) {
  const done = smoothStep(time, 38, 43)
  if (done <= 0.01) return null
  return <group position={[-0.42, 1.04, -0.12]} rotation={[0, 0.28, -0.95 * done]}>
    <LineBox position={[0, 0.06, 0]} scale={[0.34, 0.018, 0.22]} color="#101721" edge={WHITE_EDGE} opacity={0.28 + done * 0.34} emissive={ACTIVE_BLUE} emissiveIntensity={0.02 * (1 - done)} />
  </group>
}

function Scene7LateWorkMotion({ time }: { time: number }) {
  return <group>
    <Scene7LampWarmth time={time} />
    <EvansBrooch time={time} warm={time > 38} />
    <AnimatedRoute route={{ to: [-0.24, 1.72, 0.18], via: [-0.38, 1.5, 0.32], start: 7.2, end: 9.0, holdUntil: 16.0, color: MAIN_BLUE, width: 0.007 }} time={time} />
    <AnimatedRoute route={{ to: [0.62, 1.68, 0.24], via: [0.3, 1.58, 0.3], start: 16.0, end: 18.0, holdUntil: 31.0, color: MAIN_BLUE, width: 0.007 }} time={time} />
    <AnimatedRoute route={{ to: [0.82, 1.48, 0.26], via: [0.48, 1.42, 0.42], start: 18.2, end: 20.2, holdUntil: 32.0, color: MAIN_BLUE, width: 0.007 }} time={time} />
    <AnimatedRoute route={{ to: [1.02, 1.1, -0.48], via: [0.62, 1.34, -0.16], start: 21.5, end: 24.0, holdUntil: 37.0, color: ACTIVE_BLUE, width: 0.005 }} time={time} />
    <AnimatedRoute route={{ to: [0.38, 1.88, -0.02], via: [0.2, 1.64, 0.12], start: 23.6, end: 25.6, holdUntil: 38.0, color: ACTIVE_BLUE, width: 0.005 }} time={time} />
    <Scene7DataCard time={time} />
    <Scene7ArrangeCard time={time} />
    <Scene7DeviceStatus time={time} />
    <Scene7DialogueLayer time={time} />
    <Scene7ClosingLaptop time={time} />
  </group>
}

function Panels({ panels, time }: { panels: ScenePanel[]; time: number }) { return <>{panels.map(panel => { const opacity = visibilityBetween(time, panel.start, panel.end); if (opacity <= 0.01) return null; return <Html key={panel.id} position={panel.position} center distanceFactor={panel.variant === 'main' ? 8.8 : 8.2} transform sprite occlude={false} zIndexRange={[panel.variant === 'main' ? 42 : 38, 0]}><div className={`scripted-panel scripted-panel--${panel.variant ?? 'side'}`} style={{ opacity, transform: `translateY(${5 - opacity * 5}px) scale(${0.76 + opacity * 0.07})` }}><div className="scripted-panel-topbar"><span>{panel.title}</span>{panel.subtitle && <i>{panel.subtitle}</i>}</div>{panel.lines.map((line, index) => <p key={`${panel.id}-${index}`}>{line}</p>)}</div></Html> })}</> }
function Dialogues({ dialogues, time }: { dialogues: SceneDialogue[]; time: number }) { return <>{dialogues.map(entry => { const opacity = visibilityBetween(time, entry.start, entry.end); if (opacity <= 0.01) return null; return <Html key={`${entry.title}-${entry.start}`} position={entry.position ?? [-0.46, entry.kind === 'person' ? 1.58 : 1.72, 0.86]} center distanceFactor={7.8} transform sprite occlude={false} zIndexRange={[39, 0]}><div className={`object-label object-label--${entry.kind} scripted-dialog`} style={{ opacity, transform: `translateY(${8 - opacity * 8}px) scale(${0.94 + opacity * 0.06})` }}><strong>{entry.title}</strong><span>{entry.body}</span></div></Html> })}</> }
function SceneContent({ config, time }: { config: ScriptedSceneConfig; time: number }) { return <><Environment kind={config.environment} />{config.showPerson !== false && <Person time={time} pose={config.pose} broochMode={config.broochMode} />}{!config.disableEnvironmentMotion && config.environment === 'asset-scene6' && <><EvansBrooch time={time} warm={time > 28} /><Scene6DispatchMotion time={time} /></>}{!config.disableEnvironmentMotion && config.environment === 'asset-late-work' && <Scene7LateWorkMotion time={time} />}<group>{config.routes.map((route, index) => <AnimatedRoute key={index} route={route} time={time} />)}<Panels panels={config.panels} time={time} /><Dialogues dialogues={config.dialogues} time={time} /></group></> }
function AnimatedScene({ config, time }: { config: ScriptedSceneConfig; time: number }) {
  const firstFrame = config.camera?.[0] ?? { position: new THREE.Vector3(2.55, 2.1, 3.1), look: new THREE.Vector3(0, 1.16, 0.18), zoom: 122, at: 0 }
  const controlsEnabled = config.enableOrbitControls === true

  return <>
    <color attach="background" args={['#05080d']} />
    <fog attach="fog" args={['#05080d', 5.6, 11.5]} />
    <OrthographicCamera makeDefault position={firstFrame.position.toArray()} zoom={firstFrame.zoom} />
    {controlsEnabled ? <StaticCameraLookAt frame={firstFrame} /> : <CameraMotion time={time} cameraFrames={config.camera} />}
    <ambientLight intensity={0.42} />
    <hemisphereLight intensity={0.26} color="#d8e6ff" groundColor="#080604" />
    <directionalLight castShadow intensity={1.05} position={[4.2, 6.8, 4.6]} shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
    <spotLight castShadow intensity={6.2} angle={0.46} penumbra={0.84} position={[0.4, 3.6, 2.0]} color="#dcecff" />
    <pointLight intensity={0.9} distance={2.2} position={[BROOCH.x, BROOCH.y, BROOCH.z]} color={ACTIVE_BLUE} />
    <group rotation={[0, -0.06, 0]}><SceneContent config={config} time={time} /></group>
    <ContactShadows position={[0, 0.02, 0]} opacity={0.58} scale={9} blur={2.35} far={6} color="#000000" />
    <OrbitControls
      enabled={controlsEnabled}
      enablePan={false}
      enableZoom={controlsEnabled}
      enableRotate={controlsEnabled}
      minZoom={45}
      maxZoom={220}
      target={firstFrame.look.toArray()}
    />
  </>
}
export function ScriptedSceneExperience({ config }: { config: ScriptedSceneConfig }) { const time = useStoryClock(config.duration); return <section className="interior-shell" aria-label={config.ariaLabel}><Canvas shadows dpr={[1, 2]}><Suspense fallback={null}><AnimatedScene config={config} time={time} /></Suspense></Canvas></section> }
