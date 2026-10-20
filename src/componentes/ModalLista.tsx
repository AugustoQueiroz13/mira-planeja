import { X } from 'lucide-react'
import type { Atividade } from '../tipos'
import { TabelaAcoes } from './TabelaAcoes'

export function ModalLista({
  titulo,
  atividades,
  aoAbrir,
  aoFechar,
}: {
  titulo: string
  atividades: Atividade[]
  aoAbrir: (a: Atividade) => void
  aoFechar: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/40 p-4 md:p-8"
      onClick={aoFechar}
    >
      <div
        className="w-full max-w-6xl rounded-xl bg-mira-bege p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-mira-escuro">{titulo}</h2>
          <button
            onClick={aoFechar}
            className="rounded p-1 text-mira-escuro/60 hover:bg-white"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>
        <TabelaAcoes atividades={atividades} aoAbrir={aoAbrir} />
      </div>
    </div>
  )
}