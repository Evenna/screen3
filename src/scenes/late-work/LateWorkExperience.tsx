import * as THREE from 'three'
import { ScriptedSceneExperience, type ScriptedSceneConfig } from '../_shared/ScriptedSceneExperience'

const config: ScriptedSceneConfig = {
  ariaLabel: '家里书房深夜加班三维场景',
  duration: 52,
  environment: 'asset-late-work',
  pose: 'seated-desk',
  showPerson: false,
  disableEnvironmentMotion: false,
  enableOrbitControls: false,
  dialogues: [],
  panels: [],
  routes: [],
  camera: [
    { at: 0, position: new THREE.Vector3(2.45, 1.7, 2.85), look: new THREE.Vector3(-0.82, 0.92, -0.12), zoom: 108 },
    { at: 8, position: new THREE.Vector3(1.52, 1.34, 2.05), look: new THREE.Vector3(-0.96, 0.9, -0.08), zoom: 142 },
    { at: 18, position: new THREE.Vector3(1.32, 1.28, 1.84), look: new THREE.Vector3(-0.92, 0.86, -0.02), zoom: 150 },
    { at: 31, position: new THREE.Vector3(1.58, 1.36, 2.0), look: new THREE.Vector3(-0.92, 0.88, -0.08), zoom: 140 },
  ],
}

export function LateWorkExperience() {
  return <ScriptedSceneExperience config={config} />
}

export default LateWorkExperience
