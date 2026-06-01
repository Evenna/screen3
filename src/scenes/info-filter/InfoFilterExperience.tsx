import * as THREE from 'three'
import { ScriptedSceneExperience, type ScriptedSceneConfig } from '../_shared/ScriptedSceneExperience'

const config: ScriptedSceneConfig = {
  ariaLabel: '宿舍上床下桌信息过滤三维场景',
  duration: 36,
  environment: 'dorm-loft',
  pose: 'seated-desk',
  showPerson: false,
  dialogues: [],
  panels: [],
  routes: [],
  camera: [
    { at: 0, position: new THREE.Vector3(2.58, 2.18, 2.7), look: new THREE.Vector3(1.12, 1.04, 0.92), zoom: 148 },
    { at: 7, position: new THREE.Vector3(2.02, 1.92, 2.18), look: new THREE.Vector3(1.18, 1.02, 0.98), zoom: 168 },
    { at: 18, position: new THREE.Vector3(2.34, 2.12, 2.44), look: new THREE.Vector3(1.08, 1.12, 0.86), zoom: 156 },
    { at: 35.8, position: new THREE.Vector3(2.12, 1.96, 2.26), look: new THREE.Vector3(1.14, 0.98, 0.94), zoom: 164 },
  ],
}

export function InfoFilterExperience() {
  return <ScriptedSceneExperience config={config} />
}

export default InfoFilterExperience
