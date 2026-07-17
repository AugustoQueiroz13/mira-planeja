import type { SiglaPrograma } from '../tipos'

const SIGLAS: SiglaPrograma[] = ['PEA', 'PAG', 'PGP', 'PCS']

type Props = {
  selecionado: SiglaPrograma | 'TODOS'
  aoSelecionar: (p: SiglaPrograma | 'TODOS') => void
  temDados: Record<SiglaPrograma, boolean>
}

export function IconesProjeto({ selecionado, aoSelecionar, temDados }: Props) {
  return (
    <div className="flex flex-col items-start gap-2">
      <p className="text-sm font-medium text-mira-escuro/70">Projeto</p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => aoSelecionar('TODOS')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            selecionado === 'TODOS'
              ? 'bg-mira-escuro text-white'
              : 'bg-white text-mira-escuro hover:bg-white/70'
          }`}
        >
          Todos
        </button>

        {SIGLAS.map((s) => {
          const ativo = selecionado === s
          return (
            <button
              key={s}
              onClick={() => aoSelecionar(ativo ? 'TODOS' : s)}
              title={s}
              className={`rounded-xl p-1 transition ${ativo ? 'ring-2 ring-mira-escuro' : ''} ${
                !temDados[s] ? 'opacity-40' : 'hover:scale-105'
              }`}
            >
              <img
                src={`/icones/${s.toLowerCase()}.png`}
                alt={s}
                className="h-20 w-20 object-contain"
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}