import * as THREE from 'three'
import { ScriptedSceneExperience, type ScriptedSceneConfig } from '../_shared/ScriptedSceneExperience'

const config: ScriptedSceneConfig = {
  ariaLabel: '落地窗办公室决策第三选项三维静态场景',
  duration: 65,
  environment: 'asset-scene6',
  pose: 'seated-desk',
  showPerson: false,
  disableEnvironmentMotion: true,
  enableOrbitControls: false,
  dialogues: [
    { start: 0.8, end: 6.8, kind: 'person', title: '苏婷', body: 'Evans,老板让我后天飞深圳见个客户,但我女儿后天幼儿园有家长会……我在两小时内要回复。', position: [0.86, 1.5, 0.78] },
    { start: 7.2, end: 11.0, kind: 'voice', title: 'Evans', body: '苏婷,先别急着回复。我看了时间表,你可能不需要二选一。', position: [-0.74, 1.64, 0.82] },
    { start: 29.8, end: 35.0, kind: 'voice', title: 'Evans', body: '我看了客户上周行程,他周三晚上本来就在深圳。我可以帮你起草邮件,建议把见面调到晚上。', position: [-0.74, 1.64, 0.82] },
    { start: 50.2, end: 56.2, kind: 'voice', title: 'Evans', body: '这只是选项 C,最后怎么选你来定。我已经把航班、专车、邮件、家长会签到全部准备好了,你点确认就行。', position: [-0.74, 1.64, 0.82] },
  ],
  panels: [
    {
      id: 's13-work',
      title: '工作侧扫描',
      subtitle: '汇聚来源',
      variant: 'side',
      position: [-0.9, 1.92, 0.7],
      start: 11.6,
      end: 18.4,
      lines: ['客户:年合作 800 万 · A 级', '老板本月提及 4 次', '客户上周公开行程:周三晚在深圳本地'],
    },
    {
      id: 's13-family',
      title: '家庭侧扫描',
      subtitle: '汇聚来源',
      variant: 'side',
      position: [0.9, 1.92, 0.7],
      start: 11.8,
      end: 18.6,
      lines: ['女儿:本学期第一次家长会', '丈夫:广州出差 · 后天不在', '婆婆:可备用 · 15 分钟可到', '历史:上次错过演出 → 女儿哭'],
    },
    {
      id: 's13-options',
      title: 'A / B / C 三选项对比',
      subtitle: 'C 选项被发现',
      variant: 'main',
      position: [0.08, 1.58, 0.86],
      start: 19.4,
      end: 30.0,
      lines: ['A 全力去: 工作 ✓ / 家庭 ✗ / 心理自责', 'B 留家: 家庭 ✓ / 工作中险 / 担客户', 'C 协调: 工作 ✓ / 家庭 ✓ / 心理平衡'],
    },
    {
      id: 's13-schedule',
      title: 'C 选项 · 后天具体安排',
      subtitle: '详细时刻表',
      variant: 'main',
      position: [0.08, 1.12, 0.94],
      start: 35.6,
      end: 49.4,
      lines: ['09:00-14:00 上海工作', '15:00-16:30 女儿幼儿园家长会', '16:40 专车待命 → 浦东机场', '17:50 航班 → 深圳 / 19:30 见客户 / 22:30 返沪'],
    },
    {
      id: 's13-actions',
      title: '已暂存 · 未确认前不会执行',
      subtitle: '4 个待执行动作',
      variant: 'mini',
      position: [0.96, 0.96, 0.96],
      start: 56.8,
      end: 63.8,
      lines: ['午班航班 17:50 · 待确认', '专车 16:40 浦东 · 待确认', '给客户的邮件 · 待确认', '家长会签到 · 待确认'],
    },
  ],
  routes: [
    { to: [-0.9, 1.92, 0.7], via: [-0.45, 1.58, 0.62], start: 11.0, end: 12.2, holdUntil: 17.6, color: '#9ed8ff', width: 0.0048 },
    { to: [0.9, 1.92, 0.7], via: [0.45, 1.58, 0.62], start: 11.2, end: 12.4, holdUntil: 17.8, color: '#9ed8ff', width: 0.0048 },
    { to: [0.08, 1.58, 0.86], via: [0.0, 1.78, 0.74], start: 18.4, end: 19.8, holdUntil: 29.0, color: '#3f73ff', width: 0.0068 },
    { to: [0.08, 1.12, 0.94], via: [0.08, 1.34, 0.9], start: 34.8, end: 36.0, holdUntil: 48.2, color: '#3f73ff', width: 0.0068 },
    { to: [0.96, 0.96, 0.96], via: [0.54, 1.02, 0.96], start: 56.0, end: 57.2, holdUntil: 62.8, color: '#9ed8ff', width: 0.0048 },
  ],
  camera: [
    { at: 0, position: new THREE.Vector3(2.4, 2.45, 3.1), look: new THREE.Vector3(0.06, 0.82, 0.28), zoom: 118 },
    { at: 24, position: new THREE.Vector3(1.75, 2.06, 2.68), look: new THREE.Vector3(0.08, 1.1, 0.34), zoom: 138 },
    { at: 50, position: new THREE.Vector3(2.18, 2.26, 3.0), look: new THREE.Vector3(0.06, 0.98, 0.28), zoom: 124 },
  ],
}

export function ThirdOptionExperience() {
  return <ScriptedSceneExperience config={config} />
}

export default ThirdOptionExperience
