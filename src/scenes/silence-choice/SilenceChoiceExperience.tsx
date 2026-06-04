import { ScriptedSceneExperience, type ScriptedSceneConfig } from '../_shared/ScriptedSceneExperience'

const config: ScriptedSceneConfig = {
  ariaLabel: '深夜公寓窗边 Evans 主动沉默三维静态场景',
  duration: 42,
  environment: 'asset-quiet-window',
  pose: 'quiet-standing',
  broochMode: 'delayed',
  enableOrbitControls: true,
  dialogues: [],
  panels: [],
  routes: [],
}

export function SilenceChoiceExperience() {
  return <ScriptedSceneExperience config={config} />
}

export default SilenceChoiceExperience
