import { ScriptedSceneExperience, type ScriptedSceneConfig } from '../_shared/ScriptedSceneExperience'

const config: ScriptedSceneConfig = {
  ariaLabel: '出差酒店跨城叙事化关怀三维静态场景',
  duration: 44,
  environment: 'asset-hotel-care',
  pose: 'seated-sofa',
  dialogues: [],
  panels: [],
  routes: [],
}

export function CrossCityCareExperience() {
  return <ScriptedSceneExperience config={config} />
}

export default CrossCityCareExperience
