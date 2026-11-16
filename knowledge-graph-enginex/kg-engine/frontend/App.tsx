import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import NewBundle from './pages/NewBundle'
import BundleDetail from './pages/BundleDetail'
import GraphView from './pages/GraphView'
import ReviewQueue from './pages/ReviewQueue'
import Quality from './pages/Quality'
import Versions from './pages/Versions'
import { cn } from './lib/shadcn/utils'
import { Database, GitFork, ListChecks, Gauge, History, Network } from 'lucide-react'

const NAV = [
  { to: '/', label: 'Dashboard', icon: Gauge },
  { to: '/graph', label: 'Graph', icon: Network },
  { to: '/queue', label: 'Review queue', icon: ListChecks },
  { to: '/quality', label: 'Quality', icon: GitFork },
  { to: '/versions', label: 'Versions & audit', icon: History },
]

export default function App() {
  const location = useLocation()
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="flex w-56 shrink-0 flex-col border-r bg-card">
        <div className="flex items-center gap-2 border-b px-4 py-4">
          <Database className="h-5 w-5 text-primary" />
          <div>
            <div className="text-sm font-semibold leading-tight">Knowledge Engine</div>
            <div className="text-[10px] text-muted-foreground">topic graphs with provenance</div>
          </div>
        </div>
        <nav className="flex flex-col gap-1 p-2">
          {NAV.map((n) => {
            const active = n.to === '/' ? location.pathname === '/' : location.pathname.startsWith(n.to)
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                  active ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            )
          })}
        </nav>
        <div className="mt-auto border-t p-3 text-[10px] leading-relaxed text-muted-foreground">
          Graph-only engine: no lessons, no grading, no mastery tracking. Everything downstream builds on the committed
          versions.
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden p-6">
        <div className="mx-auto max-w-6xl">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/bundles/new" element={<NewBundle />} />
            <Route path="/bundles/:bundleId" element={<BundleDetail />} />
            <Route path="/graph" element={<GraphView />} />
            <Route path="/queue" element={<ReviewQueue />} />
            <Route path="/quality" element={<Quality />} />
            <Route path="/versions" element={<Versions />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
