import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Edges, Html, OrbitControls, OrthographicCamera } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import '../../App.css'

export type Vec3 = [number, number, number]
export type EnvironmentKind = 'kitchen' | 'living' | 'study' | 'balcony' | 'city-link' | 'choice-room'
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

const ACTIVE_BLUE = '#9ed8ff'
const MAIN_BLUE = '#3f73ff'
const WARM_GLOW = '#ffd49a'
const WHITE_EDGE = '#eef1f6'
const SOFT_EDGE = '#77818f'
const MUTED_EDGE = '#46515e'
const BROOCH = new THREE.Vector3(0.03, 1.22, 0.38)

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
function LineCylinder({ position, args, rotation = [0, 0, 0], color = '#101721', edge = WHITE_EDGE, opacity = 0.72, emissive = '#000', emissiveIntensity = 0 }: { position: Vec3; args: [number, number, number, number]; rotation?: Vec3; color?: string; edge?: string; opacity?: number; emissive?: string; emissiveIntensity?: number }) { return <mesh position={position} rotation={rotation} castShadow receiveShadow><cylinderGeometry args={args} /><meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} roughness={0.8} transparent opacity={opacity} /><Edges color={edge} threshold={10} /></mesh> }

function EvansBrooch({ time, warm = false }: { time: number; warm?: boolean }) { const color = new THREE.Color(ACTIVE_BLUE).lerp(new THREE.Color(WARM_GLOW), warm ? 0.72 : 0).getStyle(); return <group position={[BROOCH.x, BROOCH.y, BROOCH.z]} rotation={[Math.PI / 2, 0, 0]}><mesh><torusGeometry args={[0.05, 0.004, 10, 36]} /><meshBasicMaterial color={color} transparent opacity={0.76} /></mesh><mesh position={[0, 0, 0.006]}><sphereGeometry args={[0.027, 18, 12]} /><meshStandardMaterial color="#101722" emissive={color} emissiveIntensity={0.42 + pulse(time, 2.4) * 0.26} roughness={0.55} /></mesh></group> }

function Person({ time, pose, broochMode = 'normal' }: { time: number; pose: PoseKind; broochMode?: ScriptedSceneConfig['broochMode'] }) {
  const seated = pose === 'seated-desk' || pose === 'seated-sofa'
  const child = pose === 'standing-child'
  const scale = child ? 0.72 : 1
  const showBrooch = broochMode === 'normal' || (broochMode === 'delayed' && time >= 30)
  return <group scale={[scale, scale, scale]} position={child ? [0.42, 0, 0.22] : [0, 0, 0.18]}>
    <LineCylinder position={[0, seated ? 0.74 : 0.78, 0]} args={[0.16, 0.21, seated ? 0.72 : 0.88, 18]} color="#151b22" edge={WHITE_EDGE} opacity={0.58} />
    <LineCylinder position={[0, seated ? 1.18 : 1.36, 0]} args={[0.15, 0.13, 0.22, 18]} color="#171d25" edge={WHITE_EDGE} opacity={0.62} />
    <LineCylinder position={[-0.09, 0.28, 0]} args={[0.045, 0.05, seated ? 0.42 : 0.58, 12]} color="#111821" edge={SOFT_EDGE} opacity={0.58} />
    <LineCylinder position={[0.09, 0.28, 0]} args={[0.045, 0.05, seated ? 0.42 : 0.58, 12]} color="#111821" edge={SOFT_EDGE} opacity={0.58} />
    <LineCylinder position={[-0.2, seated ? 0.78 : 0.9, 0.12]} rotation={[0.65, 0, -0.18]} args={[0.035, 0.04, 0.55, 12]} color="#111821" edge={SOFT_EDGE} opacity={0.5} />
    <LineCylinder position={[0.18, seated ? 0.78 : 0.88, 0.18]} rotation={[0.9, 0, 0.25]} args={[0.035, 0.04, 0.52, 12]} color="#111821" edge={SOFT_EDGE} opacity={0.5} />
    {(pose === 'standing-phone' || pose === 'quiet-standing') && <LineBox position={[0.26, 0.78, 0.32]} scale={[0.11, 0.18, 0.018]} rotation={[0.15, 0.08, -0.14]} color="#06111f" edge={ACTIVE_BLUE} opacity={0.42} emissive={ACTIVE_BLUE} emissiveIntensity={0.08} />}
    {showBrooch && <EvansBrooch time={time} warm={time > 26} />}
  </group>
}

