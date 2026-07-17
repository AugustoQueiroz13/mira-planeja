import type { MetasAcoes } from '../tipos'
import { GraficoMetaResultado } from './GraficoMetaResultado'
import { GraficoDistribuicao } from './GraficoDistribuicao'

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
}: {
  codigo: string
  metasAcoes: MetasAcoes | null
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-mira-escuro/60">Ação {codigo}</p>
          <h2 className="text-lg font-medium text-mira-escuro">{acao.descricao}</h2>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-mira-escuro/60">Projeto selecionado</span>
          <img
            src={`/icones/${acao.programa.toLowerCase()}.png`}
            alt={acao.programa}
            className="h-16 w-16 object-contain"
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
              <ul className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-mira-escuro/80">
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
    </div>
  )
}