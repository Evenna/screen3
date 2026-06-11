import * as THREE from 'three'
import { ScriptedSceneExperience, type ScriptedSceneConfig } from '../_shared/ScriptedSceneExperience'

const config: ScriptedSceneConfig = {
  ariaLabel: '舒适居家书房决策副驾三维场景',
  duration: 44,
  environment: 'asset-cozy-study',
  pose: 'seated-sofa',
  personPosition: [0.1, 0.04, 0.72],
  personRotation: [0, -Math.PI / 2, 0],
  personScale: 1.5,
  enableOrbitControls: false,
  dialogues: [],
  panels: [],
  routes: [],
  camera: [
    { at: 0, position: new THREE.Vector3(0.18, 1.82, 3.28), look: new THREE.Vector3(0.06, 1.1, 0.32), zoom: 118 },
    { at: 10, position: new THREE.Vector3(0.12, 1.72, 2.9), look: new THREE.Vector3(0.04, 1.12, 0.34), zoom: 132 },
    { at: 24, position: new THREE.Vector3(0.08, 1.76, 2.98), look: new THREE.Vector3(0.04, 1.18, 0.28), zoom: 128 },
    { at: 43.8, position: new THREE.Vector3(0.16, 1.82, 3.2), look: new THREE.Vector3(0.06, 1.1, 0.32), zoom: 120 },
  ],
}

export function DecisionCopilotExperience() {
  return <ScriptedSceneExperience config={config} />
}

export default DecisionCopilotExperience
