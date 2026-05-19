import { ScriptedSceneExperience, type ScriptedSceneConfig, ACTIVE_BLUE, MAIN_BLUE } from '../_shared/ScriptedSceneExperience'

const config: ScriptedSceneConfig = {
  ariaLabel: '落地窗办公室决策第三选项三维静态场景',
  duration: 44,
  environment: 'city-link',
  pose: 'standing-phone',
  dialogues: [
    { start: 0.7, end: 5.8, kind: 'person', title: '苏婷', body: 'Evans，老板让我后天飞深圳见个客户，但我女儿后天幼儿园有家长会……我在两小时内要回复。' },
    { start: 6.0, end: 10.0, kind: 'voice', title: 'Evans', body: '苏婷，先别急着回复。我看了时间表，你可能不需要二选一。' },
    { start: 17.5, end: 23.0, kind: 'voice', title: 'Evans', body: '我看了客户上周行程，他周三晚上本来就在深圳。我可以帮你起草邮件，建议把见面调到晚上。' },
    { start: 27.0, end: 35.0, kind: 'voice', title: 'Evans', body: '这只是选项 C，最后怎么选你来定。我已经把航班、专车、客户邮件、家长会签到全部准备好了。' },
  ],
  panels: [
    { id: 'work', title: '工作侧扫描', subtitle: 'A 级客户', position: [-1.1, 2.02, 0.12], start: 6.5, end: 18.5, variant: 'side', lines: ['客户：年合作 800 万', '老板本月提及 4 次', '客户周三晚在深圳本地'] },
    { id: 'family', title: '家庭侧扫描', subtitle: '女儿家长会', position: [1.1, 2.02, 0.12], start: 7.0, end: 18.5, variant: 'side', lines: ['本学期第一次家长会', '丈夫广州出差', '上次错过演出 → 女儿哭'] },
    { id: 'compare', title: 'A / B / C 三选项', subtitle: 'C 选项被发现', position: [0.16, 1.72, 0.46], start: 12.0, end: 37.0, variant: 'main', lines: ['A 全力去：工作 ✓｜家庭 ✗｜心理自责', 'B 留家：家庭 ✓｜工作中险｜担心客户', 'C 协调 ⭐：工作 ✓｜家庭 ✓｜心理平衡'] },
    { id: 'timeline', title: 'C 选项时刻表', subtitle: '可执行路径', position: [-1.34, 1.08, 0.72], start: 19.0, end: 39.5, variant: 'warm', lines: ['15:00-16:30 女儿家长会全程', '16:40 专车 → 浦东机场', '17:50 飞深圳', '19:30 客户晚餐会', '22:30 返沪'] },
    { id: 'pending', title: '待执行动作', subtitle: '未确认不执行', position: [1.52, 1.08, 0.72], start: 24.0, end: 41.5, variant: 'side', lines: ['午班航班 17:50 · 待确认', '专车 16:40 · 待确认', '给客户邮件 · 待确认', '家长会签到 · 待确认'] },
  ],
  routes: [
    { to: [-1.1, 2.02, 0.12], start: 6.0, end: 7.5, holdUntil: 18.5, color: ACTIVE_BLUE },
    { to: [1.1, 2.02, 0.12], start: 6.3, end: 7.8, holdUntil: 18.5, color: ACTIVE_BLUE },
    { to: [0.16, 1.72, 0.46], start: 11.2, end: 13.0, holdUntil: 37.0, color: MAIN_BLUE, width: 0.006 },
    { to: [-1.34, 1.08, 0.72], start: 18.2, end: 19.7, holdUntil: 39.5, color: MAIN_BLUE, width: 0.006 },
    { to: [1.52, 1.08, 0.72], start: 23.2, end: 24.8, holdUntil: 39.5, color: ACTIVE_BLUE },
  ],
}

export function ThirdOptionExperience() {
  return <ScriptedSceneExperience config={config} />
}

export default ThirdOptionExperience
