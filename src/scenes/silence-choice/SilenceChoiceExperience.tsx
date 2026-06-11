import * as THREE from 'three'
import { ScriptedSceneExperience, type ScriptedSceneConfig } from '../_shared/ScriptedSceneExperience'

const config: ScriptedSceneConfig = {
  ariaLabel: '深夜公寓窗边 Evans 主动沉默三维静态场景',
  duration: 45,
  environment: 'asset-cozy-study',
  pose: 'seated-sofa',
  personPosition: [0.1, 0.04, 0.72],
  personRotation: [0, -Math.PI / 2, 0],
  personScale: 1.5,
  broochMode: 'delayed',
  disableEnvironmentMotion: true,
  enableOrbitControls: false,
  dialogues: [],
  panels: [
    {
      id: 's15-user-vent',
      title: '李明',
      subtitle: '自语',
      variant: 'mini',
      position: [0.9, 1.42, 0.86],
      start: 0.8,
      end: 5.2,
      lines: ['她又这样,明明知道我今天加班晚……烦死了。'],
    },
    {
      id: 's15-silence-card',
      title: 'Evans 选择不说话',
      subtitle: '后台 · 用户不可见',
      variant: 'mini',
      position: [-0.86, 1.86, 0.72],
      start: 8.4,
      end: 16.8,
      lines: ['情绪:烦躁 · 非危机', '历史模式:类似情境不需要建议', '当前判断:用户在宣泄,不需回应', '介入分数:0.31 < 阈值 0.50', '触发器:30 分钟后再评估'],
    },
    {
      id: 's15-choice-title',
      title: 'Evans 选择不说话。',
      subtitle: '沉默是经过判断后的主动选择',
      variant: 'main',
      position: [0.08, 1.46, 0.9],
      start: 18.0,
      end: 23.8,
      lines: ['无调度动线', '无设备调用', '无主动建议'],
    },
    {
      id: 's15-time',
      title: '时间快进',
      subtitle: '23:32 → 23:50 → 00:05',
      variant: 'mini',
      position: [0.9, 1.05, 0.94],
      start: 24.0,
      end: 31.0,
      lines: ['窗外霓虹渐弱', '车流减少', '胸针保持暗着'],
    },
    {
      id: 's15-user-ask',
      title: '李明',
      subtitle: '主动询问',
      variant: 'mini',
      position: [0.9, 1.42, 0.86],
      start: 32.0,
      end: 35.4,
      lines: ['Evans?你在吗?'],
    },
    {
      id: 's15-evans-reply',
      title: 'Evans',
      subtitle: '此时才回应',
      variant: 'warm',
      position: [-0.82, 1.52, 0.86],
      start: 36.0,
      end: 43.4,
      lines: ['我在。', '你现在想聊聊吗?', '或者我陪你坐着也行。'],
    },
  ],
  routes: [],
  camera: [
    { at: 0, position: new THREE.Vector3(0.18, 1.82, 3.28), look: new THREE.Vector3(0.06, 1.1, 0.32), zoom: 118 },
    { at: 22, position: new THREE.Vector3(0.08, 1.62, 2.84), look: new THREE.Vector3(0.06, 1.12, 0.34), zoom: 136 },
    { at: 36, position: new THREE.Vector3(0.14, 1.78, 3.08), look: new THREE.Vector3(0.06, 1.08, 0.32), zoom: 124 },
  ],
}

export function SilenceChoiceExperience() {
  return <ScriptedSceneExperience config={config} />
}

export default SilenceChoiceExperience
