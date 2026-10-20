import { HashRouter, Routes, Route } from 'react-router-dom'
import { Painel } from './componentes/Painel'
import { Admin } from './componentes/Admin'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Painel />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </HashRouter>
  )
}