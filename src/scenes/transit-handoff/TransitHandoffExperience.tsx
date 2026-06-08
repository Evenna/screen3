import * as THREE from 'three'
import { ScriptedSceneExperience, type ScriptedSceneConfig } from '../_shared/ScriptedSceneExperience'

const config: ScriptedSceneConfig = {
  ariaLabel: '地铁车厢内李明站立靠扶手看手机三维静态场景',
  duration: 36,
  environment: 'asset-subway',
  pose: 'standing-phone',
  showPerson: true,
  broochMode: 'normal',
  enableOrbitControls: true,
  personSrc: '/models/user-provided/model-assets/subway-person.glb',
  personPosition: [0, 0, 0.24],
  personRotation: [0, -0.12, 0],
  personScale: 1.5,
  camera: [
    { at: 0, position: new THREE.Vector3(2.4, 1.94, 2.88), look: new THREE.Vector3(0.08, 1.18, 0.24), zoom: 130 },
  ],
  dialogues: [],
  panels: [],
  routes: [],
}

export function TransitHandoffExperience() {
  return <ScriptedSceneExperience config={config} />
}

export default TransitHandoffExperience
