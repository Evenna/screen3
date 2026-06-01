from pathlib import Path
path = Path('src/scenes/_shared/ScriptedSceneExperience.tsx')
text = path.read_text()

# add environment type
old_type = "  | 'cozy-study'\n  | 'asset-late-work'"
new_type = "  | 'cozy-study'\n  | 'asset-scene6'\n  | 'asset-late-work'"
text = text.replace(old_type, new_type)

# add environment logic
old_logic = "  if (kind === 'asset-late-work')"
new_logic = """  if (kind === 'asset-scene6') return <group><RoomShell windowSide="back" /><Model src={ASSETS.stickyDesk} position={[0.06, 0.54, 0]} scale={1.5} opacity={0.46} lineOpacity={0.52} edge={WHITE_EDGE} threshold={10} /><Model src={ASSETS.seatedYoungMan} position={[0, 0.64, 0.42]} rotation={[0, Math.PI / 2, 0]} scale={1.3} tint="#172231" opacity={0.56} lineOpacity={0.7} edge={WHITE_EDGE} threshold={10} /><Model src={ASSETS.assetMonitor} position={[0.2, 1.02, -0.3]} scale={0.48} opacity={0.48} lineOpacity={0.48} edge={ACTIVE_BLUE} threshold={10} /><Model src={ASSETS.laptop} position={[-0.32, 0.98, -0.1]} rotation={[0, 0.3, 0]} scale={0.4} opacity={0.5} lineOpacity={0.52} edge={WHITE_EDGE} threshold={10} /><Model src={ASSETS.assetKeyboard} position={[0.02, 0.96, -0.04]} scale={0.34} opacity={0.42} lineOpacity={0.44} edge={WHITE_EDGE} threshold={10} /><Model src={ASSETS.coffeeCup} position={[-0.42, 0.98, 0.18]} scale={0.18} opacity={0.46} lineOpacity={0.42} edge={WHITE_EDGE} threshold={10} /><Model src={ASSETS.paper} position={[0.42, 0.98, 0.1]} rotation={[0, -0.2, 0]} scale={0.24} opacity={0.5} lineOpacity={0.5} edge={WHITE_EDGE} threshold={8} /><Model src={ASSETS.officeDesk} position={[-2.2, 0.54, -1.5]} rotation={[0, Math.PI/2, 0]} scale={1.4} opacity={0.3} lineOpacity={0.3} edge={SOFT_EDGE} threshold={10} /><Model src={ASSETS.assetMonitor} position={[-2.2, 1.02, -1.6]} rotation={[0, Math.PI/2, 0]} scale={0.45} opacity={0.3} lineOpacity={0.3} edge={SOFT_EDGE} threshold={10} /><Model src={ASSETS.whiteboard} position={[1.8, 1.2, -1.8]} rotation={[0, -0.2, 0]} scale={0.8} opacity={0.35} lineOpacity={0.4} edge={WHITE_EDGE} threshold={12} /><Model src={ASSETS.plant} position={[-1.2, 0, -1.8]} scale={0.8} opacity={0.3} lineOpacity={0.3} edge={SOFT_EDGE} threshold={12} /></group>
  if (kind === 'asset-late-work')"""
text = text.replace(old_logic, new_logic)

path.write_text(text)
