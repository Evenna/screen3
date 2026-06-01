from pathlib import Path
path = Path('src/scenes/_shared/ScriptedSceneExperience.tsx')
text = path.read_text()

old_block = """  if (kind === 'asset-scene6') return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.72, -0.25]} receiveShadow><planeGeometry args={[7.4, 4.8]} /><meshStandardMaterial color="#05080d" roughness={0.86} /><Edges color={MUTED_EDGE} threshold={5} /></mesh>
    <LineBox position={[0, 0.63, -2.32]} scale={[7.4, 2.7, 0.08]} color="#060910" edge={MUTED_EDGE} opacity={0.25} />
    <LineBox position={[-3.62, 0.53, -0.28]} scale={[0.08, 2.5, 4.3]} color="#060910" edge={MUTED_EDGE} opacity={0.18} />
    <LineBox position={[1.8, 0.83, -2.26]} scale={[1.45, 0.78, 0.035]} color="#071421" edge={SOFT_EDGE} opacity={0.24} emissive={ACTIVE_BLUE} emissiveIntensity={0.025} />
    <LineBox position={[2.86, 0.83, -0.72]} scale={[0.035, 0.88, 2.25]} color="#102033" edge={ACTIVE_BLUE} opacity={0.22} emissive={ACTIVE_BLUE} emissiveIntensity={0.04} />
    <LineBox position={[0, 1.72, -0.2]} scale={[5.8, 0.035, 1.9]} color="#18202a" edge={SOFT_EDGE} opacity={0.18} />
    {[-2.2, -0.6, 1.0, 2.35].map((x) => <LineBox key={`scene6-lamp-${x}`} position={[x, 1.34, -0.35]} scale={[0.22, 0.08, 0.22]} color="#111722" edge={WHITE_EDGE} opacity={0.46} emissive="#f3f0df" emissiveIntensity={0.1} />)}
    <Model src={ASSETS.stickyDesk} position={[-0.44, -0.7, 0.42]} rotation={[0, -0.03, 0]} scale={1.82} opacity={0.5} lineOpacity={0.66} edge={WHITE_EDGE} threshold={8} />
    <Model src={ASSETS.seatedYoungMan} position={[1.54, -0.7, 0.72]} rotation={[0, -Math.PI / 2.45, 0]} scale={1.38} tint="#172231" opacity={0.62} lineOpacity={0.86} edge={WHITE_EDGE} threshold={8} />
    <Model src={ASSETS.assetMonitor} position={[-1.05, 0.12, 0.02]} rotation={[0, -0.5, 0]} scale={0.52} opacity={0.56} lineOpacity={0.68} edge={ACTIVE_BLUE} threshold={8} />
    <Model src={ASSETS.laptop} position={[-1.56, 0.08, 0.64]} rotation={[0, 0.24, 0]} scale={0.4} opacity={0.54} lineOpacity={0.64} edge={WHITE_EDGE} threshold={8} />
    <Model src={ASSETS.assetKeyboard} position={[-0.05, 0.08, 0.5]} rotation={[0, -0.08, 0]} scale={0.28} opacity={0.5} lineOpacity={0.58} edge={WHITE_EDGE} threshold={8} />
    <Model src={ASSETS.paper} position={[0.3, 0.08, 0.96]} rotation={[0, -0.22, 0.04]} scale={0.24} opacity={0.54} lineOpacity={0.64} edge={WHITE_EDGE} threshold={7} />
    <Model src={ASSETS.coffeeCup} position={[-0.5, 0.09, 0.48]} scale={0.15} opacity={0.5} lineOpacity={0.56} edge={WHITE_EDGE} threshold={8} />
    <Model src={ASSETS.phone} position={[-1.42, 0.08, 1.04]} rotation={[0, 0.38, 0.1]} scale={0.12} opacity={0.5} lineOpacity={0.58} edge={ACTIVE_BLUE} threshold={7} />
    <Model src={ASSETS.plant} position={[-2.04, 0.08, 0.78]} scale={0.3} opacity={0.42} lineOpacity={0.42} edge={SOFT_EDGE} threshold={12} />
    <Model src={ASSETS.officeDesk} position={[-1.22, -0.7, -1.2]} rotation={[0, Math.PI / 2, 0]} scale={1.02} opacity={0.3} lineOpacity={0.34} edge={SOFT_EDGE} threshold={10} />
    <Model src={ASSETS.assetMonitor} position={[-1.2, 0.02, -1.36]} rotation={[0, Math.PI / 2.1, 0]} scale={0.3} opacity={0.32} lineOpacity={0.34} edge={SOFT_EDGE} threshold={10} />
    <Model src={ASSETS.seatedWoman} position={[-0.1, -0.7, -1.34]} rotation={[0, -Math.PI / 2, 0]} scale={0.72} tint="#172231" opacity={0.34} lineOpacity={0.38} edge={SOFT_EDGE} threshold={12} />
    <Model src={ASSETS.officeDesk} position={[1.12, -0.7, -1.46]} rotation={[0, Math.PI / 2, 0]} scale={0.94} opacity={0.27} lineOpacity={0.3} edge={SOFT_EDGE} threshold={10} />
    <Model src={ASSETS.whiteboard} position={[1.95, -0.7, -1.82]} rotation={[0, -0.12, 0]} scale={0.78} opacity={0.42} lineOpacity={0.52} edge={WHITE_EDGE} threshold={10} />
  </group>"""

