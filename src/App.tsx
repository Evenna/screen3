import { Suspense, lazy, useEffect, useState } from 'react'
import './App.css'
import SceneEditorExperience from './scenes/scene-editor/SceneEditorExperience'
import { preloadSharedModelAssets } from './scenes/_shared/ScriptedSceneExperience'

const sceneLoaders = {
  livingRoom: () => import('./scenes/living-room').then((module) => ({ default: module.LivingRoomExperience })),
  parkChess: () => import('./scenes/park-chess').then((module) => ({ default: module.ParkChessExperience })),
  homeDispatch: () => import('./scenes/home-dispatch').then((module) => ({ default: module.HomeDispatchExperience })),
  livingCall: () => import('./scenes/living-call').then((module) => ({ default: module.LivingCallExperience })),
  openOffice: () => import('./scenes/open-office').then((module) => ({ default: module.OpenOfficeExperience })),
  meetingRecovery: () => import('./scenes/meeting-recovery').then((module) => ({ default: module.MeetingRecoveryExperience })),
  lateWork: () => import('./scenes/late-work').then((module) => ({ default: module.LateWorkExperience })),
  infoFilter: () => import('./scenes/info-filter').then((module) => ({ default: module.InfoFilterExperience })),
  decisionCopilot: () => import('./scenes/decision-copilot').then((module) => ({ default: module.DecisionCopilotExperience })),
  transitHandoff: () => import('./scenes/transit-handoff').then((module) => ({ default: module.TransitHandoffExperience })),
  anniversaryReminder: () => import('./scenes/anniversary-reminder').then((module) => ({ default: module.AnniversaryReminderExperience })),
  generationTranslate: () => import('./scenes/generation-translate').then((module) => ({ default: module.GenerationTranslateExperience })),
  thirdOption: () => import('./scenes/third-option').then((module) => ({ default: module.ThirdOptionExperience })),
  crossCityCare: () => import('./scenes/cross-city-care').then((module) => ({ default: module.CrossCityCareExperience })),
  silenceChoice: () => import('./scenes/silence-choice').then((module) => ({ default: module.SilenceChoiceExperience })),
}

