import type { Atividade, MetasInfo, MetasAcoes } from '../tipos'
import { CheckCircle2 } from 'lucide-react'
import { contagem } from '../dados/resumir'
import { GraficoDistribuicao } from './GraficoDistribuicao'
import { Cronograma } from './Cronograma'

const ANO = 2026

export function DetalheAcao({
  codigo,
  metas,
  metasAcoes,
  atividades,
  aoAbrir,
}: {
  codigo: string
  metas: MetasInfo | undefined
  metasAcoes: MetasAcoes | null
  atividades: Atividade[]
  aoAbrir: (a: Atividade) => void
}) {
  const info = metas?.acoes?.[codigo]
  const desc = metasAcoes?.acoes?.[codigo]

  const ativs = atividades
  const realizado = ativs.length
  const alvo = info?.alvo ?? 0
  const concluido = !!info?.concluido
  const pct = concluido
    ? 100
    : alvo > 0
      ? Math.min(100, Math.round((realizado / alvo) * 100))
      : realizado > 0
        ? 100
        : 0

  const descricao = (info?.rotulo || desc?.descricao || `Ação ${codigo}`).replace(
    /^\s*\d+\.?\s*\d*\.?\s*/,
    ''
  )
  const programa = info?.projeto || desc?.programa || ''
  const tipoLabel = info?.tipo === 'produto' ? 'produto' : 'atividades'

  // distribuicao: curada (metas-acoes) ou derivada por regional
  const temCurada = !!desc?.distribuicao && desc.distribuicao.length > 0
  const distribuicao = temCurada ? desc!.distribuicao! : contagem(ativs, 'regional')
  const tituloDistrib = temCurada ? 'Atividade por tipo' : 'Atividades por regional'

  const realizadoMeses = [
    ...new Set(
      ativs
        .filter((a) => a.data_iso && a.data_iso.startsWith(String(ANO)))
        .map((a) => Number(a.data_iso.slice(5, 7)))
    ),
  ]

  const corBarra = pct >= 100 ? '#3C9C3C' : pct >= 50 ? '#78C03C' : '#30B4A8'

  const detalheAtividade = (a: Atividade) =>
    [a.data, a.municipios?.length ? a.municipios.join(', ') : a.municipio, a.regional]
      .filter(Boolean)
      .join(' · ')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-mira-escuro/60">Ação {codigo}</p>
          <h2 className="text-base font-medium text-mira-escuro md:text-lg">{descricao}</h2>
        </div>
        {programa && (
          <span className="shrink-0 rounded-full bg-mira-verde/10 px-3 py-1 text-sm font-semibold text-mira-verde">
            {programa}
          </span>
        )}
      </div>

      {info?.produto_entregue && (
        <div className="flex items-start gap-2 rounded-xl border border-mira-verde/30 bg-mira-verde/10 px-4 py-3 text-sm text-mira-escuro">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-mira-verde" />
          <span>
            <span className="font-semibold text-mira-verde">Produto entregue.</span> As atividades
            de acompanhamento desta ação continuam em andamento e são contabilizadas no progresso
            abaixo.
          </span>
        </div>
      )}

      {/* Resumo real da meta */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        {info?.produto_entregue && (
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-mira-verde px-3 py-1 text-xs font-semibold text-white">
            <CheckCircle2 size={14} />
            Produto entregue
          </div>
        )}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_1fr_2fr] md:items-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-mira-verde">Meta</p>
            <p className="text-2xl font-bold text-mira-escuro">{alvo || '—'}</p>
            <p className="text-xs text-mira-escuro/55">{tipoLabel} previstas</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-mira-verde">
              Resultado alcançado
            </p>
            {concluido ? (
              <p className="text-2xl font-bold text-mira-verde">Concluído</p>
            ) : (
              <>
                <p className="text-2xl font-bold text-mira-escuro">{realizado}</p>
                <p className="text-xs text-mira-escuro/55">realizadas até aqui</p>
              </>
            )}
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-mira-verde">
                Progresso
              </p>
              <span className="text-lg font-bold text-mira-escuro">{pct}%</span>
            </div>
            <div className="h-4 w-full rounded-full bg-mira-bege">
              <div
                className="h-4 rounded-full"
                style={{ width: `${pct}%`, backgroundColor: corBarra }}
              />
            </div>
            {desc?.metas?.[0]?.indicador && (
              <p className="mt-2 text-xs text-mira-escuro/55">{desc.metas[0].indicador}</p>
            )}
          </div>
        </div>
      </div>

      {distribuicao.length > 0 && (
        <GraficoDistribuicao titulo={tituloDistrib} dados={distribuicao} />
      )}

      <Cronograma previsto={desc?.cronograma_previsto ?? []} realizado={realizadoMeses} ano={ANO} />

      {ativs.length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-medium text-mira-escuro">
            Atividades realizadas ({ativs.length})
          </h3>
          <ul className="max-h-[28rem] divide-y divide-mira-bege overflow-y-auto">
            {ativs.map((a, i) => (
              <li key={i}>
                <button
                  onClick={() => aoAbrir(a)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-3 text-left transition hover:bg-mira-bege/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-mira-escuro">
                      {a.atividade || 'Atividade sem título'}
                    </p>
                    {detalheAtividade(a) && (
                      <p className="truncate text-xs text-mira-escuro/55">{detalheAtividade(a)}</p>
                    )}
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-xs font-medium text-mira-verde">
                    Ver detalhes →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}