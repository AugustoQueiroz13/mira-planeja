import { useState } from 'react'
import { Login } from './Login'
import { Painel } from './Painel'

export function Admin() {
  const [logado, setLogado] = useState(false)

  if (!logado) {
    return <Login aoEntrar={() => setLogado(true)} />
  }

  return (
    <div>
      <div className="flex items-center justify-end bg-mira-bege px-4 pt-4 md:px-8 print:hidden">
        <button
          onClick={() => setLogado(false)}
          className="rounded-md border border-mira-escuro/20 px-3 py-1.5 text-xs font-medium text-mira-escuro/70 transition hover:bg-white"
        >
          Sair da administração
        </button>
      </div>
      <Painel admin />
    </div>
  )
}