new_block = """  if (kind === 'asset-scene6') return <group>
    <RoomShell windowSide="back" />
    <LineBox position={[2.86, 1.55, -0.72]} scale={[0.035, 0.88, 2.25]} color="#102033" edge={ACTIVE_BLUE} opacity={0.22} emissive={ACTIVE_BLUE} emissiveIntensity={0.04} />
    <LineBox position={[0, 2.45, -0.2]} scale={[5.8, 0.035, 1.9]} color="#18202a" edge={SOFT_EDGE} opacity={0.18} />
    {[-2.2, -0.6, 1.0, 2.35].map((x) => <LineBox key={`scene6-lamp-${x}`} position={[x, 2.05, -0.35]} scale={[0.22, 0.08, 0.22]} color="#111722" edge={WHITE_EDGE} opacity={0.46} emissive="#f3f0df" emissiveIntensity={0.1} />)}
    <Model src={ASSETS.stickyDesk} position={[-0.44, 0, 0.42]} rotation={[0, -0.03, 0]} scale={1.82} opacity={0.5} lineOpacity={0.66} edge={WHITE_EDGE} threshold={8} />
    <Model src={ASSETS.seatedYoungMan} position={[1.54, 0, 0.72]} rotation={[0, -Math.PI / 2.45, 0]} scale={1.38} tint="#172231" opacity={0.62} lineOpacity={0.86} edge={WHITE_EDGE} threshold={8} />
    <Model src={ASSETS.assetMonitor} position={[-1.05, 0.72, 0.02]} rotation={[0, -0.5, 0]} scale={0.52} opacity={0.56} lineOpacity={0.68} edge={ACTIVE_BLUE} threshold={8} />
    <Model src={ASSETS.laptop} position={[-1.56, 0.68, 0.64]} rotation={[0, 0.24, 0]} scale={0.4} opacity={0.54} lineOpacity={0.64} edge={WHITE_EDGE} threshold={8} />
    <Model src={ASSETS.assetKeyboard} position={[-0.05, 0.68, 0.5]} rotation={[0, -0.08, 0]} scale={0.28} opacity={0.5} lineOpacity={0.58} edge={WHITE_EDGE} threshold={8} />
    <Model src={ASSETS.paper} position={[0.3, 0.68, 0.96]} rotation={[0, -0.22, 0.04]} scale={0.24} opacity={0.54} lineOpacity={0.64} edge={WHITE_EDGE} threshold={7} />
    <Model src={ASSETS.coffeeCup} position={[-0.5, 0.69, 0.48]} scale={0.15} opacity={0.5} lineOpacity={0.56} edge={WHITE_EDGE} threshold={8} />
    <Model src={ASSETS.phone} position={[-1.42, 0.68, 1.04]} rotation={[0, 0.38, 0.1]} scale={0.12} opacity={0.5} lineOpacity={0.58} edge={ACTIVE_BLUE} threshold={7} />
    <Model src={ASSETS.plant} position={[-2.04, 0.68, 0.78]} scale={0.3} opacity={0.42} lineOpacity={0.42} edge={SOFT_EDGE} threshold={12} />
    <Model src={ASSETS.officeDesk} position={[-1.22, 0, -1.2]} rotation={[0, Math.PI / 2, 0]} scale={1.02} opacity={0.3} lineOpacity={0.34} edge={SOFT_EDGE} threshold={10} />
    <Model src={ASSETS.assetMonitor} position={[-1.2, 0.62, -1.36]} rotation={[0, Math.PI / 2.1, 0]} scale={0.3} opacity={0.32} lineOpacity={0.34} edge={SOFT_EDGE} threshold={10} />
    <Model src={ASSETS.seatedWoman} position={[-0.1, 0, -1.34]} rotation={[0, -Math.PI / 2, 0]} scale={0.72} tint="#172231" opacity={0.34} lineOpacity={0.38} edge={SOFT_EDGE} threshold={12} />
    <Model src={ASSETS.officeDesk} position={[1.12, 0, -1.46]} rotation={[0, Math.PI / 2, 0]} scale={0.94} opacity={0.27} lineOpacity={0.3} edge={SOFT_EDGE} threshold={10} />
    <Model src={ASSETS.whiteboard} position={[1.95, 0, -1.82]} rotation={[0, -0.12, 0]} scale={0.78} opacity={0.42} lineOpacity={0.52} edge={WHITE_EDGE} threshold={10} />
  </group>"""

