import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls, OrthographicCamera } from '@react-three/drei'
import { BlueTrail, CameraRig, LineBox, LineCylinder, LineSphere, UI_BLUE, useLoopClock } from './Shared3D'

const DURATION = 34

function SofaSet() {
  return (
    <group>
      <LineBox position={[-1.85, 0.34, -0.74]} scale={[2.25, 0.45, 0.56]} color="#11161c" />
      <LineBox position={[-1.85, 0.76, -1.0]} scale={[2.25, 0.76, 0.16]} color="#0d1117" opacity={0.76} />
      {[-2.48, -1.85, -1.22].map((x) => <LineBox key={x} position={[x, 0.62, -0.5]} scale={[0.52, 0.18, 0.34]} color="#1a2028" />)}
      <LineBox position={[0.1, 0.42, 0.08]} scale={[1.16, 0.09, 0.66]} color="#15120f" />
      <LineBox position={[0.36, 0.5, 0.1]} scale={[0.25, 0.026, 0.42]} color="#05080b" edge={UI_BLUE} emissive={UI_BLUE} emissiveIntensity={0.18} />
      <LineCylinder position={[-0.22, 0.53, -0.12]} args={[0.12, 0.1, 0.14, 24]} color="#11151b" />
    </group>
  )
}

function ElderAndDetails() {
  return (
    <group>
      <LineBox position={[-0.9, 0.02, 0.58]} scale={[1.55, 0.03, 0.94]} color="#17151b" edge="#737c88" opacity={0.66} />
      <LineSphere position={[-1.06, 0.28, 0.63]} scale={[0.18, 0.16, 0.18]} color="#19161a" />
      <LineBox position={[-0.58, 0.2, 0.52]} rotation={[0.02, 0.05, -0.36]} scale={[0.68, 0.24, 0.34]} color="#161b22" />
      <LineBox position={[0.02, 0.14, 0.72]} rotation={[0, -0.72, -0.14]} scale={[0.62, 0.12, 0.16]} color="#10141a" />
      <LineBox position={[-1.45, 0.12, 0.42]} rotation={[0.04, -0.3, 0.18]} scale={[0.54, 0.11, 0.15]} color="#10141a" />
      <LineSphere position={[-0.68, 0.36, 0.72]} scale={[0.052, 0.052, 0.052]} color="#0c1722" edge={UI_BLUE} emissive={UI_BLUE} emissiveIntensity={0.9} />
      <LineBox position={[-2.05, 0.06, 1.15]} rotation={[0, 0.5, 0]} scale={[0.18, 0.06, 0.42]} color="#211a16" />
      <LineBox position={[-1.48, 0.06, 1.28]} rotation={[0, -0.42, 0]} scale={[0.18, 0.06, 0.42]} color="#211a16" />
    </group>
  )
}

function LivingRoomScene({ time }: { time: number }) {
  return (
    <>
      <color attach="background" args={["#050709"]} />
      <fog attach="fog" args={["#050709", 10, 22]} />
      <OrthographicCamera makeDefault position={[-3.2, 1.2, 3.9]} zoom={76} />
      <CameraRig time={time} keyframes={[
        { at: 0, position: [-3.2, 1.2, 3.9], look: [-1.3, 0.36, 0.86], zoom: 76 },
        { at: 7, position: [-2.6, 2.3, 4.3], look: [-0.6, 0.78, 0.38], zoom: 88 },
        { at: 18, position: [2.8, 3.9, 4.4], look: [-0.15, 0.76, -0.05], zoom: 74 },
        { at: 30, position: [1.6, 2.8, 4.2], look: [-0.68, 0.76, 0.42], zoom: 88 },
      ]} />
      <ambientLight intensity={0.48} />
      <directionalLight castShadow intensity={1.15} position={[3.8, 7, 5]} />
      <spotLight castShadow intensity={10} angle={0.44} penumbra={0.82} position={[-1.6, 4.5, 2.8]} color="#dfe9f4" />
      <group rotation={[0, -0.08, 0]}>
        <LineBox position={[0, -0.05, 0]} scale={[6.2, 0.1, 3.35]} color="#07090d" opacity={0.92} />
        <LineBox position={[0, 1.25, -1.68]} scale={[6.2, 2.55, 0.12]} color="#0b0f14" opacity={0.34} />
        <SofaSet />
        <ElderAndDetails />
        <BlueTrail time={time} start={8} end={18} points={[[-0.68, 0.38, 0.72], [0.25, 0.7, 0.42], [0.36, 0.58, 0.1]]} />
      </group>
      <ContactShadows position={[0, 0.02, 0]} opacity={0.58} scale={10} blur={2.2} far={6} />
      <OrbitControls enabled={false} />
    </>
  )
}

function Overlay({ time }: { time: number }) {
  return (
    <>
      <div className="scene-fade" style={{ opacity: 0.12 }} />
      <div className="opening-caption opening-caption--park" style={{ opacity: 1 }}>
        <span>[客厅] 跌倒现场静态构图</span>
        <strong>客厅作为单独场景保留：倒地老人、地毯、拖鞋、茶几与手机全部是静止建模对象。</strong>
      </div>
      <div className="story-progress"><i style={{ width: `${(time / DURATION) * 100}%` }} /></div>
    </>
  )
}

export function LivingRoomExperience() {
  const time = useLoopClock(DURATION)
  return (
    <section className="interior-shell" aria-label="客厅跌倒静态三维场景">
      <Canvas shadows dpr={[1, 2]}><LivingRoomScene time={time} /></Canvas>
      <Overlay time={time} />
    </section>
  )
}
