import React, { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, TransformControls } from '@react-three/drei'
import * as THREE from 'three'
import { ASSETS, Model, ACTIVE_BLUE, WHITE_EDGE } from '../_shared/ScriptedSceneExperience'

type ModelData = {
  id: string
  name: string
  src: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
}

// Initial state matches scene 6
const initialModels: ModelData[] = [
  { id: '1', name: 'Desk', src: ASSETS.stickyDesk, position: [0, 0, 0], rotation: [0, -0.03, 0], scale: 2.4 },
  { id: '2', name: 'Man', src: ASSETS.seatedYoungMan, position: [1.45, 0, 0], rotation: [0, -Math.PI / 2, 0], scale: 1.8 },
  { id: '3', name: 'Monitor', src: ASSETS.assetMonitor, position: [-0.8, 0.85, -0.4], rotation: [0, -0.3, 0], scale: 0.7 },
  { id: '4', name: 'Laptop', src: ASSETS.laptop, position: [-1.4, 0.85, 0.2], rotation: [0, 0.2, 0], scale: 0.55 },
  { id: '5', name: 'Keyboard', src: ASSETS.assetKeyboard, position: [0.2, 0.85, -0.1], rotation: [0, -0.08, 0], scale: 0.35 },
  { id: '6', name: 'Paper', src: ASSETS.paper, position: [0.5, 0.85, 0.4], rotation: [0, -0.22, 0], scale: 0.3 },
  { id: '7', name: 'Cup', src: ASSETS.coffeeCup, position: [-0.4, 0.85, 0], rotation: [0, 0, 0], scale: 0.2 },
  { id: '8', name: 'Phone', src: ASSETS.phone, position: [-1.2, 0.85, 0.6], rotation: [0, 0.38, 0], scale: 0.15 },
  { id: '9', name: 'Plant', src: ASSETS.plant, position: [-2.4, 0, 0.4], rotation: [0, 0, 0], scale: 0.8 },
  { id: '10', name: 'BgDesk1', src: ASSETS.officeDesk, position: [-1.22, 0, -1.8], rotation: [0, Math.PI / 2, 0], scale: 1.4 },
  { id: '11', name: 'BgMonitor', src: ASSETS.assetMonitor, position: [-1.2, 0.85, -1.9], rotation: [0, Math.PI / 2.1, 0], scale: 0.4 },
  { id: '12', name: 'BgWoman', src: ASSETS.seatedWoman, position: [-0.1, 0, -1.8], rotation: [0, -Math.PI / 2, 0], scale: 0.9 },
  { id: '13', name: 'BgDesk2', src: ASSETS.officeDesk, position: [1.12, 0, -1.8], rotation: [0, Math.PI / 2, 0], scale: 1.3 },
  { id: '14', name: 'Whiteboard', src: ASSETS.whiteboard, position: [2.2, 0, -1.9], rotation: [0, -0.12, 0], scale: 1.0 },
]

function DraggableModel({
  data,
  isSelected,
  onSelect,
  onUpdate,
  mode,
  setOrbitEnabled
}: {
  data: ModelData
  isSelected: boolean
  onSelect: () => void
  onUpdate: (pos: [number, number, number], rot: [number, number, number]) => void
  mode: 'translate' | 'rotate' | 'scale'
  setOrbitEnabled: (v: boolean) => void
}) {
  const groupRef = React.useRef<THREE.Group>(null)

  return (
    <group>
      {isSelected && (
        <TransformControls
          object={groupRef as any}
          mode={mode}
          showX
          showY
          showZ
          onChange={() => {
            if (groupRef.current) {
              const p = groupRef.current.position
              const r = groupRef.current.rotation
              onUpdate(
                [Number(p.x.toFixed(3)), Number(p.y.toFixed(3)), Number(p.z.toFixed(3))],
                [Number(r.x.toFixed(3)), Number(r.y.toFixed(3)), Number(r.z.toFixed(3))]
              )
            }
          }}
          onMouseDown={() => setOrbitEnabled(false)}
          onMouseUp={() => setOrbitEnabled(true)}
        />
      )}
      <group
        ref={groupRef as any}
        position={data.position}
        rotation={data.rotation as any}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
      >
        <Model
          src={data.src}
          position={[0, 0, 0]}
          scale={data.scale}
          opacity={isSelected ? 0.8 : 0.5}
          lineOpacity={isSelected ? 1.0 : 0.66}
          edge={WHITE_EDGE}
          threshold={8}
        />
      </group>
    </group>
  )
}