const scenes = [
  {
    path: '/living-room',
    title: '客厅场景',
    eyebrow: 'Scene 01',
    description: '家庭剖面空间、摔倒老人、Evans 胸针与紧急调度动线。',
    component: lazy(sceneLoaders.livingRoom),
  },
  {
    path: '/park-chess',
    title: '公园下棋',
    eyebrow: 'Scene 02',
    description: '午后公园棋局、关系候选节点、手机日程草稿与地点锚点。',
    component: lazy(sceneLoaders.parkChess),
  },
  {
    path: '/home-dispatch',
    title: '家庭调度',
    eyebrow: 'Scene 03',
    description: '半透家庭平面图、机器人取药、环境调度与跨端通报编辑器。',
    component: lazy(sceneLoaders.homeDispatch),
  },
  {
    path: '/living-call',
    title: '客厅通话',
    eyebrow: 'Scene 04',
    description: '客厅静态建模：陈建国坐沙发贴耳通话，Evans 黄色警示光，桌上眼镜与茶杯。',
    component: lazy(sceneLoaders.livingCall),
  },
  {
    path: '/open-office',
    title: '开放办公室',
    eyebrow: 'Scene 05',
    description: '李明坐在工位电脑前双手扶头，胸前 Evans 微光，桌面设备与虚化同事工位。',
    component: lazy(sceneLoaders.openOffice),
  },

  {
    path: '/meeting-recovery',
    title: '会议室救场',
    eyebrow: 'Scene 06',
    description: '会议室门口到汇报屏幕，Evans 将作战卡压缩为 90 秒开场顺序。',
    component: lazy(sceneLoaders.meetingRecovery),
  },
  {
    path: '/late-work',
    title: '深夜加班',
    eyebrow: 'Scene 07',
    description: '凌晨书房、疲惫加班的李明、产出数据卡与温和睡眠调度。',
    component: lazy(sceneLoaders.lateWork),
  },
  {
    path: '/info-filter',
    title: '信息洪流过滤',
    eyebrow: 'Scene 08',
    description: '清晨宿舍工作位、四源信息扫描、5 件真要务与自动归档浮层。',
    component: lazy(sceneLoaders.infoFilter),
  },
  {
    path: '/decision-copilot',
    title: '决策副驾',
    eyebrow: 'Scene 09',
    description: '深夜书房、长期画像与关系网络汇聚成平行人生模拟器。',
    component: lazy(sceneLoaders.decisionCopilot),
  },
  {
    path: '/transit-handoff',
    title: '跨工具任务交接',
    eyebrow: 'Scene 10',
    description: '清晨家中厨房、李明站在岛台旁手持水杯刷手机，Evans 胸针微光，阳光从窗户洒入。',
    component: lazy(sceneLoaders.transitHandoff),
  },
  {
    path: '/anniversary-reminder',
    title: '纪念日提醒',
    eyebrow: 'Scene 11',
    description: '清晨厨房、长期记忆触发、双端授权数据与 4 选项行动卡。',
    component: lazy(sceneLoaders.anniversaryReminder),
  },
  {
    path: '/generation-translate',
    title: '代际翻译',
    eyebrow: 'Scene 12',
    description: '办公室午休、母亲端隐私过滤状态卡、代际语境翻译与拨号浮层。',
    component: lazy(sceneLoaders.generationTranslate),
  },
  {
    path: '/third-option',
    title: '决策的第三选项',
    eyebrow: 'Scene 13',
    description: '落地窗办公室、工作家庭双侧扫描、A/B/C 对比与 C 方案暂存动作。',
    component: lazy(sceneLoaders.thirdOption),
  },
  {
    path: '/cross-city-care',
    title: '跨城叙事化关怀',
    eyebrow: 'Scene 14',
    description: '出差酒店夜晚、母亲端隐私过滤、信件体关怀报告与拨号浮层。',
    component: lazy(sceneLoaders.crossCityCare),
  },
  {
    path: '/silence-choice',
    title: '该不该说话',
    eyebrow: 'Scene 15',
    description: '深夜窗边、无动线无设备调用、Evans 经判断后主动沉默。',
    component: lazy(sceneLoaders.silenceChoice),
  },
]

const basePath = import.meta.env.BASE_URL.replace(/\/+$/, '')

function toAppUrl(path: string) {
  const normalized = normalizePath(path)
  return `${basePath}${normalized === '/' ? '/' : normalized}`
}

function normalizePath(pathname: string) {
  const withoutBase = basePath && pathname.startsWith(basePath)
    ? pathname.slice(basePath.length) || '/'
    : pathname
  const path = withoutBase.replace(/\/+$/, '')
  return path || '/'
}

function navigate(path: string) {
  window.history.pushState({}, '', toAppUrl(path))
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function usePathname() {
  const [pathname, setPathname] = useState(() => normalizePath(window.location.pathname))

  useEffect(() => {
    const handleRouteChange = () => setPathname(normalizePath(window.location.pathname))
    window.addEventListener('popstate', handleRouteChange)
    return () => window.removeEventListener('popstate', handleRouteChange)
  }, [])

  return pathname
}

function useScenePreload() {
  useEffect(() => {
    let cancelled = false
    const warm = () => {
      if (cancelled) return
      preloadSharedModelAssets()
      Object.values(sceneLoaders).forEach((loadScene) => {
        loadScene().catch(() => undefined)
      })
    }

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(warm, { timeout: 2200 })
      return () => {
        cancelled = true
        window.cancelIdleCallback(idleId)
      }
    }

    const timeoutId = globalThis.setTimeout(warm, 800)
    return () => {
      cancelled = true
      globalThis.clearTimeout(timeoutId)
    }
  }, [])
}