function Environment({ kind }: { kind: EnvironmentKind }) {
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.25]} receiveShadow><planeGeometry args={[7.4, 4.8]} /><meshStandardMaterial color="#05080d" roughness={0.86} /><Edges color={MUTED_EDGE} threshold={5} /></mesh>
    <LineBox position={[0, 1.35, -2.32]} scale={[7.4, 2.7, 0.12]} color="#060910" edge={MUTED_EDGE} opacity={0.28} />
    <LineBox position={[-3.62, 1.25, -0.28]} scale={[0.12, 2.5, 4.3]} color="#060910" edge={MUTED_EDGE} opacity={0.18} />
    {(kind === 'kitchen' || kind === 'balcony') && <LineBox position={[-1.9, 1.45, -2.05]} scale={[1.3, 0.72, 0.04]} color="#0b1821" edge={SOFT_EDGE} opacity={0.28} emissive={ACTIVE_BLUE} emissiveIntensity={0.02} />}
    {kind === 'kitchen' && <><LineBox position={[0.1, 0.86, 0.18]} scale={[2.0, 0.14, 0.8]} color="#111923" edge={SOFT_EDGE} opacity={0.38} /><LineBox position={[-0.58, 1.02, 0.06]} scale={[0.22, 0.05, 0.16]} color="#d6b36f" edge="#d6b36f" opacity={0.42} /><LineCylinder position={[0.62, 1.02, 0.12]} args={[0.08, 0.07, 0.16, 20]} color="#111923" edge={WHITE_EDGE} opacity={0.48} /></>}
    {kind === 'living' && <><LineBox position={[0.05, 0.42, 0.34]} scale={[1.7, 0.36, 0.72]} color="#111923" edge={SOFT_EDGE} opacity={0.42} /><LineBox position={[-0.85, 0.78, -0.4]} scale={[0.42, 1.25, 0.42]} color="#101721" edge={SOFT_EDGE} opacity={0.28} /></>}
    {kind === 'study' && <><LineBox position={[0, 0.9, 0.04]} scale={[2.56, 0.1, 1.16]} opacity={0.26} edge={SOFT_EDGE} /><LineBox position={[0.18, 1.18, -0.26]} scale={[0.56, 0.31, 0.012]} color="#071421" edge={ACTIVE_BLUE} opacity={0.36} emissive={ACTIVE_BLUE} emissiveIntensity={0.1} /></>}
    {kind === 'city-link' && <><LineBox position={[-1.45, 0.88, 0.26]} scale={[1.1, 0.08, 0.68]} color="#111923" edge={SOFT_EDGE} opacity={0.34} /><LineBox position={[1.55, 0.88, 0.26]} scale={[1.1, 0.08, 0.68]} color="#111923" edge={SOFT_EDGE} opacity={0.34} /><LineBox position={[0, 1.7, -2.05]} scale={[3.4, 0.74, 0.04]} color="#08131c" edge={MUTED_EDGE} opacity={0.24} /></>}
    {kind === 'choice-room' && <><LineBox position={[-0.9, 0.72, 0.18]} scale={[0.86, 0.48, 0.58]} color="#111923" edge={SOFT_EDGE} opacity={0.34} /><LineBox position={[0.9, 0.72, 0.18]} scale={[0.86, 0.48, 0.58]} color="#111923" edge={SOFT_EDGE} opacity={0.34} /></>}
  </group>
}

function SegmentTube({ start, end, width, opacity, color }: { start: THREE.Vector3; end: THREE.Vector3; width: number; opacity: number; color: string }) { const geometry = useMemo(() => new THREE.TubeGeometry(new THREE.LineCurve3(start, end), 18, width, 6, false), [end, start, width]); return <mesh geometry={geometry}><meshBasicMaterial color={color} transparent opacity={opacity} /></mesh> }
function AnimatedRoute({ route, time }: { route: SceneRoute; time: number }) { const end = new THREE.Vector3(...route.to); const points = [BROOCH, route.via ? new THREE.Vector3(...route.via) : BROOCH.clone().lerp(end, 0.5).add(new THREE.Vector3(0, 0.35, 0)), end]; const progress = clamp01((time - route.start) / (route.end - route.start)); const visibility = smoothStep(time, route.start, route.start + 0.35) * (1 - smoothStep(time, route.holdUntil, route.holdUntil + 0.65)); const lengths = useMemo(() => { let total = 0; const segments = points.slice(0, -1).map((p, i) => { const l = p.distanceTo(points[i + 1]); total += l; return l }); return { segments, total } }, [points]); const movingPoint = getPathPoint(points, progress); if (visibility <= 0.01 || progress <= 0.01 || lengths.total <= 0.001) return null; let drawn = progress * lengths.total; return <group>{points.slice(0, -1).map((p, i) => { const l = lengths.segments[i]; const amount = clamp01(drawn / l); drawn -= l; if (amount <= 0) return null; return <SegmentTube key={i} start={p} end={p.clone().lerp(points[i + 1], amount)} width={route.width ?? 0.005} opacity={0.08 + visibility * 0.55} color={route.color ?? ACTIVE_BLUE} /> })}<mesh position={[movingPoint.x, movingPoint.y, movingPoint.z]}><sphereGeometry args={[(route.width ?? 0.005) * 3.8, 14, 10]} /><meshBasicMaterial color={route.color ?? ACTIVE_BLUE} transparent opacity={0.58 + pulse(time, 8.5) * 0.32} /></mesh></group> }

