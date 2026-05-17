import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import './App.css'

const scenes = [
  {
    path: '/living-room',
    title: '客厅场景',
    eyebrow: 'Scene 01',
    description: '家庭剖面空间、摔倒老人、Evans 胸针与紧急调度动线。',
    component: lazy(() => import('./scenes/living-room').then((module) => ({ default: module.LivingRoomExperience }))),
  },
  {
    path: '/park-chess',
    title: '公园下棋',
    eyebrow: 'Scene 02',
    description: '午后公园棋局、关系候选节点、手机日程草稿与地点锚点。',
    component: lazy(() => import('./scenes/park-chess').then((module) => ({ default: module.ParkChessExperience }))),
  },
  {
    path: '/home-dispatch',
    title: '家庭调度',
    eyebrow: 'Scene 03',
    description: '半透家庭平面图、机器人取药、环境调度与跨端通报编辑器。',
    component: lazy(() => import('./scenes/home-dispatch').then((module) => ({ default: module.HomeDispatchExperience }))),
  },
  {
    path: '/living-call',
    title: '客厅通话',
    eyebrow: 'Scene 04',
    description: '客厅静态建模：陈建国坐沙发贴耳通话，Evans 黄色警示光，桌上眼镜与茶杯。',
    component: lazy(() => import('./scenes/living-call').then((module) => ({ default: module.LivingCallExperience }))),
  },
  {
    path: '/open-office',
    title: '开放办公室',
    eyebrow: 'Scene 05',
    description: '李明坐在工位电脑前双手扶头，胸前 Evans 微光，桌面设备与虚化同事工位。',
    component: lazy(() => import('./scenes/open-office').then((module) => ({ default: module.OpenOfficeExperience }))),
  },
]

function normalizePath(pathname: string) {
  const path = pathname.replace(/\/+$/, '')
  return path || '/'
}

function navigate(path: string) {
  window.history.pushState({}, '', path)
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
            href={scene.path}
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
      </nav>
    </main>
  )
}

function App() {
  const pathname = usePathname()
  const currentScene = useMemo(() => scenes.find((scene) => scene.path === pathname), [pathname])

  if (!currentScene) {
    return <HomePage />
  }

  const SceneComponent = currentScene.component
  const otherScenes = scenes.filter((scene) => scene.path !== currentScene.path)

  return (
    <>
      <nav className="scene-switcher" aria-label="页面切换">
        <a
          href="/"
          onClick={(event) => {
            event.preventDefault()
            navigate('/')
          }}
        >
          首页
        </a>
        {otherScenes.map((scene) => (
          <a
            href={scene.path}
            key={scene.path}
            onClick={(event) => {
              event.preventDefault()
              navigate(scene.path)
            }}
          >
            {scene.title}
          </a>
        ))}
      </nav>
      <main className="interior-page">
        <Suspense fallback={<div className="scene-loading">场景加载中...</div>}>
          <SceneComponent />
        </Suspense>
      </main>
    </>
  )
}

export default App
