import * as THREE from 'three'
import { ScriptedSceneExperience, type ScriptedSceneConfig } from '../_shared/ScriptedSceneExperience'

const config: ScriptedSceneConfig = {
  ariaLabel: '舒适居家书房决策副驾三维场景',
  duration: 42,
  environment: 'asset-cozy-study',
  pose: 'seated-sofa',
  personPosition: [0.1, 0.04, 0.72],
  personRotation: [0, -Math.PI / 2, 0],
  personScale: 1.5,
  enableOrbitControls: true,
  dialogues: [],
  panels: [],
  routes: [],
  camera: [
    { at: 0, position: new THREE.Vector3(2.6, 2.06, 3.18), look: new THREE.Vector3(0.02, 1.14, 0.28), zoom: 126 },
    { at: 8, position: new THREE.Vector3(1.82, 1.78, 2.24), look: new THREE.Vector3(0.0, 1.24, 0.42), zoom: 150 },
    { at: 18, position: new THREE.Vector3(2.5, 2.24, 2.96), look: new THREE.Vector3(0.04, 1.5, -0.08), zoom: 128 },
    { at: 41.8, position: new THREE.Vector3(2.14, 1.86, 2.62), look: new THREE.Vector3(0.02, 1.1, 0.34), zoom: 142 },
  ],
}

export function DecisionCopilotExperience() {
  return <ScriptedSceneExperience config={config} />
}

export default DecisionCopilotExperience
