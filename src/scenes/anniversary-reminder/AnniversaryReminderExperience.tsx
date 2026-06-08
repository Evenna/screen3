import { ScriptedSceneExperience, type ScriptedSceneConfig } from '../_shared/ScriptedSceneExperience'

const config: ScriptedSceneConfig = {
  ariaLabel: '清晨厨房纪念日提醒三维静态场景',
  duration: 42,
  environment: 'asset-morning-kitchen',
  pose: 'standing-phone',
  showPerson: false,
  enableOrbitControls: true,
  dialogues: [],
  panels: [],
  routes: [],
}

export function AnniversaryReminderExperience() {
  return <ScriptedSceneExperience config={config} />
}

export default AnniversaryReminderExperience
