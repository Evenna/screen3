import * as THREE from 'three'
import { ScriptedSceneExperience, type ScriptedSceneConfig } from '../_shared/ScriptedSceneExperience'

const config: ScriptedSceneConfig = {
  ariaLabel: '家里书房深夜加班三维场景',
  duration: 52,
  environment: 'asset-late-work',
  pose: 'seated-desk',
  showPerson: false,
  disableEnvironmentMotion: true,
  enableOrbitControls: true,
  dialogues: [],
  panels: [],
  routes: [],
  camera: [
    { at: 0, position: new THREE.Vector3(2.95, 1.9, 3.35), look: new THREE.Vector3(-0.12, 1.05, -0.34), zoom: 92 },
  ],
}

export function LateWorkExperience() {
  return <ScriptedSceneExperience config={config} />
}

export default LateWorkExperience
