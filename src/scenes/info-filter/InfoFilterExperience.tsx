import * as THREE from 'three'
import { ACTIVE_BLUE, MAIN_BLUE, ScriptedSceneExperience, type ScriptedSceneConfig } from '../_shared/ScriptedSceneExperience'

const config: ScriptedSceneConfig = {
  ariaLabel: '宿舍上床下桌信息过滤三维场景',
  duration: 36,
  environment: 'dorm-loft',
  pose: 'seated-desk',
  dialogues: [
    { start: 0.8, end: 5.2, kind: 'person', title: '李明', body: '一早上消息就爆了，邮件、群聊、文档全是红点。', position: [-0.54, 1.62, 0.82] },
    { start: 5.6, end: 10.0, kind: 'voice', title: 'Evans', body: '我先帮你过滤。真正今天要做的只剩 5 件，其他我归档了。', position: [-0.54, 1.74, 0.82] },
    { start: 15.2, end: 20.6, kind: 'voice', title: 'Evans', body: '宿舍这一小时只看 P0 和 P1，不要让信息洪流把你带跑。', position: [-0.54, 1.74, 0.82] },
    { start: 24.8, end: 30.8, kind: 'person', title: '李明', body: '行，我就按这 5 件来。', position: [-0.54, 1.62, 0.82] },
  ],
  panels: [
    { id: 'sources', title: '四源扫描', subtitle: '邮件 / 群聊 / 文档 / 待办', position: [-1.18, 1.96, 0.18], start: 5.8, end: 17.0, variant: 'side', lines: ['未读 47 条', '其中真正相关 9 条', '高优先级仅 5 条'] },
    { id: 'priority', title: '今日只做这 5 件', subtitle: '宿舍桌前过滤结果', position: [0.18, 1.56, 0.44], start: 9.0, end: 28.5, variant: 'main', lines: ['10:00 前回老板邮件', '午前补交数据截图', '修 brief 两处标红', '确认评审时间', '归档 38 条无关消息'] },
    { id: 'archive', title: '自动归档', subtitle: '其余暂不打扰', position: [1.46, 1.06, 0.74], start: 18.6, end: 33.0, variant: 'warm', lines: ['群提醒静音 1 小时', '文档评论稍后提醒', '低优先级已折叠'] },
  ],
  routes: [
    { to: [-1.18, 1.96, 0.18], start: 5.2, end: 6.6, holdUntil: 17.0, color: ACTIVE_BLUE },
    { to: [0.18, 1.56, 0.44], start: 8.2, end: 9.8, holdUntil: 28.5, color: MAIN_BLUE, width: 0.006 },
    { to: [1.46, 1.06, 0.74], start: 17.8, end: 19.2, holdUntil: 33.0, color: ACTIVE_BLUE },
  ],
  camera: [
    { at: 0, position: new THREE.Vector3(2.34, 2.02, 2.86), look: new THREE.Vector3(0.08, 1.22, 0.02), zoom: 136 },
    { at: 7, position: new THREE.Vector3(1.74, 1.78, 2.1), look: new THREE.Vector3(0.08, 1.2, 0.08), zoom: 164 },
    { at: 18, position: new THREE.Vector3(2.16, 2.12, 2.62), look: new THREE.Vector3(0.08, 1.56, -0.08), zoom: 144 },
    { at: 35.8, position: new THREE.Vector3(2.02, 1.82, 2.36), look: new THREE.Vector3(0.08, 1.04, 0.12), zoom: 152 },
  ],
}

export function InfoFilterExperience() {
  return <ScriptedSceneExperience config={config} />
}

export default InfoFilterExperience
