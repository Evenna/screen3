import { ScriptedSceneExperience, type ScriptedSceneConfig, ACTIVE_BLUE, MAIN_BLUE } from '../_shared/ScriptedSceneExperience'

const config: ScriptedSceneConfig = {
  ariaLabel: '出差酒店跨城叙事化关怀三维静态场景',
  duration: 44,
  environment: 'balcony',
  pose: 'seated-sofa',
  dialogues: [
    { start: 0.7, end: 4.0, kind: 'person', title: '赵磊', body: 'Evans，我妈最近怎么样？' },
    { start: 5.2, end: 18.0, kind: 'voice', title: 'Evans', body: '这周妈妈过得还不错。周一她去广场跳了两个小时舞，回家路上买了桂花糕。周三她搜“羊腿怎么炖”，我猜她在想您。' },
    { start: 18.4, end: 25.0, kind: 'voice', title: 'Evans', body: '她身体一切正常，只是周五傍晚一个人在阳台坐了挺久，这周比上周稍微安静了一些。' },
    { start: 27.0, end: 31.0, kind: 'person', title: '赵磊', body: '……好，我现在就给她打。' },
    { start: 31.4, end: 33.8, kind: 'voice', title: 'Evans', body: '好，我帮您拨过去。' },
  ],
  panels: [
    { id: 'graph', title: '关系图谱跨节点', subtitle: '老家母亲节点', position: [-1.1, 2.02, 0.12], start: 4.8, end: 17.5, variant: 'side', lines: ['赵磊 ↔ 母亲', '老家｜70 岁｜Evans 已部署 312 天', '授权：基础生活 + 情绪 + 健康整体'] },
    { id: 'privacy', title: '母亲端本周数据', subtitle: '经隐私过滤', position: [1.1, 2.02, 0.12], start: 7.0, end: 21.5, variant: 'side', lines: ['可分享：运动 / 社交 / 烹饪', '可分享：对儿子的关心倾向', '可分享：健康整体状态无异常', '不可分享：具体血压数字 / 完整对话'] },
    { id: 'letter', title: '这周妈妈的样子', subtitle: '信件体 · 非数据看板', position: [0.16, 1.7, 0.46], start: 10.5, end: 37.5, variant: 'main', lines: ['周一：跳了两个小时舞，买了桂花糕。', '周二：和王阿姨喝茶到傍晚。', '周三：搜“羊腿怎么炖”，我猜她在想您。', '周五：一个人在阳台坐了挺久。', '下次通话可以聊您小时候吃她做的羊腿。'] },
    { id: 'call', title: '手机拨号', subtitle: '妈妈', position: [1.52, 1.02, 0.72], start: 31.0, end: 42.0, variant: 'warm', lines: ['拨号中……', '目的：促成真实联系', 'Evans 不取代这通电话'] },
  ],
  routes: [
    { to: [-1.1, 2.02, 0.12], start: 4.2, end: 5.8, holdUntil: 17.5, color: ACTIVE_BLUE },
    { to: [1.1, 2.02, 0.12], start: 6.4, end: 8.0, holdUntil: 21.5, color: '#3f73ff' },
    { to: [0.16, 1.7, 0.46], start: 10.0, end: 11.6, holdUntil: 37.5, color: MAIN_BLUE, width: 0.006 },
    { to: [1.52, 1.02, 0.72], start: 30.2, end: 31.7, holdUntil: 38.0, color: MAIN_BLUE, width: 0.006 },
  ],
}

export function CrossCityCareExperience() {
  return <ScriptedSceneExperience config={config} />
}

export default CrossCityCareExperience
