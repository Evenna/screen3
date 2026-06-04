import { ScriptedSceneExperience, type ScriptedSceneConfig } from '../_shared/ScriptedSceneExperience'

const config: ScriptedSceneConfig = {
  ariaLabel: '办公室午休代际翻译三维静态场景',
  duration: 42,
  environment: 'asset-generation-office',
  pose: 'seated-desk',
  showPerson: false,
  enableOrbitControls: true,
  dialogues: [],
  panels: [],
  routes: [],
}

export function GenerationTranslateExperience() {
  return <ScriptedSceneExperience config={config} />
}

export default GenerationTranslateExperience
