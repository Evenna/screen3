import { Canvas } from '@react-three/fiber'
import { ContactShadows, Html, OrbitControls, OrthographicCamera } from '@react-three/drei'
import { BlueTrail, CameraRig, LineBox, LineCylinder, LineSphere, UI_BLUE, useLoopClock, WHITE_EDGE } from './Shared3D'

const DURATION = 38

function Elder({ x, name }: { x: number; name: string }) {
  return (
    <group position={[x, 0, 0]} rotation={[0, x > 0 ? Math.PI : 0, 0]}>
      <LineCylinder position={[0, 0.34, 0]} args={[0.28, 0.34, 0.16, 28]} color="#0b0c10" />
      <LineBox position={[0, 0.88, 0]} scale={[0.46, 0.68, 0.22]} color="#171b22" />
      <LineSphere position={[0, 1.36, 0.02]} scale={[0.2, 0.24, 0.2]} color="#1b1c20" />
      <LineSphere position={[0.14, 1.08, 0.13]} scale={[0.04, 0.04, 0.04]} color="#0c1722" edge={x < 0 ? UI_BLUE : WHITE_EDGE} emissive={x < 0 ? UI_BLUE : '#000'} emissiveIntensity={x < 0 ? 0.8 : 0} />
      <Html position={[0, 1.85, 0.04]} center distanceFactor={7} transform sprite occlude={false}>
        <div className="object-label object-label--person"><strong>{name}</strong><span>公园下棋 · 保持静止</span></div>
      </Html>
    </group>
  )
}

function ChessTable() {
  const xs = [-0.42, -0.28, -0.14, 0, 0.14, 0.28, 0.42]
  return (
    <group>
      <LineCylinder position={[0, 0.34, 0]} args={[0.58, 0.64, 0.68, 40]} color="#0b0c10" />
      <LineBox position={[0, 0.74, 0]} scale={[1.32, 0.06, 1.06]} color="#171116" />
      {xs.map((x) => <LineBox key={x} position={[x, 0.79, 0]} scale={[0.006, 0.01, 0.96]} color="#091014" edge="#eef1f6" opacity={0.7} />)}
      {xs.map((z) => <LineBox key={z} position={[0, 0.795, z]} scale={[1.16, 0.01, 0.006]} color="#091014" edge="#eef1f6" opacity={0.7} />)}
      {[-0.42, -0.18, 0.18, 0.42].map((x, i) => <LineCylinder key={x} position={[x, 0.86, i % 2 ? 0.22 : -0.18]} args={[0.065, 0.075, 0.06, 24]} color={i % 2 ? '#2b1512' : '#08090c'} />)}
    </group>
  )
}

function ChessScene({ time }: { time: number }) {
  return (
    <>
      <color attach="background" args={["#06090a"]} />
      <fog attach="fog" args={["#06090a", 12, 25]} />
      <OrthographicCamera makeDefault position={[4.9, 5.25, 6.65]} zoom={68} />
      <CameraRig time={time} keyframes={[
        { at: 0, position: [4.9, 5.25, 6.65], look: [0, 0.8, 0], zoom: 68 },
        { at: 6, position: [3.25, 3.72, 5.05], look: [0, 1.02, 0.02], zoom: 76 },
        { at: 13, position: [2.42, 2.82, 3.82], look: [0, 0.82, 0.02], zoom: 92 },
        { at: 24, position: [4.8, 4.85, 6.35], look: [0.38, 1, 0.04], zoom: 68 },
      ]} />
      <ambientLight intensity={0.48} />
      <directionalLight castShadow intensity={1.2} position={[4, 8, 5]} />
      <spotLight castShadow intensity={12} angle={0.42} penumbra={0.82} position={[1.8, 5.4, 2.6]} color="#dbe8d9" />
      <group rotation={[0, -0.16, 0]}>
        <LineBox position={[0, -0.04, 0]} scale={[9.6, 0.08, 5.8]} color="#060a08" opacity={0.88} />
        <LineBox position={[0, 1.4, -2.9]} scale={[9.6, 2.8, 0.16]} color="#070b0b" opacity={0.32} />
        <ChessTable />
        <Elder x={-1.22} name="陈建国" />
        <Elder x={1.22} name="老张" />
        <BlueTrail time={time} start={12} end={18} points={[[-1.08, 1.1, 0.13], [-0.34, 1.12, 0.08], [0.26, 0.92, -0.08]]} />
      </group>
      <ContactShadows position={[0, 0.02, 0]} opacity={0.58} scale={14} blur={2.1} far={8} />
      <OrbitControls enabled={false} />
    </>
  )
}

function Overlay({ time }: { time: number }) {
  return (
    <>
      <div className="opening-caption opening-caption--park" style={{ opacity: 1 }}>
        <span>[下棋] 公园棋局模板</span>
        <strong>这是原下棋叙事的独立入口，棋桌、棋子、两位老人和胸针线索都保留为静态展览式 3D 场景。</strong>
      </div>
      <div className="story-progress"><i style={{ width: `${(time / DURATION) * 100}%` }} /></div>
    </>
  )
}

export function ChessExperience() {
  const time = useLoopClock(DURATION)
  return (
    <section className="interior-shell" aria-label="公园下棋三维场景">
      <Canvas shadows dpr={[1, 2]}><ChessScene time={time} /></Canvas>
      <Overlay time={time} />
    </section>
  )
}
