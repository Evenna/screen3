import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls, OrthographicCamera } from '@react-three/drei'
import { BlueTrail, CameraRig, LineBox, LineCylinder, LineSphere, UI_BLUE, useLoopClock } from './Shared3D'

const DURATION = 42

function RoomShell() {
  return (
    <group>
      <LineBox position={[-3.45, -0.05, 0]} scale={[3.9, 0.1, 2.85]} color="#07090d" />
      <LineBox position={[0.15, -0.05, 0]} scale={[2.9, 0.1, 2.6]} color="#07090d" />
      <LineBox position={[3.55, -0.05, 0]} scale={[3.8, 0.1, 2.85]} color="#07090d" />
      <LineBox position={[0, 1.18, -1.44]} scale={[10.7, 2.4, 0.12]} color="#0b0f14" opacity={0.36} />
      {[-1.15, 1.55].map((x) => <LineBox key={x} position={[x, 1.18, -1.02]} scale={[0.12, 2.35, 0.84]} color="#0b0f14" opacity={0.3} />)}
      <LineBox position={[-3.45, 0.02, 0.18]} scale={[1.75, 0.028, 1.05]} color="#101018" edge="#56606b" opacity={0.72} />
    </group>
  )
}

function RobotAndDock() {
  return (
    <group position={[0.52, 0, -0.9]} rotation={[0, -0.56, 0]}>
      <LineBox position={[0, 0.18, -0.35]} scale={[0.78, 0.36, 0.09]} color="#080b10" edge={UI_BLUE} opacity={0.72} />
      <LineCylinder position={[0, 0.58, 0]} args={[0.23, 0.28, 0.62, 28]} color="#111820" />
      <LineSphere position={[0, 1.0, 0]} scale={[0.28, 0.22, 0.24]} color="#101923" edge={UI_BLUE} emissive={UI_BLUE} emissiveIntensity={0.12} />
      <LineBox position={[0, 1.04, 0.2]} scale={[0.22, 0.045, 0.012]} color={UI_BLUE} edge={UI_BLUE} emissive={UI_BLUE} emissiveIntensity={0.5} opacity={0.72} />
    </group>
  )
}

function HomeObjects() {
  return (
    <group>
      <LineBox position={[-4.42, 0.36, -0.76]} scale={[1.72, 0.42, 0.5]} color="#111419" />
      <LineBox position={[-2.58, 0.43, -0.08]} scale={[1.05, 0.08, 0.58]} color="#15120f" />
      <LineBox position={[-2.34, 0.5, 0]} scale={[0.23, 0.026, 0.38]} color="#05070a" edge={UI_BLUE} emissive={UI_BLUE} emissiveIntensity={0.18} />
      <LineSphere position={[-3.36, 0.28, 0.66]} scale={[0.18, 0.16, 0.18]} color="#19161a" />
      <LineBox position={[-3.0, 0.2, 0.56]} rotation={[0.02, 0.05, -0.38]} scale={[0.62, 0.24, 0.34]} color="#161b22" />
      <LineSphere position={[-3.16, 0.44, 0.78]} scale={[0.052, 0.052, 0.052]} color="#0c1722" edge={UI_BLUE} emissive={UI_BLUE} emissiveIntensity={0.9} />
      <LineBox position={[-4.22, 0.055, 0.86]} rotation={[0, 0.45, 0]} scale={[0.18, 0.06, 0.42]} color="#201b18" />
      <LineBox position={[-3.72, 0.055, 0.98]} rotation={[0, -0.42, 0]} scale={[0.18, 0.06, 0.42]} color="#201b18" />
      <RobotAndDock />
      <LineBox position={[4.0, 0.34, -0.32]} scale={[1.55, 0.42, 1.55]} color="#10131a" />
      <LineBox position={[2.55, 0.36, -0.45]} scale={[0.66, 0.7, 0.52]} color="#11141a" />
      <LineBox position={[2.55, 0.57, -0.17]} scale={[0.58, 0.18, 0.035]} color="#171d25" edge={UI_BLUE} emissive={UI_BLUE} emissiveIntensity={0.12} />
      <LineBox position={[2.76, 0.73, -0.36]} scale={[0.28, 0.12, 0.18]} color="#17202b" edge={UI_BLUE} emissive={UI_BLUE} emissiveIntensity={0.08} />
    </group>
  )
}

function HomeScene({ time }: { time: number }) {
  return (
    <>
      <color attach="background" args={["#050709"]} />
      <fog attach="fog" args={["#050709", 11, 23]} />
      <OrthographicCamera makeDefault position={[-5.3, 1.0, 4.45]} zoom={62} />
      <CameraRig time={time} keyframes={[
        { at: 0, position: [-5.3, 1.0, 4.45], look: [-3.85, 0.42, 0.12], zoom: 62 },
        { at: 8, position: [-4.3, 2.35, 4.95], look: [-2.4, 1.05, -0.15], zoom: 70 },
        { at: 21, position: [0.85, 3.95, 5.55], look: [0.6, 1.05, -0.18], zoom: 64 },
        { at: 28, position: [3.7, 4.15, 5.35], look: [3.5, 1.08, -0.16], zoom: 73 },
        { at: 38, position: [-1.55, 3.05, 5.0], look: [-1.55, 1, -0.08], zoom: 80 },
      ]} />
      <ambientLight intensity={0.46} />
      <directionalLight castShadow intensity={1.16} position={[4, 7, 5]} />
      <spotLight castShadow intensity={11.5} angle={0.44} penumbra={0.82} position={[-2.4, 4.6, 2.5]} color="#dfe9f4" />
      <group rotation={[0, -0.08, 0]}>
        <RoomShell />
        <HomeObjects />
        <BlueTrail time={time} start={8.2} end={24.5} points={[[-3.16, 0.44, 0.78], [0.52, 1.02, -0.88], [2.55, 0.92, -0.12], [-2.95, 0.28, 0.62], [-2.34, 0.66, 0.16]]} />
      </group>
      <ContactShadows position={[0, 0.02, 0]} opacity={0.58} scale={14} blur={2.2} far={7} />
      <OrbitControls enabled={false} />
    </>
  )
}

function Overlay({ time }: { time: number }) {
  return (
    <>
      <div className="opening-caption opening-caption--hardware" style={{ opacity: 1 }}>
        <span>[家里面] 客厅—走廊—卧室连续剖面</span>
        <strong>这是你刚描述的家庭闭环：胸针、机器人、床头柜第一抽屉、药膏盒和茶几手机都静态存在，只用蓝线说明调度。</strong>
      </div>
      <div className="story-progress"><i style={{ width: `${(time / DURATION) * 100}%` }} /></div>
    </>
  )
}

export function HomeExperience() {
  const time = useLoopClock(DURATION)
  return (
    <section className="interior-shell" aria-label="家庭跌倒紧急调度三维静态场景">
      <Canvas shadows dpr={[1, 2]}><HomeScene time={time} /></Canvas>
      <Overlay time={time} />
    </section>
  )
}
