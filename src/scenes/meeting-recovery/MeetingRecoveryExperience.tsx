import * as THREE from 'three'
import { ScriptedSceneExperience, type ScriptedSceneConfig } from '../_shared/ScriptedSceneExperience'

const config: ScriptedSceneConfig = {
  ariaLabel: '会议室汇报救场三维动画场景',
  duration: 42,
  environment: 'asset-scene6',
  pose: 'seated-desk',
  showPerson: false,
  dialogues: [],
  panels: [],
  routes: [],
  camera: [
    { at: 0, position: new THREE.Vector3(0.5, 1.2, 3.8), look: new THREE.Vector3(0.5, 0.6, 0.2), zoom: 110 },
    { at: 6.2, position: new THREE.Vector3(0.2, 1.08, 3.05), look: new THREE.Vector3(-0.05, 0.86, 0.35), zoom: 138 },
    { at: 13.0, position: new THREE.Vector3(0.42, 1.32, 3.45), look: new THREE.Vector3(0.1, 1.34, 0.04), zoom: 112 },
    { at: 21.5, position: new THREE.Vector3(0.14, 1.12, 3.12), look: new THREE.Vector3(-0.25, 0.98, 0.38), zoom: 138 },
    { at: 31.0, position: new THREE.Vector3(0.55, 1.15, 3.4), look: new THREE.Vector3(0.16, 0.8, 0.24), zoom: 122 },
    { at: 41.8, position: new THREE.Vector3(0.55, 1.15, 3.4), look: new THREE.Vector3(0.16, 0.8, 0.24), zoom: 122 },
  ],
}

export function MeetingRecoveryExperience() {
  return <ScriptedSceneExperience config={config} />
}

export default MeetingRecoveryExperience