function Panels({ panels, time }: { panels: ScenePanel[]; time: number }) { return <>{panels.map(panel => { const opacity = visibilityBetween(time, panel.start, panel.end); if (opacity <= 0.01) return null; return <Html key={panel.id} position={panel.position} center distanceFactor={panel.variant === 'main' ? 8.8 : 8.2} transform sprite occlude={false} zIndexRange={[panel.variant === 'main' ? 42 : 38, 0]}><div className={`scripted-panel scripted-panel--${panel.variant ?? 'side'}`} style={{ opacity, transform: `translateY(${5 - opacity * 5}px) scale(${0.76 + opacity * 0.07})` }}><div className="scripted-panel-topbar"><span>{panel.title}</span>{panel.subtitle && <i>{panel.subtitle}</i>}</div>{panel.lines.map((line, index) => <p key={`${panel.id}-${index}`}>{line}</p>)}</div></Html> })}</> }
function Dialogues({ dialogues, time }: { dialogues: SceneDialogue[]; time: number }) { return <>{dialogues.map(entry => { const opacity = visibilityBetween(time, entry.start, entry.end); if (opacity <= 0.01) return null; return <Html key={`${entry.title}-${entry.start}`} position={entry.position ?? [-0.46, entry.kind === 'person' ? 1.58 : 1.72, 0.86]} center distanceFactor={7.8} transform sprite occlude={false} zIndexRange={[39, 0]}><div className={`object-label object-label--${entry.kind} scripted-dialog`} style={{ opacity, transform: `translateY(${8 - opacity * 8}px) scale(${0.94 + opacity * 0.06})` }}><strong>{entry.title}</strong><span>{entry.body}</span></div></Html> })}</> }
function SceneContent({ config, time }: { config: ScriptedSceneConfig; time: number }) { return <><Environment kind={config.environment} /><Person time={time} pose={config.pose} broochMode={config.broochMode} /><group>{config.routes.map((route, index) => <AnimatedRoute key={index} route={route} time={time} />)}<Panels panels={config.panels} time={time} /><Dialogues dialogues={config.dialogues} time={time} /></group></> }
function AnimatedScene({ config, time }: { config: ScriptedSceneConfig; time: number }) { return <><color attach="background" args={['#05080d']} /><fog attach="fog" args={['#05080d', 5.6, 11.5]} /><OrthographicCamera makeDefault position={[2.55, 2.1, 3.1]} zoom={122} /><CameraMotion time={time} cameraFrames={config.camera} /><ambientLight intensity={0.42} /><hemisphereLight intensity={0.26} color="#d8e6ff" groundColor="#080604" /><directionalLight castShadow intensity={1.05} position={[4.2, 6.8, 4.6]} shadow-mapSize-width={2048} shadow-mapSize-height={2048} /><spotLight castShadow intensity={6.2} angle={0.46} penumbra={0.84} position={[0.4, 3.6, 2.0]} color="#dcecff" /><pointLight intensity={0.9} distance={2.2} position={[BROOCH.x, BROOCH.y, BROOCH.z]} color={ACTIVE_BLUE} /><group rotation={[0, -0.06, 0]}><SceneContent config={config} time={time} /></group><ContactShadows position={[0, 0.02, 0]} opacity={0.58} scale={9} blur={2.35} far={6} color="#000000" /><OrbitControls enabled={false} enablePan={false} enableZoom={false} enableRotate={false} target={[0, 1.18, 0.15]} /></> }
function SceneOverlay({ time, duration }: { time: number; duration: number }) { return <div className="story-progress"><i style={{ width: `${(time / duration) * 100}%` }} /></div> }
export function ScriptedSceneExperience({ config }: { config: ScriptedSceneConfig }) { const time = useStoryClock(config.duration); return <section className="interior-shell" aria-label={config.ariaLabel}><Canvas shadows dpr={[1, 2]}><Suspense fallback={null}><AnimatedScene config={config} time={time} /></Suspense></Canvas><SceneOverlay time={time} duration={config.duration} /></section> }
export { ACTIVE_BLUE, MAIN_BLUE, WARM_GLOW }
