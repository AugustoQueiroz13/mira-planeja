import type { Atividade, MetasAcoes } from '../tipos'
import { GraficoMetaResultado } from './GraficoMetaResultado'
import { GraficoDistribuicao } from './GraficoDistribuicao'
import { Cronograma } from './Cronograma'

const ANO = 2026

function Titulo({ texto }: { texto: string }) {
  return <p className="text-xs font-medium uppercase tracking-wide text-mira-verde">{texto}</p>
}

function RotuloMovel({ texto }: { texto: string }) {
  return (
    <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-mira-verde md:hidden">
      {texto}
    </span>
  )
}

export function DetalheAcao({
  codigo,
  metasAcoes,
  atividades,
}: {
  codigo: string
  metasAcoes: MetasAcoes | null
  atividades: Atividade[]
}) {
  const acao = metasAcoes?.acoes?.[codigo]

  if (!acao) {
    return (
      <div className="rounded-xl border border-mira-verde/30 bg-white p-6 text-mira-escuro/70">
        Ainda não há metas cadastradas para a ação {codigo}.
      </div>
    )
  }

  const temDist = !!acao.distribuicao && acao.distribuicao.length > 0

  const realizadoMeses = [
    ...new Set(
      atividades
        .filter((a) => a.data_iso && a.data_iso.startsWith(String(ANO)))
        .map((a) => Number(a.data_iso.slice(5, 7)))
    ),
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-mira-escuro/60">Ação {codigo}</p>
          <h2 className="text-base font-medium text-mira-escuro md:text-lg">{acao.descricao}</h2>
        </div>
        <div className="flex shrink-0 flex-col items-center">
          <span className="text-xs text-mira-escuro/60">Projeto selecionado</span>
          <img
            src={`/icones/${acao.programa.toLowerCase()}.png`}
            alt={acao.programa}
            className="h-14 w-14 object-contain md:h-16 md:w-16"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="hidden gap-4 md:grid md:grid-cols-4">
              <Titulo texto="Metas" />
              <Titulo texto="Indicador" />
              <Titulo texto="Resultado Alcançado" />
              <Titulo texto="Produto entregue" />
            </div>

            {acao.metas.map((m, i) => (
              <div
                key={i}
                className={`grid grid-cols-1 gap-4 md:grid-cols-4 ${
                  i > 0 ? 'mt-4 border-t border-mira-bege pt-4' : 'mt-2'
                }`}
              >
                <div>
                  <RotuloMovel texto="Meta" />
                  <p className="text-mira-escuro">{m.rotulo}</p>
                </div>
                <div>
                  <RotuloMovel texto="Indicador" />
                  <p className="text-mira-escuro/80">{m.indicador}</p>
                </div>
                <div>
                  <RotuloMovel texto="Resultado Alcançado" />
                  <p className="font-medium text-mira-escuro">
                    {m.realizado ?? <span className="text-mira-escuro/45">a apurar</span>}
                  </p>
                </div>
                <div>
                  <RotuloMovel texto="Produto entregue" />
                  <p className="text-mira-escuro/80">
                    {m.produto ?? <span className="text-mira-escuro/45">a definir</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {temDist && (
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-mira-verde">
                Detalhamento
              </p>
              <ul className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm text-mira-escuro/80 sm:grid-cols-2">
                {acao.distribuicao!.map((d, i) => (
                  <li key={i}>
                    {String(d.quantidade).padStart(2, '0')} {d.rotulo}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <GraficoMetaResultado metas={acao.metas} />
          {temDist && (
            <GraficoDistribuicao dados={acao.distribuicao!} padrao={acao.grafico_padrao ?? 'treemap'} />
          )}
        </div>
      </div>

      <Cronograma previsto={acao.cronograma_previsto ?? []} realizado={realizadoMeses} ano={ANO} />
    </div>
  )
}