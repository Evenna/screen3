import { ScriptedSceneExperience, type ScriptedSceneConfig, ACTIVE_BLUE, MAIN_BLUE } from '../_shared/ScriptedSceneExperience'

const config: ScriptedSceneConfig = {
  ariaLabel: '清晨厨房纪念日提醒三维静态场景',
  duration: 42,
  environment: 'kitchen',
  pose: 'standing-phone',
  dialogues: [
    { start: 0.7, end: 4.5, kind: 'person', title: '李明', body: '今天天气不错……该上班了。' },
    { start: 4.8, end: 6.8, kind: 'voice', title: 'Evans', body: '李明，等一下。' },
    { start: 7.0, end: 12.8, kind: 'voice', title: 'Evans', body: '今天 5 月 18 日。三年前的今天，你跟我说了一句话：“今天小雨终于答应我了”。还记得吗？' },
    { start: 13.1, end: 16.2, kind: 'person', title: '李明', body: '卧槽……我差点又忘了！' },
    { start: 16.5, end: 21.2, kind: 'voice', title: 'Evans', body: '小雨昨晚翻了你们 2022 年的合照 23 张。她在等你今天。' },
    { start: 28.0, end: 34.5, kind: 'voice', title: 'Evans', body: '我没法替你过这段感情。但我陪着你们 213 天，你们值得这一天被记得。' },
  ],
  panels: [
    { id: 'date', title: '关键日期触发', subtitle: '★★★ 极高重要度', position: [-1.1, 2.02, 0.12], start: 5.8, end: 18.5, variant: 'side', lines: ['日历 5 月 18 日高亮', '纪念日：李明 & 小雨 3 周年', '用户亲自标记的人生关键事件'] },
    { id: 'xiaoyu', title: '小雨端 Evans', subtitle: '双端授权', position: [1.1, 2.02, 0.12], start: 8.4, end: 22.0, variant: 'side', lines: ['昨晚 01:00 翻看 2022 合照 23 张', '朋友圈打字一半又删了', '给闺蜜：“明天看他记不记得”'] },
    { id: 'memory', title: '2022 回忆卡', subtitle: '21:47 原始语音', position: [0.16, 1.66, 0.46], start: 12.2, end: 31.5, variant: 'main', lines: ['李明当晚对 Evans 的原话：', '“今天小雨终于答应我了。”', '情感锚点已调取 · 可点击回放'] },
    { id: 'actions', title: '4 选项行动卡', subtitle: '用户选择后执行', position: [1.58, 1.08, 0.72], start: 20.5, end: 39.0, variant: 'warm', lines: ['手写一段话 · 模板 3 套已预备', '下班顺路买花 · 花店 350m', '订她想去的意餐 · 19:30 还有 1 桌', '什么都不做 · 历史风险：冷战 3 天'] },
    { id: 'nav', title: '收尾', subtitle: '已准备', position: [-1.28, 1.0, 0.72], start: 31.0, end: 40.5, variant: 'mini', lines: ['花店地址已发到导航', '粉白渐变 · 小雨偏好色', '等待李明确认'] },
  ],
  routes: [
    { to: [-1.1, 2.02, 0.12], start: 5.4, end: 6.8, holdUntil: 18.5, color: ACTIVE_BLUE },
    { to: [1.1, 2.02, 0.12], start: 7.8, end: 9.3, holdUntil: 22.0, color: ACTIVE_BLUE },
    { to: [0.16, 1.66, 0.46], start: 11.2, end: 12.8, holdUntil: 31.5, color: MAIN_BLUE, width: 0.006 },
    { to: [1.58, 1.08, 0.72], start: 19.6, end: 21.2, holdUntil: 36.0, color: MAIN_BLUE, width: 0.006 },
  ],
}

export function AnniversaryReminderExperience() {
  return <ScriptedSceneExperience config={config} />
}

export default AnniversaryReminderExperience
