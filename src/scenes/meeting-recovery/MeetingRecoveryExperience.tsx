import * as THREE from 'three'
import { ScriptedSceneExperience, type ScriptedSceneConfig } from '../_shared/ScriptedSceneExperience'

const config: ScriptedSceneConfig = {
  ariaLabel: '会议室汇报救场三维动画场景',
  duration: 46,
  environment: 'asset-scene6',
  pose: 'seated-desk',
  showPerson: false,
  dialogues: [],
  panels: [],
  routes: [],
  camera: [
    // 0s — 俯拍建立大景：高位俯视人物 + 工位
    { at: 0, position: new THREE.Vector3(2.4, 2.45, 3.1), look: new THREE.Vector3(0.06, 0.82, 0.28), zoom: 118 },
    // 2s — 推近俯拍特写：人物上半身/胸针
    { at: 2.0, position: new THREE.Vector3(1.3, 2.1, 2.45), look: new THREE.Vector3(-0.02, 0.98, 0.42), zoom: 158 },
    // 5.5s — 持续俯拍特写，Evans 开口
    { at: 5.5, position: new THREE.Vector3(1.05, 2.05, 2.4), look: new THREE.Vector3(-0.06, 0.96, 0.44), zoom: 162 },
    // 10s — 拉出上扬，俯视扇形扫描卡全景
    { at: 10.0, position: new THREE.Vector3(0.25, 2.2, 2.82), look: new THREE.Vector3(0.04, 1.42, 0.08), zoom: 126 },
    // 14.5s — 右移，俯视跟随汇聚线
    { at: 14.5, position: new THREE.Vector3(0.82, 2.05, 2.62), look: new THREE.Vector3(0.72, 1.28, 0.36), zoom: 146 },
    // 19.5s — 回中俯视，等待作战卡
    { at: 19.5, position: new THREE.Vector3(0.52, 2.02, 2.54), look: new THREE.Vector3(0.22, 1.16, 0.38), zoom: 152 },
    // 27s — 略宽俯视，右下静默 toast 入画
    { at: 27.0, position: new THREE.Vector3(0.52, 2.05, 2.82), look: new THREE.Vector3(0.22, 1.02, 0.26), zoom: 138 },
    // 35s — 推近俯拍收尾特写，Evans 暖光
    { at: 35.0, position: new THREE.Vector3(1.15, 2.05, 2.46), look: new THREE.Vector3(-0.02, 0.98, 0.42), zoom: 159 },
    // 40s — 缓缓拉出俯拍
    { at: 40.0, position: new THREE.Vector3(1.82, 2.28, 3.05), look: new THREE.Vector3(0.1, 0.9, 0.28), zoom: 118 },
    // 46s — 最终俯拍大景，与开场呼应
    { at: 46.0, position: new THREE.Vector3(2.65, 2.68, 3.42), look: new THREE.Vector3(0.1, 0.82, 0.2), zoom: 104 },
  ],
}

export function MeetingRecoveryExperience() {
  return <ScriptedSceneExperience config={config} />
}

export default MeetingRecoveryExperience
