import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { ContactShadows, Edges, Html, OrbitControls, OrthographicCamera } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Mesh } from 'three'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import '../../App.css'

type Vec3 = [number, number, number]

const WHITE_EDGE = '#eef1f6'
const SOFT_EDGE = '#7c8794'
const MUTED_EDGE = '#68717d'
const ACTIVE_BLUE = '#9ed8ff'
const WARM_WHITE = '#f3f0dd'
const FLOOR_TOP = 0.02
const STORY_DURATION = 46

function wrapTime(time: number) {
  return time % STORY_DURATION
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function smoothStep(value: number, start: number, end: number) {
  const x = clamp01((value - start) / (end - start))
  return x * x * (3 - 2 * x)
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

function visibility(time: number, start: number, end: number) {
  return smoothStep(time, start, start + 0.45) * (1 - smoothStep(time, end - 0.55, end))
}

function CameraMotion({ time }: { time: number }) {
  const { camera } = useThree()
  const lookAt = useRef(new THREE.Vector3(-0.34, 1.16, 0.78))
  const targetPosition = useRef(new THREE.Vector3())
  const targetLookAt = useRef(new THREE.Vector3())
  const frames = useMemo(
    () => [
      { at: 0, position: new THREE.Vector3(3.05, 2.76, 3.72), look: new THREE.Vector3(-0.3, 1.22, 0.86), zoom: 108 },
      { at: 7.6, position: new THREE.Vector3(2.95, 3.34, 4.28), look: new THREE.Vector3(-0.28, 1.78, 0.44), zoom: 100 },
      { at: 21.4, position: new THREE.Vector3(3.32, 2.86, 3.8), look: new THREE.Vector3(0.02, 1.56, 0.66), zoom: 104 },
      { at: 31.2, position: new THREE.Vector3(3.44, 2.72, 3.48), look: new THREE.Vector3(0.02, 1.32, 0.06), zoom: 104 },
      { at: 39.0, position: new THREE.Vector3(3.1, 3.05, 4.08), look: new THREE.Vector3(-0.22, 1.6, 0.46), zoom: 100 },
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
    const ease = 1 - Math.exp(-delta * 2.4)

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
        roughness={0.78}
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

function DialogueBubble({
  position,
  time,
  start,
  end,
  speaker,
  text,
  variant = 'user',
}: {
  position: Vec3
  time: number
  start: number
  end: number
  speaker: string
  text: string
  variant?: 'user' | 'evans' | 'scammer'
}) {
  const show = visibility(time, start, end)

  if (show <= 0.01) return null

  return (
    <Html position={position} center distanceFactor={7.8} transform sprite occlude={false} zIndexRange={[24, 0]}>
      <div
        className={`living-call-dialogue living-call-dialogue--${variant}`}
        style={{
          opacity: show,
          transform: `translateY(${6 - show * 6}px) scale(${0.94 + show * 0.06})`,
        }}
      >
        <strong>{speaker}</strong>
        <span>{text}</span>
      </div>
    </Html>
  )
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
        roughness: 0.84,
        metalness: 0.01,
      })
    })

    meshes.forEach((mesh) => {
      mesh.add(
        new THREE.LineSegments(
          new THREE.EdgesGeometry(mesh.geometry, 16),
          new THREE.LineBasicMaterial({ color: outlineColor }),
        ),
      )
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

function SittingElderOnSofa({ time }: { time: number }) {
  const object = useLoader(OBJLoader, '/models/sitting-man/tripo_convert_32d5344d-740d-4b6c-8fca-9a3c4bb1bd55.obj')
  const { model, outline } = useMemo(() => {
    const clone = object.clone(true)
    const box = new THREE.Box3().setFromObject(clone)
    const center = box.getCenter(new THREE.Vector3())
    const minY = box.min.y
    const meshes: Mesh[] = []

    clone.traverse((child) => {
      const mesh = child as Mesh
      if (!mesh.isMesh) return
      meshes.push(mesh)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.material = new THREE.MeshStandardMaterial({
        color: '#1c2027',
        roughness: 0.86,
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
      mesh.material = new THREE.MeshBasicMaterial({ color: WHITE_EDGE, side: THREE.BackSide })
    })

    return { model: clone, outline: outlineClone }
  }, [object])

  return (
    <group position={[-0.72, 0.4, 1.0]} rotation={[0, Math.PI * 0.5 - 0.08, 0]} scale={[1.22, 1.22, 1.22]}>
      <primitive object={outline} scale={1.012} />
      <primitive object={model} />
      <WarningBrooch time={time} />
    </group>
  )
}

function WarningBrooch({ time }: { time: number }) {
  const finish = smoothStep(time, 39.5, 43.0)
  const activeColor = new THREE.Color(ACTIVE_BLUE).lerp(new THREE.Color(WARM_WHITE), finish).getStyle()
  const ringOpacity = 0.24 + (1 - finish) * (0.38 + pulse(time, 2.2) * 0.22)

  return (
    <group position={[-0.06, 0.82, 0.19]} rotation={[Math.PI, 0, 0]}>
      <mesh position={[0, 0, -0.004]} scale={[1.18, 1.18, 0.18]}>
        <cylinderGeometry args={[0.082, 0.082, 0.006, 32]} />
        <meshStandardMaterial color="#070b10" roughness={0.88} metalness={0.02} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.074, 0.006, 10, 32]} />
        <meshBasicMaterial color={activeColor} transparent opacity={0.88} />
      </mesh>
      <LineSphere
        position={[0, 0, 0.006]}
        scale={[0.034, 0.034, 0.012]}
        color="#2a2412"
        edge={activeColor}
        emissive={activeColor}
        emissiveIntensity={0.72 - finish * 0.32}
      />
      <mesh rotation={[0, 0, 0.38]}>
        <torusGeometry args={[0.112, 0.003, 8, 38]} />
        <meshBasicMaterial color={activeColor} transparent opacity={ringOpacity} />
      </mesh>
    </group>
  )
}

function EvidenceCard({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="living-call-evidence-card">
      <strong>{title}</strong>
      {children}
    </div>
  )
}

function WaveCompare() {
  return (
    <>
      <div className="living-call-waves">
        <i className="is-red" />
        <i className="is-blue" />
      </div>
      <div className="living-call-meter">
        <b>32%</b>
        <span>阈值 75%</span>
      </div>
      <p>频谱基频与孙子档案差异显著</p>
    </>
  )
}

function NumberCheck() {
  return (
    <>
      <ul className="living-call-checklist">
        <li className="is-danger">来电号码 ❌</li>
        <li className="is-safe">孙子真实号码 ✓</li>
        <li className="is-safe">备用号码 ×3 ✓</li>
      </ul>
      <p>来电号码不匹配任何已知</p>
    </>
  )
}

function ScriptMatch() {
  const items = ['冒充亲属', '制造闯祸场景', '索要紧迫金额', '阻断核实路径', '不在常用号码']

  return (
    <>
      <ul className="living-call-checklist">
        {items.map((item) => <li className="is-danger" key={item}>{item} ✓</li>)}
      </ul>
      <div className="living-call-hit">总命中率 91%</div>
    </>
  )
}

function DialogueTimeline({ time }: { time: number }) {
  return (
    <group>
      <DialogueBubble
        position={[-1.86, 1.62, 0.72]}
        time={time}
        start={1.0}
        end={4.2}
        speaker="陌生来电"
        text="喂！爷爷是我，我是小宝！我闯祸了，急需 5 万块！别告诉我爸妈！"
        variant="scammer"
      />
      <DialogueBubble
        position={[-1.94, 1.9, 0.96]}
        time={time}
        start={4.4}
        end={6.3}
        speaker="陈建国"
        text="小宝？是你吗？"
      />
      <DialogueBubble
        position={[-1.94, 2.22, 0.18]}
        time={time}
        start={6.5}
        end={10.0}
        speaker="Evans · 仅用户可听"
        text="建国叔，这个声音不是陈宝。我帮您核对一下，您先别答应汇款。"
        variant="evans"
      />
      <DialogueBubble
        position={[-1.94, 1.9, 0.96]}
        time={time}
        start={12.4}
        end={15.4}
        speaker="陈建国"
        text="你等等啊……我先确认一下。"
      />
      <DialogueBubble
        position={[-1.94, 2.22, 0.18]}
        time={time}
        start={23.8}
        end={26.2}
        speaker="Evans · 仅用户可听"
        text="我已经接通了陈宝的视频，您看一眼就明白了。"
        variant="evans"
      />
      <DialogueBubble
        position={[-1.94, 1.9, 0.96]}
        time={time}
        start={30.2}
        end={32.0}
        speaker="陈建国"
        text="你是骗子吧？我挂了。"
      />
      <DialogueBubble
        position={[-1.94, 2.22, 0.18]}
        time={time}
        start={36.0}
        end={39.0}
        speaker="Evans"
        text="建国叔，挂得漂亮。这种号码以后再来我也会提前拦住。"
        variant="evans"
      />
    </group>
  )
}

function PhoneEvidenceScreen({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`living-call-phone-evidence ${compact ? 'is-compact' : ''}`}>
      <EvidenceCard title="声纹核验">
        <WaveCompare />
      </EvidenceCard>
      <EvidenceCard title="号码核验">
        <NumberCheck />
      </EvidenceCard>
      <EvidenceCard title="诈骗话术命中">
        <ScriptMatch />
      </EvidenceCard>
    </div>
  )
}

function AntiFraudPhoneUI({ time }: { time: number }) {
  const show = visibility(time, 7.2, 45.4)
  const evidence = time < 21.0
  const video = time >= 21.0 && time < 32.0
  const action = time >= 32.0 && time < 39.0
  const ending = time >= 39.0
  const connected = time > 27
  const phase = ending ? 'done' : action ? 'action' : video ? 'video' : 'verify'

  if (show <= 0.01) return null

  return (
    <div
      className="living-call-phone-overlay"
      style={{
        opacity: show,
        transform: `translateY(${12 - show * 12}px) scale(${0.98 + show * 0.02})`,
      }}
    >
      <div className="living-call-phone-shell">
        <div className="living-call-phone-island" />
        <div className="living-call-phone-screen">
          <div className="living-call-phone-status">
            <span>15:42</span>
            <span>5G · 82%</span>
          </div>
          <div className="living-call-phone-appbar">
            <i className="living-call-app-icon">E</i>
            <div>
              <span>Evans Guard</span>
              <small>通话防护 · 实时风控</small>
            </div>
            <b>{ending ? '已处置' : video ? '视频核实' : action ? '拦截处置' : '核验中'}</b>
          </div>
          <div className={`living-call-risk-card is-${phase}`}>
            <div className="living-call-risk-orb">
              <b>{ending ? '0' : action ? '91' : video ? '68' : '91'}</b>
              <span>{ending ? 'SAFE' : 'RISK'}</span>
            </div>
            <div className="living-call-risk-copy">
              <strong>{ending ? '已完成防护闭环' : '疑似冒充亲属诈骗'}</strong>
              <span>{ending ? '号码已拉黑，举报与家属通报均已完成' : '高危话术命中，建议不要转账或透露验证码'}</span>
            </div>
          </div>
          <div className="living-call-phone-steps">
            <i className={phase === 'verify' ? 'is-active' : 'is-done'}>核验</i>
            <i className={phase === 'video' ? 'is-active' : phase === 'verify' ? '' : 'is-done'}>视频</i>
            <i className={phase === 'action' ? 'is-active' : phase === 'done' ? 'is-done' : ''}>处置</i>
          </div>
          <div className="living-call-caller-card">
            <div className="living-call-caller-avatar">?</div>
            <div>
              <strong>陌生号码</strong>
              <span>+86 1XX-XXXX-XXXX</span>
            </div>
            <em>未保存</em>
          </div>
          <div className="living-call-live-strip">
            <span>Live analysis</span>
            <i />
            <i />
            <i />
            <i />
            <b>{ending ? 'Closed' : 'Running'}</b>
          </div>
          {evidence && (
            <div className="living-call-phone-section">
              <PhoneEvidenceScreen />
            </div>
          )}
          {video && (
            <div className="living-call-phone-video">
              <div className="living-call-video-header">
                <b>真孙子视频通话</b>
                <span>{connected ? '00:12' : '接通中'}</span>
              </div>
              <div className="living-call-video-stage">
                <i>陈</i>
                <strong>孙子 陈宝</strong>
                <span>北京 · XX 大学</span>
              </div>
              <p>陈宝端：建国爷？我没事啊？</p>
            </div>
          )}
          {action && (
            <div className="living-call-phone-actions">
              <b>处置面板</b>
              <span><i />+86 1XX-XXXX-XXXX 已加入黑名单</span>
              <span><i />已提交反诈中心 · 案件编号 #B2026-05-17-XXX</span>
              <p>陈伟，刚刚成功帮您父亲拦截了一起冒充孙子的诈骗电话，他没有损失。</p>
              <div className="living-call-action-buttons">
                <button>查看报告</button>
                <button>通知家属</button>
              </div>
            </div>
          )}
          {ending && (
            <div className="living-call-phone-section">
              <PhoneEvidenceScreen compact />
              <div className="living-call-phone-done">
                <b>防护完成</b>
                <span>通话结束｜已加入黑名单｜已举报</span>
              </div>
            </div>
          )}
          <div className="living-call-phone-tabbar">
            <span className="is-active">防护</span>
            <span>联系人</span>
            <span>记录</span>
          </div>
          <div className="living-call-phone-homebar" />
        </div>
      </div>
    </div>
  )
}

function CoffeeTableProps() {
  return (
    <group>
      <ImportedFurniture
        path="/models/quaternius-furniture/round-table-small.glb"
        position={[0.28, FLOOR_TOP, -0.24]}
        rotation={[0, 0.08, 0]}
        scale={[1.12, 1.12, 1.12]}
        tint="#0d1117"
      />
      <TeaCup position={[0.52, 0.49, -0.08]} />
      <Glasses position={[-0.18, 0.5, -0.18]} />
    </group>
  )
}

function TeaCup({ position }: { position: Vec3 }) {
  return (
    <group position={position} rotation={[0, -0.36, 0]}>
      <LineCylinder position={[0, 0.055, 0]} args={[0.09, 0.07, 0.11, 24]} color="#14171b" edge={WHITE_EDGE} opacity={0.9} />
      <mesh position={[0.08, 0.055, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.04, 0.006, 8, 22]} />
        <meshStandardMaterial color="#14171b" roughness={0.8} />
        <Edges color={WHITE_EDGE} threshold={10} />
      </mesh>
      <LineCylinder position={[0, 0.12, 0]} args={[0.062, 0.062, 0.008, 24]} color="#101722" edge={ACTIVE_BLUE} opacity={0.72} />
    </group>
  )
}

function Glasses({ position }: { position: Vec3 }) {
  return (
    <group position={position} rotation={[0, 0.36, 0]}>
      <mesh position={[-0.075, 0.018, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.062, 0.006, 8, 26]} />
        <meshStandardMaterial color="#090b0f" roughness={0.72} metalness={0.18} />
        <Edges color={WHITE_EDGE} threshold={10} />
      </mesh>
      <mesh position={[0.075, 0.018, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.062, 0.006, 8, 26]} />
        <meshStandardMaterial color="#090b0f" roughness={0.72} metalness={0.18} />
        <Edges color={WHITE_EDGE} threshold={10} />
      </mesh>
      <LineBox position={[0, 0.018, 0]} scale={[0.064, 0.008, 0.01]} color="#090b0f" edge={WHITE_EDGE} opacity={0.86} />
      <LineBox position={[-0.155, 0.016, -0.04]} rotation={[0, -0.62, 0]} scale={[0.12, 0.006, 0.012]} color="#090b0f" edge={WHITE_EDGE} opacity={0.72} />
      <LineBox position={[0.155, 0.016, -0.04]} rotation={[0, 0.62, 0]} scale={[0.12, 0.006, 0.012]} color="#090b0f" edge={WHITE_EDGE} opacity={0.72} />
    </group>
  )
}

function LivingRoomSet({ time }: { time: number }) {
  return (
    <group>
      <LineBox position={[0, -0.04, 0]} scale={[7.2, 0.08, 5.2]} color="#07090d" edge={SOFT_EDGE} opacity={0.88} />
      <LineBox position={[0, 1.28, -2.52]} scale={[7.2, 2.56, 0.14]} color="#090b10" edge={SOFT_EDGE} opacity={0.42} />
      <LineBox position={[-3.52, 1.28, 0]} scale={[0.14, 2.56, 5.2]} color="#080a0f" edge={MUTED_EDGE} opacity={0.34} />
      <LineBox position={[2.05, 1.58, -2.42]} scale={[1.76, 0.9, 0.08]} color="#07090d" edge={MUTED_EDGE} opacity={0.3} />
      <LineBox position={[-2.28, 1.62, -2.42]} scale={[1.08, 1.16, 0.08]} color="#07090d" edge={MUTED_EDGE} opacity={0.26} />
      <LineBox position={[0, 0.03, 0.3]} scale={[4.6, 0.032, 2.8]} color="#0b0d11" edge={MUTED_EDGE} opacity={0.28} />
      <ImportedFurniture
        path="/models/quaternius-furniture/sofa.glb"
        position={[-0.72, FLOOR_TOP, 1.34]}
        rotation={[0, Math.PI, 0]}
        scale={[3.08, 3.08, 3.08]}
        tint="#1c242e"
      />
      <ImportedFurniture
        path="/models/quaternius-furniture/sofa-small.glb"
        position={[2.88, FLOOR_TOP, 0.72]}
        rotation={[0, 0.48, 0]}
        scale={[1.46, 1.46, 1.46]}
        tint="#151c24"
        outlineColor={WHITE_EDGE}
      />
      <ImportedFurniture
        path="/models/quaternius-furniture/lamp-round-floor.glb"
        position={[-2.96, FLOOR_TOP, -1.36]}
        rotation={[0, 0.28, 0]}
        scale={[1.34, 1.34, 1.34]}
        tint="#0d131a"
        outlineColor={WHITE_EDGE}
      />
      <CoffeeTableProps />
      <Suspense fallback={null}>
        <SittingElderOnSofa time={time} />
      </Suspense>
      <DialogueTimeline time={time} />
    </group>
  )
}

function AnimatedScene({ time }: { time: number }) {
  return (
    <>
      <color attach="background" args={['#06080c']} />
      <fog attach="fog" args={['#06080c', 9, 18]} />
      <OrthographicCamera makeDefault position={[3.05, 2.76, 3.72]} zoom={108} />
      <CameraMotion time={time} />
      <ambientLight intensity={0.52} />
      <hemisphereLight intensity={0.28} color="#d8dde8" groundColor="#080a0e" />
      <directionalLight castShadow intensity={1.3} position={[4.5, 7.2, 5.4]} shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <spotLight castShadow intensity={10} angle={0.42} penumbra={0.82} position={[1.8, 4.8, 2.4]} color="#e6edf8" />
      <pointLight intensity={1.2} distance={2.6} position={[-0.72, 1.05, 1.1]} color={ACTIVE_BLUE} />
      <group position={[0, -0.02, 0]} rotation={[0, -0.16, 0]}>
        <LivingRoomSet time={time} />
      </group>
      <ContactShadows position={[0, 0.02, 0]} opacity={0.58} scale={12} blur={2.1} far={7} color="#000000" />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enableRotate={false}
        target={[-0.36, 1.02, 0.52]}
      />
    </>
  )
}

function SceneOverlay({ time }: { time: number }) {
  const opening = visibility(time, 0.1, 4.8)
  const ending = visibility(time, 39.2, 45.6)

  return (
    <>
      {opening > 0.01 && (
        <div className="top-narration" style={{ opacity: opening, transform: `translateX(-50%) translateY(${10 - opening * 10}px)` }}>
          <strong>Scene 04 · 反诈通话</strong>
          <span>陌生号码冒充孙子来电，Evans 通过骨传导私密提醒并启动多路核验。</span>
        </div>
      )}
      {ending > 0.01 && (
        <div className="top-narration" style={{ opacity: ending, transform: `translateX(-50%) translateY(${10 - ending * 10}px)` }}>
          <strong>收尾</strong>
          <span>核验证据缩小定格，诈骗号码已举报和拉黑，Evans 胸针回到暖白待机。</span>
        </div>
      )}
      <AntiFraudPhoneUI time={time} />
      <div className="story-progress">
        <i style={{ width: `${(time / STORY_DURATION) * 100}%` }} />
      </div>
    </>
  )
}

export function LivingCallExperience() {
  const time = useStoryClock()

  return (
    <section className="interior-shell" aria-label="客厅反诈通话三维动画场景">
      <Canvas shadows dpr={[1, 2]}>
        <Suspense fallback={null}>
          <AnimatedScene time={time} />
        </Suspense>
      </Canvas>
      <SceneOverlay time={time} />
    </section>
  )
}

export default LivingCallExperience
