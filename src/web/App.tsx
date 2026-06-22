import { Dashboard } from './components/Dashboard'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 px-4 py-4 text-white shadow-lg">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-xl font-bold tracking-tight">Alineación de quipo dinamico</h1>
          <p className="text-sm text-slate-400">Visualizador 3D de correcciones de alineación</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl">
        <Dashboard />
      </main>
    </div>
  )
}
