import { ScriptedSceneExperience, type ScriptedSceneConfig } from '../_shared/ScriptedSceneExperience'

const config: ScriptedSceneConfig = {
  ariaLabel: '落地窗办公室决策第三选项三维静态场景',
  duration: 44,
  environment: 'asset-third-option-office',
  pose: 'standing-phone',
  enableOrbitControls: true,
  dialogues: [],
  panels: [],
  routes: [],
}

export function ThirdOptionExperience() {
  return <ScriptedSceneExperience config={config} />
}

export default ThirdOptionExperience
