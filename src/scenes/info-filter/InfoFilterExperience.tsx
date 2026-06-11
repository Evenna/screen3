import * as THREE from 'three'
import { ScriptedSceneExperience, type ScriptedSceneConfig } from '../_shared/ScriptedSceneExperience'

const config: ScriptedSceneConfig = {
  ariaLabel: '宿舍上床下桌信息过滤三维场景',
  duration: 44,
  environment: 'dorm-loft',
  pose: 'seated-desk',
  showPerson: false,
  dialogues: [],
  panels: [],
  routes: [],
  camera: [
    { at: 0, position: new THREE.Vector3(2.5, 1.84, 2.58), look: new THREE.Vector3(0.54, 0.96, 0.64), zoom: 134 },
    { at: 6.5, position: new THREE.Vector3(2.18, 1.76, 2.34), look: new THREE.Vector3(0.08, 1.36, 0.62), zoom: 146 },
    { at: 12, position: new THREE.Vector3(2.08, 1.64, 2.22), look: new THREE.Vector3(0.1, 1.22, 0.7), zoom: 152 },
    { at: 23.5, position: new THREE.Vector3(2.16, 1.52, 2.16), look: new THREE.Vector3(0.78, 1.0, 0.78), zoom: 150 },
    { at: 30, position: new THREE.Vector3(2.16, 1.56, 2.22), look: new THREE.Vector3(-0.7, 1.0, 0.78), zoom: 148 },
    { at: 39, position: new THREE.Vector3(2.42, 1.78, 2.5), look: new THREE.Vector3(0.2, 1.08, 0.64), zoom: 136 },
  ],
}

export function InfoFilterExperience() {
  return <ScriptedSceneExperience config={config} />
}

export default InfoFilterExperience