text = text.replace(old_block, new_block)

old_shadow = """  if (config.environment === 'asset-scene6') {
    shadowY = -0.7
  }
  return <><color attach="background" args={['#05080d']} /><fog attach="fog" args={['#05080d', 5.6, 11.5]} /><OrthographicCamera makeDefault position={[2.55, 2.1, 3.1]} zoom={122} /><CameraMotion time={time} cameraFrames={config.camera} /><ambientLight intensity={0.42} /><hemisphereLight intensity={0.26} color="#d8e6ff" groundColor="#080604" /><directionalLight castShadow intensity={1.05} position={[4.2, 6.8, 4.6]} shadow-mapSize-width={2048} shadow-mapSize-height={2048} /><spotLight castShadow intensity={6.2} angle={0.46} penumbra={0.84} position={[0.4, 3.6, 2.0]} color="#dcecff" /><pointLight intensity={0.9} distance={2.2} position={[BROOCH.x, BROOCH.y, BROOCH.z]} color={ACTIVE_BLUE} /><group rotation={[0, -0.06, 0]}><SceneContent config={config} time={time} /></group><ContactShadows position={[0, shadowY, 0]} opacity={0.58} scale={9} blur={2.35} far={6} color="#000000" /><OrbitControls enabled={false} enablePan={false} enableZoom={false} enableRotate={false} target={[0, 1.18, 0.15]} /></> }"""

new_shadow = """  return <><color attach="background" args={['#05080d']} /><fog attach="fog" args={['#05080d', 5.6, 11.5]} /><OrthographicCamera makeDefault position={[2.55, 2.1, 3.1]} zoom={122} /><CameraMotion time={time} cameraFrames={config.camera} /><ambientLight intensity={0.42} /><hemisphereLight intensity={0.26} color="#d8e6ff" groundColor="#080604" /><directionalLight castShadow intensity={1.05} position={[4.2, 6.8, 4.6]} shadow-mapSize-width={2048} shadow-mapSize-height={2048} /><spotLight castShadow intensity={6.2} angle={0.46} penumbra={0.84} position={[0.4, 3.6, 2.0]} color="#dcecff" /><pointLight intensity={0.9} distance={2.2} position={[BROOCH.x, BROOCH.y, BROOCH.z]} color={ACTIVE_BLUE} /><group rotation={[0, -0.06, 0]}><SceneContent config={config} time={time} /></group><ContactShadows position={[0, 0.02, 0]} opacity={0.58} scale={9} blur={2.35} far={6} color="#000000" /><OrbitControls enabled={false} enablePan={false} enableZoom={false} enableRotate={false} target={[0, 1.18, 0.15]} /></> }"""

text = text.replace(old_shadow, new_shadow)

path.write_text(text)
