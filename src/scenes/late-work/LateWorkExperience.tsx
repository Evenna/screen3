import * as THREE from 'three'
import { ACTIVE_BLUE, MAIN_BLUE, ScriptedSceneExperience, type ScriptedSceneConfig } from '../_shared/ScriptedSceneExperience'

const config: ScriptedSceneConfig = {
  ariaLabel: '家里书房深夜加班三维场景',
  duration: 38,
  environment: 'home-study',
  pose: 'seated-desk',
  dialogues: [
    { start: 0.8, end: 5.0, kind: 'person', title: '李明', body: '还差最后两页……我再熬一下就能发。', position: [-0.52, 1.62, 0.82] },
    { start: 5.4, end: 10.4, kind: 'voice', title: 'Evans', body: '我已经把你今晚要发的内容收成一页重点了。剩下的我来排版，你先别硬撑。', position: [-0.52, 1.74, 0.82] },
    { start: 18.2, end: 24.0, kind: 'voice', title: 'Evans', body: '邮件草稿、数据图和汇报摘要都准备好了。你只需要过一遍，然后去睡。', position: [-0.52, 1.74, 0.82] },
    { start: 28.0, end: 33.5, kind: 'person', title: '李明', body: '好，我看完这页就收工。', position: [-0.52, 1.62, 0.82] },
  ],
  panels: [
    { id: 'summary', title: '书房屏幕摘要', subtitle: '今晚产出已压缩', position: [0.18, 1.56, 0.42], start: 6.0, end: 26.0, variant: 'main', lines: ['今晚输出 3 项：汇报摘要 / 数据图 / 邮件草稿', 'P0 只剩最后确认', '其余内容明早自动续写'] },
    { id: 'shelf', title: '书房资料柜', subtitle: '相关资料已归档', position: [-1.3, 1.18, 0.74], start: 10.0, end: 28.0, variant: 'side', lines: ['Q3 汇报引用 4 份', '历史周报 8 份', '明早继续时自动恢复'] },
    { id: 'sleep', title: '温和收尾', subtitle: '不强行打断', position: [1.48, 1.1, 0.72], start: 22.0, end: 36.0, variant: 'warm', lines: ['定时保存已开启', '23:40 后关闭新消息提醒', '桌面只保留最后一页'] },
  ],
  routes: [
    { to: [0.18, 1.56, 0.42], start: 5.2, end: 6.8, holdUntil: 26.0, color: MAIN_BLUE, width: 0.006 },
    { to: [-1.3, 1.18, 0.74], start: 9.4, end: 10.8, holdUntil: 28.0, color: ACTIVE_BLUE },
    { to: [1.48, 1.1, 0.72], start: 21.2, end: 22.6, holdUntil: 36.0, color: ACTIVE_BLUE },
  ],
  camera: [
    { at: 0, position: new THREE.Vector3(2.58, 2.12, 3.2), look: new THREE.Vector3(0.04, 1.18, 0.16), zoom: 126 },
    { at: 8, position: new THREE.Vector3(1.82, 1.82, 2.28), look: new THREE.Vector3(0.08, 1.32, 0.28), zoom: 152 },
    { at: 18, position: new THREE.Vector3(2.34, 2.2, 2.92), look: new THREE.Vector3(0.02, 1.46, -0.06), zoom: 130 },
    { at: 37.8, position: new THREE.Vector3(2.22, 1.92, 2.72), look: new THREE.Vector3(0.04, 1.08, 0.22), zoom: 140 },
  ],
}

export function LateWorkExperience() {
  return <ScriptedSceneExperience config={config} />
}

export default LateWorkExperience
