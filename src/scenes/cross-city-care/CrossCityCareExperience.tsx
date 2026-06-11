import * as THREE from 'three'
import { ScriptedSceneExperience, type ScriptedSceneConfig } from '../_shared/ScriptedSceneExperience'

const config: ScriptedSceneConfig = {
  ariaLabel: '出差酒店跨城叙事化关怀三维静态场景',
  duration: 60,
  environment: 'asset-late-work',
  pose: 'seated-desk',
  showPerson: false,
  disableEnvironmentMotion: true,
  enableOrbitControls: false,
  dialogues: [
    { start: 0.8, end: 4.0, kind: 'person', title: '赵磊', body: 'Evans,我妈最近怎么样?', position: [0.78, 1.46, 0.78] },
    { start: 4.8, end: 11.0, kind: 'voice', title: 'Evans', body: '这周妈妈过得还不错。周一她去广场跳了两个小时舞,回家路上买了她最爱的桂花糕。', position: [-0.86, 1.62, 0.82] },
    { start: 28.6, end: 36.0, kind: 'voice', title: 'Evans', body: '周三我看见她在手机上搜“羊腿怎么炖”——我猜她在想您。她身体一切正常,只是这周比上周稍微安静了一些。', position: [-0.86, 1.62, 0.82] },
    { start: 45.0, end: 48.2, kind: 'person', title: '赵磊', body: '……好,我现在就给她打。', position: [0.78, 1.46, 0.78] },
    { start: 49.0, end: 51.2, kind: 'voice', title: 'Evans', body: '好,我帮您拨过去。', position: [-0.86, 1.62, 0.82] },
  ],
  panels: [
    {
      id: 's14-graph',
      title: '关系图谱跨节点',
      subtitle: '母亲节点点亮',
      variant: 'side',
      position: [-0.92, 1.88, 0.7],
      start: 11.6,
      end: 18.4,
      lines: ['赵磊 ↔ 母亲', '老家｜70 岁｜Evans 已部署 312 天', '授权:基础生活 + 情绪 + 健康整体'],
    },
    {
      id: 's14-filter',
      title: '母亲本周 · 经隐私过滤',
      subtitle: '技术卡片',
      variant: 'side',
      position: [0.92, 1.88, 0.7],
      start: 19.0,
      end: 27.8,
      lines: ['可分享: 生活节奏 / 社交 / 烹饪', '可分享: 对儿子的关心倾向 / 情绪整体趋势', '不可分享: 具体血压数字 / 完整对话 / 搜索网页'],
    },
    {
      id: 's14-letter',
      title: '这周妈妈的样子',
      subtitle: '信件体 · 不是数据看板',
      variant: 'warm',
      position: [0.08, 1.48, 0.9],
      start: 36.5,
      end: 47.8,
      lines: ['周一 · 她去广场跳了两个小时舞,买了桂花糕。', '周二 · 见了王阿姨,俩人喝茶到了傍晚。', '周三 · 她搜索“羊腿怎么炖”——我猜她在想您。', '周五 · 傍晚一个人在阳台坐了挺久,这周稍微安静了一些。', '您下次和她通话时,可以聊聊小时候吃她做的羊腿。'],
    },
    {
      id: 's14-call',
      title: '手机拨号',
      subtitle: '联系人:妈妈',
      variant: 'mini',
      position: [0.86, 0.98, 0.94],
      start: 51.8,
      end: 58.4,
      lines: ['拨号中……', '本周关怀报告已生成', '目的:促成真实联系'],
    },
  ],
  routes: [
    { to: [-0.92, 1.88, 0.7], via: [-0.48, 1.55, 0.62], start: 11.0, end: 12.2, holdUntil: 17.4, color: '#9ed8ff', width: 0.0048 },
    { to: [0.92, 1.88, 0.7], via: [0.48, 1.55, 0.62], start: 18.2, end: 19.4, holdUntil: 26.8, color: '#3f73ff', width: 0.0058 },
    { to: [0.08, 1.48, 0.9], via: [0.04, 1.36, 0.78], start: 35.6, end: 36.8, holdUntil: 46.8, color: '#3f73ff', width: 0.0068 },
    { to: [0.86, 0.98, 0.94], via: [0.48, 1.18, 0.88], start: 51.0, end: 52.2, holdUntil: 57.4, color: '#3f73ff', width: 0.0064 },
  ],
  camera: [
    { at: 0, position: new THREE.Vector3(2.45, 1.7, 2.85), look: new THREE.Vector3(-0.82, 0.92, -0.12), zoom: 108 },
    { at: 30, position: new THREE.Vector3(1.55, 1.38, 2.0), look: new THREE.Vector3(-0.88, 0.88, -0.04), zoom: 142 },
    { at: 50, position: new THREE.Vector3(2.1, 1.62, 2.6), look: new THREE.Vector3(-0.82, 0.88, -0.08), zoom: 116 },
  ],
}

export function CrossCityCareExperience() {
  return <ScriptedSceneExperience config={config} />
}

export default CrossCityCareExperience
