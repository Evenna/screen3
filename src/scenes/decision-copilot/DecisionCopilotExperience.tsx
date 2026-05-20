import * as THREE from 'three'
import { ACTIVE_BLUE, MAIN_BLUE, ScriptedSceneExperience, type ScriptedSceneConfig } from '../_shared/ScriptedSceneExperience'

const config: ScriptedSceneConfig = {
  ariaLabel: '舒适居家书房决策副驾三维场景',
  duration: 42,
  environment: 'cozy-study',
  pose: 'seated-sofa',
  dialogues: [
    { start: 0.8, end: 5.2, kind: 'person', title: '李明', body: '如果我现在换方向，真的会更好吗？', position: [-0.52, 1.6, 0.82] },
    { start: 5.6, end: 10.6, kind: 'voice', title: 'Evans', body: '我把你的长期偏好、关系网络和最近情绪放进同一个视角里看了。你不是没路，只是缺一个第三视角。', position: [-0.52, 1.74, 0.82] },
    { start: 16.0, end: 22.6, kind: 'voice', title: 'Evans', body: '我不会替你做决定，我只把每条路的代价和回报摆清楚。', position: [-0.52, 1.74, 0.82] },
    { start: 27.8, end: 33.4, kind: 'person', title: '李明', body: '这样看，心里终于没那么乱了。', position: [-0.52, 1.6, 0.82] },
  ],
  panels: [
    { id: 'profile', title: '长期画像', subtitle: '稳定偏好', position: [-1.28, 1.84, 0.2], start: 6.0, end: 18.5, variant: 'side', lines: ['重视安全感与自主空间', '对关系变化高度敏感', '长期偏好：稳中求变'] },
    { id: 'simulator', title: '平行人生模拟器', subtitle: '不是替你做决定', position: [0.18, 1.56, 0.44], start: 10.2, end: 30.2, variant: 'main', lines: ['路径 A：继续当前节奏，短期稳定', '路径 B：立即切换，波动大但回报高', '路径 C：先试水 2 周，再决定是否转向'] },
    { id: 'relation', title: '关系网络影响', subtitle: '会被谁影响', position: [1.5, 1.06, 0.74], start: 19.0, end: 36.0, variant: 'warm', lines: ['伴侣：希望你别再长期透支', '朋友：支持先做小规模试验', '家人：更在意你的稳定感'] },
  ],
  routes: [
    { to: [-1.28, 1.84, 0.2], start: 5.4, end: 6.8, holdUntil: 18.5, color: ACTIVE_BLUE },
    { to: [0.18, 1.56, 0.44], start: 9.4, end: 11.0, holdUntil: 30.2, color: MAIN_BLUE, width: 0.006 },
    { to: [1.5, 1.06, 0.74], start: 18.2, end: 19.8, holdUntil: 36.0, color: ACTIVE_BLUE },
  ],
  camera: [
    { at: 0, position: new THREE.Vector3(2.6, 2.06, 3.18), look: new THREE.Vector3(0.02, 1.14, 0.28), zoom: 126 },
    { at: 8, position: new THREE.Vector3(1.82, 1.78, 2.24), look: new THREE.Vector3(0.0, 1.24, 0.42), zoom: 150 },
    { at: 18, position: new THREE.Vector3(2.5, 2.24, 2.96), look: new THREE.Vector3(0.04, 1.5, -0.08), zoom: 128 },
    { at: 41.8, position: new THREE.Vector3(2.14, 1.86, 2.62), look: new THREE.Vector3(0.02, 1.1, 0.34), zoom: 142 },
  ],
}

export function DecisionCopilotExperience() {
  return <ScriptedSceneExperience config={config} />
}

export default DecisionCopilotExperience
