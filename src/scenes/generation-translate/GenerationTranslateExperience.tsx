import { ScriptedSceneExperience, type ScriptedSceneConfig, ACTIVE_BLUE, MAIN_BLUE } from '../_shared/ScriptedSceneExperience'

const config: ScriptedSceneConfig = {
  ariaLabel: '办公室午休代际翻译三维静态场景',
  duration: 42,
  environment: 'study',
  pose: 'seated-desk',
  dialogues: [
    { start: 0.7, end: 5.5, kind: 'person', title: '周慧芳', body: '我妈又给我打电话，让我别老点外卖，说血压会高……她怎么这么唠叨啊。' },
    { start: 5.8, end: 8.8, kind: 'voice', title: 'Evans', body: '慧芳，我想让你看一下妈妈这周的状态。' },
    { start: 13.0, end: 16.5, kind: 'voice', title: 'Evans', body: '她不是真的在唠叨外卖，她在担心。' },
    { start: 17.0, end: 20.0, kind: 'person', title: '周慧芳', body: '……原来是这样啊。' },
    { start: 23.0, end: 29.0, kind: 'voice', title: 'Evans', body: '要不要给妈妈打个电话？不用提她血压的事，就聊聊你今天的事，她会安心。' },
    { start: 29.5, end: 32.0, kind: 'person', title: '周慧芳', body: '好，我现在打。' },
  ],
  panels: [
    { id: 'graph', title: '关系图谱跨节点', subtitle: '母亲节点点亮', position: [-1.1, 2.02, 0.12], start: 6.5, end: 18.5, variant: 'side', lines: ['周慧芳 ↔ 母亲', '老家｜72 岁｜Evans 已部署 487 天', '授权层级：基础情绪 + 健康关心'] },
    { id: 'privacy', title: '母亲端状态卡', subtitle: '经隐私过滤', position: [1.1, 2.02, 0.12], start: 8.5, end: 23.5, variant: 'side', lines: ['可分享：本周搜索“高血压”6 次', '可分享：身体有些不舒服，但没告诉您', '不可分享：具体血压数字 / 完整对话 / 搜索网页'] },
    { id: 'translate', title: '代际翻译卡', subtitle: '表面 → 真实', position: [0.16, 1.66, 0.46], start: 12.2, end: 34.0, variant: 'main', lines: ['表面：“别老点外卖，血压会高！”', 'Evans 翻译：', '“我自己这周不舒服，但我不想告诉你。”', '“我担心你，只是不知道怎么开口。”'] },
    { id: 'call', title: '手机拨号', subtitle: '妈妈', position: [1.52, 1.02, 0.72], start: 30.0, end: 40.0, variant: 'warm', lines: ['拨号中……', 'Evans 已退出监听', '本通话不被记录'] },
  ],
  routes: [
    { to: [-1.1, 2.02, 0.12], start: 6.0, end: 7.5, holdUntil: 18.5, color: ACTIVE_BLUE },
    { to: [1.1, 2.02, 0.12], start: 7.8, end: 9.2, holdUntil: 23.5, color: '#3f73ff' },
    { to: [0.16, 1.66, 0.46], start: 11.4, end: 13.0, holdUntil: 34.0, color: MAIN_BLUE, width: 0.006 },
    { to: [1.52, 1.02, 0.72], start: 29.0, end: 30.4, holdUntil: 36.5, color: MAIN_BLUE, width: 0.006 },
  ],
}

export function GenerationTranslateExperience() {
  return <ScriptedSceneExperience config={config} />
}

export default GenerationTranslateExperience
