import { ScriptedSceneExperience, type ScriptedSceneConfig } from '../_shared/ScriptedSceneExperience'

const config: ScriptedSceneConfig = {
  ariaLabel: '深夜公寓窗边 Evans 主动沉默三维静态场景',
  duration: 42,
  environment: 'balcony',
  pose: 'quiet-standing',
  broochMode: 'delayed',
  dialogues: [
    { start: 0.8, end: 5.0, kind: 'person', title: '李明', body: '她又这样，明明知道我今天加班晚……烦死了。' },
    { start: 30.5, end: 33.5, kind: 'person', title: '李明', body: 'Evans？你在吗？' },
    { start: 34.0, end: 39.5, kind: 'voice', title: 'Evans', body: '我在。你现在想聊聊吗？或者我陪你坐着也行。' },
  ],
  panels: [
    { id: 'internal', title: 'Evans 选择不说话', subtitle: '后台 · 用户不可见', position: [1.25, 2.0, 0.12], start: 4.8, end: 18.5, variant: 'mini', lines: ['情绪：烦躁但稳定', '历史模式：类似情境不需要建议', '介入分数：0.31 < 阈值 0.50', '触发器：30 分钟后再评估'] },
    { id: 'center', title: 'Evans 选择不说话。', subtitle: '沉默是主动选择', position: [0, 1.56, 0.52], start: 18.0, end: 26.5, variant: 'main', lines: ['在这个场景下，沉默是 Evans 经过判断后的主动选择。', '无调度动线 · 无设备状态 · 无虚拟工具调用'] },
    { id: 'time', title: '时间快进', subtitle: '23:32 → 00:05', position: [-1.35, 1.02, 0.72], start: 22.0, end: 33.0, variant: 'side', lines: ['窗外霓虹由强转弱', '远处车流减少', '胸针保持完全不亮', '用户自行平复后主动开启'] },
    { id: 'ending', title: '真正成熟的代理 AI', subtitle: '收尾旁白', position: [0.2, 1.86, 0.42], start: 36.0, end: 41.5, variant: 'warm', lines: ['不是看它会说多少话，', '而是看它知不知道', '什么时候应该不说话。'] },
  ],
  routes: [],
}

export function SilenceChoiceExperience() {
  return <ScriptedSceneExperience config={config} />
}

export default SilenceChoiceExperience
