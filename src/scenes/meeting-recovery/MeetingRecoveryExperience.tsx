import * as THREE from 'three'
import { ScriptedSceneExperience, type ScriptedSceneConfig, ACTIVE_BLUE, MAIN_BLUE } from '../_shared/ScriptedSceneExperience'

const config: ScriptedSceneConfig = {
  ariaLabel: '会议室汇报救场三维动画场景',
  duration: 42,
  environment: 'meeting-room',
  pose: 'standing-phone',
  dialogues: [
    { start: 0.7, end: 4.8, kind: 'person', title: '李明', body: '马上进会议室了，我怕老板追问留存细节。' },
    { start: 5.2, end: 9.2, kind: 'voice', title: 'Evans', body: '我已经把 Q3 作战卡压缩成 90 秒汇报顺序。先讲结论，再讲三组数字。' },
    { start: 17.5, end: 23.0, kind: 'voice', title: 'Evans', body: '如果老板问预算，你先给 C 方案：小团队先试 2 周，用数据决定扩编。' },
    { start: 29.0, end: 35.5, kind: 'person', title: '李明', body: '好，我就按这个顺序讲。' },
  ],
  panels: [
    { id: 'agenda', title: '会议室投影屏', subtitle: '90 秒开场', position: [0.08, 1.86, -0.02], start: 5.8, end: 38.5, variant: 'main', lines: ['结论：Q3 先修留存，不先加投放', '证据 1：30 天留存 48% → 41%', '证据 2：第 3 天流失最集中', '动作：onboarding / 召回 / 小组试点'] },
    { id: 'boss', title: '可能追问', subtitle: '老板视角', position: [-1.28, 1.24, 0.72], start: 10.2, end: 27.0, variant: 'side', lines: ['为什么不是拉新？', '预算要多少？', '多久能看到效果？'] },
    { id: 'answer', title: '回答提示', subtitle: '不替你说，只提示', position: [1.42, 1.18, 0.72], start: 15.5, end: 36.5, variant: 'warm', lines: ['先试点 2 周', '只要 2 前端 + 1 设计', '用第 3 天留存做唯一指标'] },
  ],
  routes: [
    { to: [0.08, 1.86, -0.02], start: 5.0, end: 6.5, holdUntil: 38.5, color: MAIN_BLUE, width: 0.006 },
    { to: [-1.28, 1.24, 0.72], start: 9.6, end: 11.0, holdUntil: 27.0, color: ACTIVE_BLUE },
    { to: [1.42, 1.18, 0.72], start: 14.8, end: 16.2, holdUntil: 36.5, color: ACTIVE_BLUE },
  ],
  camera: [
    { at: 0, position: new THREE.Vector3(2.72, 2.15, 3.18), look: new THREE.Vector3(0.02, 1.16, 0.1), zoom: 120 },
    { at: 7, position: new THREE.Vector3(1.9, 1.82, 2.3), look: new THREE.Vector3(0.05, 1.38, -0.12), zoom: 148 },
    { at: 18, position: new THREE.Vector3(2.72, 2.32, 3.0), look: new THREE.Vector3(0.08, 1.5, -0.2), zoom: 124 },
    { at: 41.8, position: new THREE.Vector3(2.26, 1.94, 2.72), look: new THREE.Vector3(0.02, 1.12, 0.2), zoom: 136 },
  ],
}

export function MeetingRecoveryExperience() {
  return <ScriptedSceneExperience config={config} />
}

export default MeetingRecoveryExperience
