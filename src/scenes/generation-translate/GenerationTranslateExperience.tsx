import * as THREE from 'three'
import { ScriptedSceneExperience, type ScriptedSceneConfig } from '../_shared/ScriptedSceneExperience'

const config: ScriptedSceneConfig = {
  ariaLabel: '办公室午休代际翻译三维静态场景',
  duration: 60,
  environment: 'asset-scene6',
  pose: 'seated-desk',
  showPerson: false,
  disableEnvironmentMotion: true,
  enableOrbitControls: false,
  dialogues: [
    { start: 0.8, end: 6.2, kind: 'person', title: '周慧芳', body: '我妈又给我打电话,让我别老点外卖,说血压会高……她怎么这么唠叨啊。', position: [0.82, 1.5, 0.78] },
    { start: 6.8, end: 10.0, kind: 'voice', title: 'Evans', body: '慧芳,我想让你看一下妈妈这周的状态。', position: [-0.72, 1.64, 0.82] },
    { start: 27.2, end: 31.2, kind: 'voice', title: 'Evans', body: '她不是真的在唠叨外卖,她在担心。', position: [-0.72, 1.64, 0.82] },
    { start: 36.0, end: 38.6, kind: 'person', title: '周慧芳', body: '……原来是这样啊。', position: [0.82, 1.5, 0.78] },
    { start: 43.0, end: 48.2, kind: 'voice', title: 'Evans', body: '要不要给妈妈打个电话?不用提她血压的事,就聊聊你今天的事,她会安心。', position: [-0.72, 1.64, 0.82] },
    { start: 50.0, end: 52.4, kind: 'person', title: '周慧芳', body: '好,我现在打。', position: [0.82, 1.5, 0.78] },
  ],
  panels: [
    {
      id: 's12-graph',
      title: '关系图谱跨节点',
      subtitle: '母亲节点点亮',
      variant: 'side',
      position: [-0.88, 1.9, 0.7],
      start: 10.6,
      end: 18.2,
      lines: ['周慧芳 ↔ 母亲', '老家｜72 岁｜Evans 已部署 487 天', '授权层级:基础情绪 + 健康关心'],
    },
    {
      id: 's12-status',
      title: '母亲本周 · 经隐私过滤',
      subtitle: '可分享 / 不可分享',
      variant: 'side',
      position: [0.92, 1.9, 0.7],
      start: 18.8,
      end: 27.0,
      lines: ['可分享: 搜索高血压 6 次 / 年轻人长期吃外卖 3 次', '可分享: 身体有些不舒服,但没告诉您', '不可分享: 具体血压数字 / 完整对话 / 具体网页'],
    },
    {
      id: 's12-translate',
      title: '代际翻译',
      subtitle: '表面 → 真实',
      variant: 'main',
      position: [0.08, 1.55, 0.86],
      start: 31.8,
      end: 42.2,
      lines: ['表面:“别老点外卖,血压会高!”', 'Evans 翻译', '真实:“我自己这周不舒服,但我不想告诉你。”', '“我担心你,我只是不知道怎么开口。”'],
    },
    {
      id: 's12-call',
      title: '手机拨号',
      subtitle: '联系人:妈妈',
      variant: 'mini',
      position: [0.86, 1.0, 0.94],
      start: 52.6,
      end: 58.6,
      lines: ['拨号中……', 'Evans 已退出监听', '本通话不被记录'],
    },
  ],
  routes: [
    { to: [-0.88, 1.9, 0.7], via: [-0.42, 1.58, 0.62], start: 10.0, end: 11.2, holdUntil: 17.2, color: '#9ed8ff', width: 0.0048 },
    { to: [0.92, 1.9, 0.7], via: [0.42, 1.58, 0.62], start: 18.0, end: 19.2, holdUntil: 26.0, color: '#3f73ff', width: 0.0058 },
    { to: [0.08, 1.55, 0.86], via: [0.08, 1.42, 0.72], start: 30.8, end: 32.0, holdUntil: 41.0, color: '#3f73ff', width: 0.0068 },
    { to: [0.86, 1.0, 0.94], via: [0.46, 1.24, 0.86], start: 51.8, end: 53.0, holdUntil: 57.8, color: '#3f73ff', width: 0.0064 },
  ],
  camera: [
    { at: 0, position: new THREE.Vector3(2.4, 2.45, 3.1), look: new THREE.Vector3(0.06, 0.82, 0.28), zoom: 118 },
    { at: 24, position: new THREE.Vector3(1.85, 2.1, 2.72), look: new THREE.Vector3(0.1, 1.1, 0.34), zoom: 136 },
    { at: 48, position: new THREE.Vector3(2.2, 2.32, 3.02), look: new THREE.Vector3(0.08, 0.96, 0.28), zoom: 122 },
  ],
}

export function GenerationTranslateExperience() {
  return <ScriptedSceneExperience config={config} />
}

export default GenerationTranslateExperience
