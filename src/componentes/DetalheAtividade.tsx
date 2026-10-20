import type { Atividade } from '../tipos'
import { X } from 'lucide-react'

function Campo({ rotulo, valor }: { rotulo: string; valor: string | number }) {
  if (valor === '' || valor === null || valor === undefined) return null
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-mira-escuro/50">{rotulo}</p>
      <p className="text-mira-escuro">{valor}</p>
    </div>
  )
}

export function DetalheAtividade({
  atividade,
  aoFechar,
}: {
  atividade: Atividade
  aoFechar: () => void
}) {
  const a = atividade
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={aoFechar}>
      <div
        className="h-full w-full max-w-xl overflow-y-auto bg-mira-bege p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <span className="inline-block rounded bg-mira-verde px-2 py-0.5 text-xs font-medium text-white">
              {a.programa}
            </span>
            <h2 className="mt-2 text-lg font-medium text-mira-escuro">{a.atividade}</h2>
          </div>
          <button
            onClick={aoFechar}
            className="rounded p-1 text-mira-escuro/60 hover:bg-white"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <Campo rotulo="Data" valor={a.data} />
            <Campo rotulo="Regional" valor={a.regional} />
            <Campo rotulo="Estado" valor={a.estado} />
            <Campo rotulo="Município" valor={a.municipio} />
            <Campo rotulo="Local" valor={a.local} />
            <Campo
              rotulo="Participantes"
              valor={`${a.participantes} (${a.part_internos} internos, ${a.part_externos} externos)`}
            />
          </div>
          <Campo rotulo="Objetivo da atividade" valor={a.objetivo} />
          <Campo rotulo="Metodologia utilizada" valor={a.metodologia} />
          <Campo rotulo="Perfil dos profissionais" valor={a.perfil} />
          <Campo rotulo="Resultados alcançados" valor={a.resultados} />
          <Campo rotulo="Produtos e encaminhamentos" valor={a.produtos} />
        </div>
      </div>
    </div>
  )
}