export function SceneEditorExperience() {
  const [models, setModels] = useState<ModelData[]>(initialModels)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate')

  const updateModel = (id: string, pos: [number, number, number], rot: [number, number, number]) => {
    setModels(prev => prev.map(m => m.id === id ? { ...m, position: pos, rotation: rot } : m))
  }

  const updateScale = (id: string, scale: number) => {
    setModels(prev => prev.map(m => m.id === id ? { ...m, scale } : m))
  }

  const handleCopyCode = () => {
    const code = models.map(m => 
      `<Model src={ASSETS.${Object.keys(ASSETS).find(k => (ASSETS as any)[k] === m.src) || 'unknown'}} position={[${m.position.join(', ')}]} rotation={[${m.rotation.join(', ')}]} scale={${m.scale}} opacity={0.5} lineOpacity={0.66} edge={WHITE_EDGE} threshold={8} />`
    ).join('\n')
    navigator.clipboard.writeText(code)
    alert('代码已复制到剪贴板！可以直接粘贴到 ScriptedSceneExperience.tsx 里。')
  }

  const [orbitEnabled, setOrbitEnabled] = useState(true)

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', background: '#05080d', color: '#fff' }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas shadows dpr={[1, 2]} camera={{ position: [2, 3, 5], fov: 45 }} onPointerMissed={() => setSelectedId(null)}>
          <color attach="background" args={['#05080d']} />
          <ambientLight intensity={0.42} />
          <hemisphereLight intensity={0.26} color="#d8e6ff" groundColor="#080604" />
          <directionalLight castShadow intensity={1.05} position={[4.2, 6.8, 4.6]} />
          
          <gridHelper args={[20, 20, '#102033', '#0a101a']} position={[0, -0.01, 0]} />

          <Suspense fallback={null}>
            {models.map(m => (
              <DraggableModel
                key={m.id}
                data={m}
                isSelected={m.id === selectedId}
                mode={transformMode}
                onSelect={() => setSelectedId(m.id)}
                onUpdate={(pos, rot) => updateModel(m.id, pos, rot)}
                setOrbitEnabled={setOrbitEnabled}
              />
            ))}
          </Suspense>

          <OrbitControls makeDefault enabled={orbitEnabled} />
        </Canvas>
      </div>

      <div style={{ width: '320px', background: '#0a101a', borderLeft: '1px solid #1a2a40', padding: '20px', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>模型布局编辑器</h2>
        
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <button 
            style={{ flex: 1, padding: '8px', background: transformMode === 'translate' ? ACTIVE_BLUE : '#1a2a40', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            onClick={() => setTransformMode('translate')}
          >
            移动
          </button>
          <button 
            style={{ flex: 1, padding: '8px', background: transformMode === 'rotate' ? ACTIVE_BLUE : '#1a2a40', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            onClick={() => setTransformMode('rotate')}
          >
            旋转
          </button>
        </div>

        <button 
          style={{ width: '100%', padding: '12px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '30px', fontWeight: 'bold' }}
          onClick={handleCopyCode}
        >
          复制代码 (Copy Code)
        </button>

        <h3 style={{ fontSize: '14px', color: '#88a0c0', marginBottom: '10px' }}>模型列表</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {models.map(m => (
            <div 
              key={m.id}
              style={{ 
                padding: '10px', 
                background: m.id === selectedId ? '#1a3a5c' : '#111a26', 
                border: `1px solid ${m.id === selectedId ? ACTIVE_BLUE : '#1a2a40'}`,
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedId(m.id)}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{m.name}</div>
              {m.id === selectedId && (
                <div style={{ fontSize: '12px', color: '#88a0c0', marginTop: '8px' }}>
                  <div>Pos: [{m.position.join(', ')}]</div>
                  <div>Rot: [{m.rotation.join(', ')}]</div>
                  <div style={{ marginTop: '8px' }}>
                    <label>Scale: </label>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={m.scale} 
                      onChange={(e) => updateScale(m.id, parseFloat(e.target.value))}
                      style={{ width: '60px', background: '#0a101a', color: '#fff', border: '1px solid #1a2a40', padding: '2px 4px' }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SceneEditorExperience
