import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  ContactShadows,
  Edges,
  Html,
  OrbitControls,
  OrthographicCamera,
} from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import '../App.css'

type Vec3 = [number, number, number]

const STORY_DURATION = 36
const WHITE_EDGE = '#eef1f6'
const UI_BLUE = '#8fd2ff'
const ACTIVE_BLUE = UI_BLUE
const GLASS_BLUE = '#9ed8ff'

const BROOCH_POINT = new THREE.Vector3(0, 1.56, -0.82)
const TARGETS = {
  monitor: new THREE.Vector3(0.03, 1.43, -0.24),
  phone: new THREE.Vector3(-0.88, 0.96, 0.32),
  headset: new THREE.Vector3(0.9, 0.94, 0.34),
  handle: new THREE.Vector3(1.85, 1.07, -3.06),
}

function smoothStep(value: number, start: number, end: number) {
  const x = Math.min(1, Math.max(0, (value - start) / (end - start)))
  return x * x * (3 - 2 * x)
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
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

function cameraMix(time: number, keyframes: Array<{ at: number; position: Vec3; look: Vec3; zoom: number }>) {
  const currentIndex = Math.max(0, keyframes.findIndex((frame, index) => {
    const next = keyframes[index + 1]
    return next ? time >= frame.at && time < next.at : time >= frame.at
  }))
  const current = keyframes[currentIndex]
  const next = keyframes[Math.min(currentIndex + 1, keyframes.length - 1)]
  const blend = current === next ? 0 : smoothStep(time, current.at, next.at)

  return {
    position: new THREE.Vector3(...current.position).lerp(new THREE.Vector3(...next.position), blend),
    look: new THREE.Vector3(...current.look).lerp(new THREE.Vector3(...next.look), blend),
    zoom: current.zoom + (next.zoom - current.zoom) * blend,
  }
}

function CameraMotion({ time }: { time: number }) {
  const { camera } = useThree()
  const lookAt = useRef(new THREE.Vector3(0, 1.1, -0.6))
  const keyframes = useMemo(
    () => [
      { at: 0, position: [1.1, 1.0, 2.95] as Vec3, look: [-0.95, 0.92, 0.35] as Vec3, zoom: 100 },
      { at: 4.4, position: [1.48, 1.36, 2.18] as Vec3, look: [-0.15, 1.2, -0.05] as Vec3, zoom: 112 },
      { at: 7.2, position: [1.72, 1.88, 1.82] as Vec3, look: [0, 1.5, -0.78] as Vec3, zoom: 138 },
      { at: 9.2, position: [1.35, 1.72, 1.34] as Vec3, look: [0, 1.45, -0.28] as Vec3, zoom: 152 },
      { at: 11.4, position: [-0.6, 1.62, 1.44] as Vec3, look: [-0.88, 0.96, 0.32] as Vec3, zoom: 158 },
      { at: 13.6, position: [1.72, 1.48, 1.24] as Vec3, look: [0.9, 0.94, 0.34] as Vec3, zoom: 156 },
      { at: 15.8, position: [3.25, 2.18, 1.28] as Vec3, look: [1.85, 1.07, -3.06] as Vec3, zoom: 104 },
      { at: 20.5, position: [3.05, 4.6, 3.4] as Vec3, look: [0.04, 1.08, -0.64] as Vec3, zoom: 82 },
      { at: 28.0, position: [4.6, 2.7, 3.2] as Vec3, look: [0.2, 1.18, -0.92] as Vec3, zoom: 74 },
      { at: 35.6, position: [4.6, 2.7, 3.2] as Vec3, look: [0.2, 1.18, -0.92] as Vec3, zoom: 74 },
    ],
    [],
  )

  useFrame((_, delta) => {
    const pose = cameraMix(time, keyframes)
    const ease = 1 - Math.exp(-delta * 2.7)

    camera.position.lerp(pose.position, ease)
    lookAt.current.lerp(pose.look, ease)
    camera.zoom += (pose.zoom - camera.zoom) * ease
    camera.lookAt(lookAt.current)
    camera.updateProjectionMatrix()
  })

  return null
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
        roughness={0.74}
        metalness={0.02}
        transparent={opacity < 1}
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
        roughness={0.78}
        transparent={opacity < 1}
        opacity={opacity}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
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

function GlowingConnection({
  from,
  to,
  time,
  start,
  end,
  lift = 0.24,
}: {
  from: THREE.Vector3
  to: THREE.Vector3
  time: number
  start: number
  end: number
  lift?: number
}) {
  const progress = clamp01((time - start) / (end - start))
  const fade = smoothStep(time, start, start + 0.35)
  const visible = progress > 0.01
  const endPoint = useMemo(() => from.clone().lerp(to, progress), [from, to, progress])
  const geometry = useMemo(() => {
    const control = from.clone().lerp(endPoint, 0.5)
    control.y += lift
    const curve = new THREE.CatmullRomCurve3([from.clone(), control, endPoint.clone()])
    return new THREE.TubeGeometry(curve, 48, 0.009, 8, false)
  }, [endPoint, from, lift])

  if (!visible) return null

  return (
    <group>
      <mesh geometry={geometry}>
        <meshBasicMaterial color={ACTIVE_BLUE} transparent opacity={0.26 + fade * 0.44} />
      </mesh>
      <LineSphere
        position={[endPoint.x, endPoint.y, endPoint.z]}
        scale={[0.036, 0.036, 0.036]}
        color={ACTIVE_BLUE}
        edge={ACTIVE_BLUE}
        emissive={ACTIVE_BLUE}
        emissiveIntensity={0.72}
        opacity={0.84}
      />
    </group>
  )
}

function EvansBrooch({ time }: { time: number }) {
  const glow = smoothStep(time, 6.8, 8.0)

  return (
    <group>
      <LineSphere
        position={[BROOCH_POINT.x, BROOCH_POINT.y, BROOCH_POINT.z]}
        scale={[0.052, 0.052, 0.052]}
        color="#101722"
        edge={ACTIVE_BLUE}
        emissive={ACTIVE_BLUE}
        emissiveIntensity={0.55 + glow * 1.15}
        opacity={0.96}
      />
      <mesh position={[BROOCH_POINT.x, BROOCH_POINT.y, BROOCH_POINT.z]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.17 + glow * 0.05, 0.004, 8, 56]} />
        <meshBasicMaterial color={ACTIVE_BLUE} transparent opacity={0.12 + glow * 0.22} />
      </mesh>
      <Html position={[0.16, 1.72, -0.76]} center distanceFactor={7} transform sprite occlude={false}>
        <div className="object-label object-label--person">
          <strong>EVANS PIN</strong>
          <span>稳定蓝点 · 待入会</span>
        </div>
      </Html>
    </group>
  )
}

function OfficePerson() {
  return (
    <group position={[0, 0, -1.02]}>
      <LineCylinder position={[-0.18, 0.48, 0]} args={[0.065, 0.09, 0.9, 14]} color="#10131a" edge={WHITE_EDGE} />
      <LineCylinder position={[0.18, 0.48, 0]} args={[0.065, 0.09, 0.9, 14]} color="#10131a" edge={WHITE_EDGE} />
      <LineBox position={[0, 1.08, 0]} scale={[0.54, 0.76, 0.22]} color="#171b22" edge={WHITE_EDGE} opacity={0.94} />
      <LineBox position={[-0.43, 1.1, 0.02]} scale={[0.14, 0.66, 0.14]} color="#12161d" edge={WHITE_EDGE} rotation={[0, 0, -0.12]} />
      <LineBox position={[0.43, 1.1, 0.02]} scale={[0.14, 0.66, 0.14]} color="#12161d" edge={WHITE_EDGE} rotation={[0, 0, 0.12]} />
      <LineSphere position={[0, 1.72, 0.02]} scale={[0.24, 0.28, 0.22]} color="#1b1c20" edge={WHITE_EDGE} />
      <LineBox position={[0, 1.39, 0.13]} scale={[0.18, 0.07, 0.035]} color="#eef1f6" edge={WHITE_EDGE} opacity={0.82} />
      <Html position={[-0.62, 1.86, 0.04]} center distanceFactor={7.5} transform sprite occlude={false}>
        <div className="object-label object-label--person object-label--right">
          <strong>李明</strong>
          <span>站在工位前 · 完全静止</span>
        </div>
      </Html>
    </group>
  )
}

function MonitorScreen({ time }: { time: number }) {
  const ui = smoothStep(time, 8.7, 10.2)

  return (
    <group>
      <LineBox position={[0, 1.16, -0.3]} scale={[0.16, 0.46, 0.08]} color="#0b0d12" edge={WHITE_EDGE} />
      <LineBox position={[0, 0.91, -0.3]} scale={[0.56, 0.06, 0.32]} color="#0b0d12" edge={WHITE_EDGE} />
      <LineBox
        position={[0, 1.47, -0.28]}
        scale={[1.18, 0.68, 0.08]}
        color="#09121a"
        edge={ACTIVE_BLUE}
        opacity={0.94}
        emissive={ACTIVE_BLUE}
        emissiveIntensity={0.1 + ui * 0.18}
      />
      <LineBox position={[0, 1.47, -0.225]} scale={[0.94, 0.42, 0.018]} color="#061018" edge={ACTIVE_BLUE} opacity={0.82} emissive={ACTIVE_BLUE} emissiveIntensity={0.16 + ui * 0.28} />
      <Html position={[0, 1.49, -0.17]} center distanceFactor={5.2} transform sprite occlude={false}>
        <div className="screen-ui screen-ui--monitor" style={{ opacity: 0.45 + ui * 0.55 }}>
          <div className="screen-ui__top"><span>WORK HUB</span><i>DISPLAY ANCHOR</i></div>
          <div className="screen-ui__grid">
            <b>邮件流</b>
            <b>Slack 流</b>
            <b>文档流</b>
            <b>日历流</b>
          </div>
          <p>非实体内容只贴附在显示器 UI 周围</p>
        </div>
      </Html>
    </group>
  )
}

function PhoneDevice({ time }: { time: number }) {
  const ui = smoothStep(time, 10.8, 12.2)

  return (
    <group position={[-0.88, 0.9, 0.32]} rotation={[0, -0.4, 0.04]}>
      <LineBox position={[0, 0.04, 0]} scale={[0.34, 0.05, 0.58]} color="#080c12" edge={ACTIVE_BLUE} opacity={0.92} emissive={ACTIVE_BLUE} emissiveIntensity={0.08 + ui * 0.12} />
      <LineBox position={[0, 0.075, 0]} scale={[0.25, 0.012, 0.42]} color="#071018" edge={ACTIVE_BLUE} opacity={0.84} emissive={ACTIVE_BLUE} emissiveIntensity={0.12 + ui * 0.2} />
      <Html position={[0, 0.16, 0.02]} center distanceFactor={4.6} transform sprite occlude={false}>
        <div className="screen-ui screen-ui--phone" style={{ opacity: 0.35 + ui * 0.65 }}>
          <div className="screen-ui__top"><span>MOBILE</span><i>REAL DEVICE</i></div>
          <p>长期记忆 · 通知摘要 · 会议提醒</p>
        </div>
      </Html>
    </group>
  )
}

function Headphones() {
  return (
    <group position={[0.9, 0.91, 0.34]} rotation={[Math.PI / 2, 0.2, -0.08]}>
      <mesh castShadow receiveShadow>
        <torusGeometry args={[0.2, 0.018, 8, 48, Math.PI * 1.2]} />
        <meshStandardMaterial color="#10141b" roughness={0.8} />
        <Edges color={WHITE_EDGE} threshold={10} />
      </mesh>
      <LineBox position={[-0.18, -0.03, 0]} scale={[0.1, 0.08, 0.16]} color="#0b0f15" edge={WHITE_EDGE} />
      <LineBox position={[0.18, -0.03, 0]} scale={[0.1, 0.08, 0.16]} color="#0b0f15" edge={WHITE_EDGE} />
    </group>
  )
}

function CupAndNotebook() {
  return (
    <group>
      <LineCylinder position={[-1.42, 0.99, 0.45]} args={[0.12, 0.1, 0.28, 28]} color="#10151b" edge={WHITE_EDGE} opacity={0.88} />
      <mesh position={[-1.27, 1.02, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.06, 0.008, 8, 24]} />
        <meshStandardMaterial color="#10151b" roughness={0.82} />
        <Edges color={WHITE_EDGE} threshold={10} />
      </mesh>
      <LineBox position={[-0.18, 0.89, 0.48]} scale={[0.58, 0.04, 0.42]} color="#111319" edge={WHITE_EDGE} opacity={0.86} rotation={[0, 0.1, 0]} />
      {[-0.26, -0.1, 0.08].map((x) => (
        <LineBox key={x} position={[x, 0.925, 0.49]} scale={[0.005, 0.01, 0.34]} color="#e9eef6" edge={WHITE_EDGE} opacity={0.62} rotation={[0, 0.1, 0]} />
      ))}
    </group>
  )
}

function OfficeDesk({ time }: { time: number }) {
  return (
    <group>
      <LineBox position={[0, 0.72, 0.12]} scale={[3.8, 0.14, 1.58]} color="#101218" edge={WHITE_EDGE} opacity={0.86} />
      {[-1.62, 1.62].map((x) => (
        <LineBox key={x} position={[x, 0.35, -0.44]} scale={[0.12, 0.7, 0.12]} color="#0a0d12" edge={WHITE_EDGE} opacity={0.8} />
      ))}
      {[-1.62, 1.62].map((x) => (
        <LineBox key={`front-${x}`} position={[x, 0.35, 0.64]} scale={[0.12, 0.7, 0.12]} color="#0a0d12" edge={WHITE_EDGE} opacity={0.8} />
      ))}
      <MonitorScreen time={time} />
      <PhoneDevice time={time} />
      <Headphones />
      <CupAndNotebook />
    </group>
  )
}

function MeetingRoom() {
  return (
    <group>
      <LineBox position={[0, 1.42, -3.22]} scale={[5.8, 2.72, 0.08]} color="#071018" edge={GLASS_BLUE} opacity={0.2} />
      {[-2.4, -1.2, 0, 1.2, 2.4].map((x) => (
        <LineBox key={x} position={[x, 1.42, -3.15]} scale={[0.04, 2.62, 0.08]} color="#0d151a" edge={GLASS_BLUE} opacity={0.58} />
      ))}
      <LineBox position={[0, 1.4, -3.12]} scale={[5.6, 0.04, 0.08]} color="#0d151a" edge={GLASS_BLUE} opacity={0.48} />
      <LineBox position={[1.85, 1.07, -3.05]} scale={[0.2, 0.06, 0.08]} color="#d9e9f6" edge={ACTIVE_BLUE} opacity={0.82} emissive={ACTIVE_BLUE} emissiveIntensity={0.18} />
      <LineBox position={[0.76, 1.0, -3.5]} scale={[1.15, 0.06, 0.54]} color="#0b0d12" edge={WHITE_EDGE} opacity={0.5} />
      {[-0.95, -0.18, 0.48].map((x, index) => (
        <group key={x} position={[x, 0, -3.72]}>
          <LineSphere position={[0, 1.38 + index * 0.03, 0]} scale={[0.13, 0.16, 0.12]} color="#07090d" edge={WHITE_EDGE} opacity={0.35} />
          <LineBox position={[0, 0.92, 0]} scale={[0.26, 0.54, 0.16]} color="#07090d" edge={WHITE_EDGE} opacity={0.28} />
        </group>
      ))}
    </group>
  )
}

function OfficeShell() {
  return (
    <group>
      <LineBox position={[0, -0.04, -0.55]} scale={[7.4, 0.08, 6.4]} color="#06090d" edge={WHITE_EDGE} opacity={0.88} />
      <LineBox position={[0, 1.44, -3.65]} scale={[7.4, 2.96, 0.16]} color="#070a0f" edge={WHITE_EDGE} opacity={0.34} />
      <LineBox position={[-3.62, 1.36, -0.62]} scale={[0.16, 2.72, 6.1]} color="#070a0f" edge={WHITE_EDGE} opacity={0.28} />
      <LineBox position={[3.62, 1.36, -0.62]} scale={[0.16, 2.72, 6.1]} color="#070a0f" edge={WHITE_EDGE} opacity={0.22} />
      {[-2.8, -1.4, 0, 1.4, 2.8].map((x) => (
        <LineBox key={x} position={[x, 0.012, -0.54]} scale={[0.012, 0.018, 5.4]} color="#0a1117" edge="#25303a" opacity={0.46} />
      ))}
      {[-2.4, -1.2, 0, 1.2].map((z) => (
        <LineBox key={z} position={[0, 0.018, z]} scale={[6.4, 0.018, 0.012]} color="#0a1117" edge="#25303a" opacity={0.44} />
      ))}
      <MeetingRoom />
    </group>
  )
}

function ConnectionSystem({ time }: { time: number }) {
  return (
    <group>
      <GlowingConnection from={BROOCH_POINT} to={TARGETS.monitor} time={time} start={8.0} end={9.4} lift={0.18} />
      <GlowingConnection from={BROOCH_POINT} to={TARGETS.phone} time={time} start={10.3} end={11.7} lift={0.2} />
      <GlowingConnection from={BROOCH_POINT} to={TARGETS.headset} time={time} start={12.6} end={14.0} lift={0.18} />
      <GlowingConnection from={BROOCH_POINT} to={TARGETS.handle} time={time} start={14.9} end={16.6} lift={0.54} />
    </group>
  )
}

function OfficeScene({ time }: { time: number }) {
  const focus = smoothStep(time, 8, 18)

  return (
    <>
      <color attach="background" args={['#06090d']} />
      <fog attach="fog" args={['#06090d', 10, 23]} />

      <OrthographicCamera makeDefault position={[1.1, 1.0, 2.95]} zoom={100} />
      <CameraMotion time={time} />

      <ambientLight intensity={0.5 - focus * 0.04} />
      <hemisphereLight intensity={0.34} color="#d8dde8" groundColor="#07100c" />
      <directionalLight castShadow intensity={1.18} position={[4, 7, 5]} shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <spotLight castShadow intensity={10.5} angle={0.44} penumbra={0.82} position={[1.9, 5.2, 2.4]} color="#dbe8ff" />

      <group position={[0, 0, 0]} rotation={[0, -0.06, 0]}>
        <OfficeShell />
        <OfficeDesk time={time} />
        <OfficePerson />
        <EvansBrooch time={time} />
        <ConnectionSystem time={time} />
      </group>

      <ContactShadows position={[0, 0.02, 0]} opacity={0.58} scale={12} blur={2.1} far={8} color="#000000" />
      <OrbitControls enabled={false} enablePan={false} enableZoom={false} enableRotate={false} target={[0, 1.1, -0.6]} />
    </>
  )
}

function StoryOverlay({ time }: { time: number }) {
  const opening = smoothStep(time, 0.6, 1.5) * (1 - smoothStep(time, 5.0, 6.0))
  const brooch = smoothStep(time, 6.8, 8.0) * (1 - smoothStep(time, 10.0, 10.8))
  const chain = smoothStep(time, 10.0, 11.0) * (1 - smoothStep(time, 20.0, 21.0))
  const overhead = smoothStep(time, 20.0, 21.2) * (1 - smoothStep(time, 28.4, 29.4))
  const final = smoothStep(time, 28.5, 30.0) * (1 - smoothStep(time, 35.0, 36.0))

  return (
    <>
      <div className="scene-fade" style={{ opacity: 0.08 + smoothStep(time, 8, 18) * 0.18 }} />

      <div className="cinematic-rail office-rail" style={{ opacity: smoothStep(time, 0.7, 1.4) }}>
        {['桌面低机位', '胸针点亮', '实体连接', '半俯视收束'].map((label, index) => (
          <div key={label} className={`cinematic-step ${time >= [0.8, 6.8, 8.0, 20.0][index] ? 'cinematic-step--active' : ''}`}>
            <i>{String(index + 1).padStart(2, '0')}</i>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="opening-caption opening-caption--park" style={{ opacity: opening }}>
        <span>[01] 静态办公室 · 展览式 3D 建模</span>
        <strong>镜头从桌面低机位推进，掠过水杯、耳机和亮着的显示器；场景内人物与物体全部保持静止。</strong>
      </div>
      <div className="opening-caption opening-caption--hardware" style={{ opacity: brooch }}>
        <span>[02] Evans 胸针亮起</span>
        <strong>李明胸前出现一枚稳定蓝点，蓝线只从胸针出发，并且只落到真实存在的设备或门把手。</strong>
      </div>
      <div className="opening-caption opening-caption--move" style={{ opacity: chain }}>
        <span>[03] 工作链连接</span>
        <strong>电脑显示器、手机、耳机与会议室玻璃门把手依次接入；每个非实体信息流都严格贴附在屏幕 UI 中。</strong>
      </div>
      <div className="top-narration office-top" style={{ opacity: overhead }}>
        <strong>HALF TOP VIEW</strong>
        胸针、电脑、手机、耳机处于同一静态构图，蓝色线路保持低亮连通，形成可视化工作链。
      </div>
      <div className="final-narration" style={{ opacity: final, transform: `translateX(-50%) translateY(${10 - final * 10}px)` }}>
        准备完成，随时进会议。李明、桌面与玻璃会议室仍完全静止，只有连接线路持续低亮。
      </div>

      <div className="story-progress">
        <i style={{ width: `${(time / STORY_DURATION) * 100}%` }} />
      </div>
    </>
  )
}

export function OfficeExperience() {
  const time = useStoryClock()

  return (
    <section className="interior-shell" aria-label="静态办公室 Evans 设备连接三维场景">
      <Canvas shadows dpr={[1, 2]}>
        <OfficeScene time={time} />
      </Canvas>
      <StoryOverlay time={time} />
    </section>
  )
}

export default OfficeExperience
