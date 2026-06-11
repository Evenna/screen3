import * as THREE from 'three'
import { ScriptedSceneExperience, type ScriptedSceneConfig } from '../_shared/ScriptedSceneExperience'

const config: ScriptedSceneConfig = {
  ariaLabel: '清晨厨房纪念日提醒三维静态场景',
  duration: 55,
  environment: 'asset-morning-kitchen',
  pose: 'standing-phone',
  showPerson: false,
  enableOrbitControls: false,
  dialogues: [
    { start: 0.8, end: 4.2, kind: 'person', title: '李明', body: '今天天气不错……该上班了。', position: [0.86, 1.5, 0.78] },
    { start: 4.8, end: 6.8, kind: 'voice', title: 'Evans', body: '李明,等一下。', position: [-0.7, 1.62, 0.82] },
    { start: 14.2, end: 19.5, kind: 'voice', title: 'Evans', body: '今天 5 月 18 日。三年前的今天,你跟我说了一句话——今天小雨终于答应我了。还记得吗?', position: [-0.7, 1.62, 0.82] },
    { start: 23.4, end: 26.4, kind: 'person', title: '李明', body: '卧槽……我差点又忘了!', position: [0.86, 1.5, 0.78] },
    { start: 31.0, end: 35.0, kind: 'voice', title: 'Evans', body: '小雨昨晚翻了你们 2022 年的合照 23 张。她在等你今天。', position: [-0.7, 1.62, 0.82] },
    { start: 43.0, end: 48.0, kind: 'voice', title: 'Evans', body: '我没法替你过这段感情。但我陪着你们 213 天,你们值得这一天被记得。', position: [-0.7, 1.62, 0.82] },
  ],
  panels: [
    {
      id: 's11-date',
      title: '关键日期触发',
      subtitle: '5 月 18 日',
      variant: 'side',
      position: [-0.92, 1.92, 0.72],
      start: 7.2,
      end: 13.6,
      lines: ['日历格闪烁高亮', '★★★ 极高重要度 · 用户亲自标记', '纪念日:李明 & 小雨 在一起 3 周年'],
    },
    {
      id: 's11-memory',
      title: '2022 回忆卡',
      subtitle: '2022.5.18 · 21:47',
      variant: 'main',
      position: [0.14, 1.58, 0.86],
      start: 20.0,
      end: 28.8,
      lines: ['李明当晚对 Evans 的原话:', '“今天小雨终于答应我了”', '原始语音片段已调取'],
    },
    {
      id: 's11-xiaoyu',
      title: '小雨端 Evans 已授权分享',
      subtitle: '双端授权',
      variant: 'side',
      position: [0.92, 1.92, 0.72],
      start: 29.4,
      end: 38.8,
      lines: ['昨晚 01:00 · 翻看 2022 年合照 23 张', '01:34 · 朋友圈打字一半又删了', '02:08 · 给闺蜜微信:明天看他记不记得', '信号:她正在测试你'],
    },
    {
      id: 's11-actions',
      title: '你可以选择的',
      subtitle: '4 个行动选项',
      variant: 'main',
      position: [0.1, 1.1, 0.92],
      start: 39.5,
      end: 53.0,
      lines: ['手写一段话 · 模板 3 套已预备', '下班顺路买花 · 花店 350m · 粉白渐变', '订她想去的意餐 · 今晚 19:30 还有 1 桌', '什么都不做 · 不推荐 · 历史风险:冷战 3 天'],
    },
  ],
  routes: [
    { to: [-0.92, 1.92, 0.72], via: [-0.48, 1.58, 0.66], start: 6.6, end: 7.8, holdUntil: 12.8, color: '#9ed8ff', width: 0.0048 },
    { to: [0.14, 1.58, 0.86], via: [0.0, 1.42, 0.72], start: 19.0, end: 20.2, holdUntil: 27.8, color: '#3f73ff', width: 0.0068 },
    { to: [0.92, 1.92, 0.72], via: [0.48, 1.58, 0.66], start: 28.6, end: 29.8, holdUntil: 37.6, color: '#9ed8ff', width: 0.0048 },
    { to: [0.1, 1.1, 0.92], via: [0.14, 1.32, 0.82], start: 38.8, end: 40.0, holdUntil: 51.5, color: '#3f73ff', width: 0.0068 },
  ],
  camera: [
    { at: 0, position: new THREE.Vector3(2.3, 1.78, 3.0), look: new THREE.Vector3(0.0, 1.05, 0.2), zoom: 116 },
    { at: 18, position: new THREE.Vector3(1.85, 1.6, 2.55), look: new THREE.Vector3(0.04, 1.18, 0.34), zoom: 132 },
    { at: 38, position: new THREE.Vector3(2.05, 1.7, 2.85), look: new THREE.Vector3(0.02, 1.06, 0.3), zoom: 120 },
  ],
}

export function AnniversaryReminderExperience() {
  return <ScriptedSceneExperience config={config} />
}

export default AnniversaryReminderExperience