function HomePage() {
  return (
    <main className="home-page">
      <section className="home-hero">
        <span className="home-kicker">Evans 3D Story Scenes</span>
        <h1>选择一个场景预览</h1>
        <p>每个场景都是独立页面，保留统一的 3D 展览风格与蓝色 agent 动线语言。</p>
      </section>

      <nav className="scene-grid" aria-label="场景选择">
        {scenes.map((scene) => (
          <a
            className="scene-card"
            href={toAppUrl(scene.path)}
            key={scene.path}
            onClick={(event) => {
              event.preventDefault()
              navigate(scene.path)
            }}
          >
            <span>{scene.eyebrow}</span>
            <strong>{scene.title}</strong>
            <p>{scene.description}</p>
            <i>打开预览</i>
          </a>
        ))}
        <a href={toAppUrl('/scene-editor')} onClick={(event) => { event.preventDefault(); navigate('/scene-editor'); }}>
          🔧 打开模型布局编辑器
        </a>
      </nav>
    </main>
  )
}

function useNavCollapsed() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('scene-nav-collapsed') === '1'
    } catch {
      return false
    }
  })

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('scene-nav-collapsed', next ? '1' : '0')
      } catch {
        // ignore storage errors
      }
      return next
    })
  }

  return [collapsed, toggleCollapsed] as const
}

type SceneEntry = (typeof scenes)[number]

function SceneSwitcher({ currentScene }: { currentScene: SceneEntry }) {
  const [collapsed, toggleCollapsed] = useNavCollapsed()

  return (
    <div className={`scene-switcher-zone${collapsed ? ' is-collapsed' : ''}`}>
      <div className="scene-switcher-shell">
        <nav className="scene-switcher" id="scene-switcher-nav" aria-label="页面切换">
          <a
            href={toAppUrl('/')}
            onClick={(event) => {
              event.preventDefault()
              navigate('/')
            }}
          >
            首页
          </a>
          {scenes.map((scene) => {
            const isActive = scene.path === currentScene.path
            return (
              <a
                className={isActive ? 'is-active' : undefined}
                href={toAppUrl(scene.path)}
                key={scene.path}
                aria-current={isActive ? 'page' : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  if (!isActive) navigate(scene.path)
                }}
              >
                <span>{scene.eyebrow.replace('Scene ', 'S')}</span>
                {scene.title}
              </a>
            )
          })}
        </nav>
        <button
          type="button"
          className="scene-switcher-toggle"
          aria-label={collapsed ? '展开导航' : '收起导航'}
          aria-expanded={!collapsed}
          aria-controls="scene-switcher-nav"
          onClick={toggleCollapsed}
        >
          <span className="scene-switcher-caret" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

function DevSyncBadge() {
  const [stamp, setStamp] = useState(() => new Date().toLocaleTimeString('zh-CN', { hour12: false }))

  useEffect(() => {
    if (!import.meta.hot) return
    const touch = () => setStamp(new Date().toLocaleTimeString('zh-CN', { hour12: false }))
    import.meta.hot.on('vite:beforeUpdate', touch)
    import.meta.hot.on('vite:afterUpdate', touch)
    return () => {
      import.meta.hot?.off('vite:beforeUpdate', touch)
      import.meta.hot?.off('vite:afterUpdate', touch)
    }
  }, [])

  if (!import.meta.env.DEV) return null

  return (
    <div className="dev-sync-badge" title="代码更新后此时间会刷新；若不变说明预览未同步">
      预览已同步 · {stamp}
    </div>
  )
}

function App() {
  const pathname = usePathname()
  useScenePreload()

  let page = <HomePage />

  if (pathname === '/scene-editor') {
    page = <SceneEditorExperience />
  } else {
    const currentScene = scenes.find((scene) => scene.path === pathname)
    if (currentScene) {
      const SceneComponent = currentScene.component
      page = (
        <>
          <SceneSwitcher currentScene={currentScene} />
          <main className="interior-page">
            <Suspense fallback={<div className="scene-loading">场景加载中...</div>}>
              <SceneComponent />
            </Suspense>
          </main>
        </>
      )
    }
  }

  return (
    <>
      <DevSyncBadge />
      {page}
    </>
  )
}

export default App
