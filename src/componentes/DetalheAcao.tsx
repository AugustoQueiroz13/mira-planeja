import type { Atividade, MetasInfo, MetasAcoes, Equipe } from '../tipos'
import { CheckCircle2 } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  LabelList,
  ResponsiveContainer,
} from 'recharts'
import { contagem } from '../dados/resumir'
import { GraficoDistribuicao } from './GraficoDistribuicao'
import { Cronograma } from './Cronograma'

function Campo({ titulo, valor, cinza }: { titulo: string; valor: string; cinza?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-mira-verde">{titulo}</p>
      <p className={`mt-1 text-sm ${cinza ? 'text-mira-escuro/40' : 'font-medium text-mira-escuro'}`}>
        {valor}
      </p>
    </div>
  )
}

function Frente({
  titulo,
  realizado,
  meta,
  pct,
  unidade,
}: {
  titulo: string
  realizado: number
  meta: number
  pct: number
  unidade: string
}) {
  const cor = pct >= 100 ? '#3C9C3C' : pct >= 50 ? '#78C03C' : '#30B4A8'
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-mira-escuro">{titulo}</h3>
        <span className="text-lg font-bold text-mira-escuro">{pct}%</span>
      </div>
      <p className="mt-1 text-2xl font-bold text-mira-escuro">
        {realizado}{' '}
        <span className="text-base font-normal text-mira-escuro/55">
          de {meta} {unidade}
        </span>
      </p>
      <div className="mt-3 h-3 w-full rounded-full bg-mira-bege">
        <div className="h-3 rounded-full" style={{ width: `${pct}%`, backgroundColor: cor }} />
      </div>
    </div>
  )
}

export function DetalheAcao({
  codigo,
  metas,
  metasAcoes,
  atividades,
  aoAbrir,
  equipe,
}: {
  codigo: string
  metas: MetasInfo | undefined
  metasAcoes: MetasAcoes | null
  atividades: Atividade[]
  aoAbrir: (a: Atividade) => void
  equipe?: Equipe
}) {
  const info = metas?.acoes?.[codigo]
  const desc = metasAcoes?.acoes?.[codigo]

  // Acao 1.1: duas frentes (contratacao, da planilha de equipe; capacitacao,
  // pela contagem de atividades) e a composicao da equipe
  const ehAcaoEquipe = codigo === '1.1' && !!equipe
  const contratados = equipe?.total ?? 0
  const metaContrat = info?.meta_produto ?? 0
  const pctContrat = metaContrat > 0 ? Math.min(100, Math.round((contratados / metaContrat) * 100)) : 0
  const metaCapac = info?.alvo ?? 0
  const pctCapac = metaCapac > 0 ? Math.min(100, Math.round((atividades.length / metaCapac) * 100)) : 0

  const ativs = atividades
  // Produto e medido pela planilha (Executado / Meta); atividade e hibrida,
  // pela contagem de atividades do PINAR.
  const ehProduto = info?.tipo === 'produto'
  const temProduto = info?.tipo === 'produto' || info?.tipo === 'hibrida'
  const realizado = ehProduto ? (info?.produto_executado ?? 0) : ativs.length
  const alvo = ehProduto ? (info?.meta_produto ?? 0) : (info?.alvo ?? 0)
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
  const tipoLabel = ehProduto ? 'produtos' : 'atividades'

  // Textos descritivos (versao anterior): vem do metas-acoes quando existir
  const metaDesc = desc?.metas?.[0]
  const metaTexto = metaDesc?.rotulo || `${alvo || '—'} ${tipoLabel} previstas`
  const indicadorTexto =
    metaDesc?.indicador || (ehProduto ? 'Produtos entregues' : 'Atividades realizadas')
  const resultadoTexto = concluido ? `${realizado} (concluído)` : `${realizado}`

  // Produto entregue: status real
  let produtoTexto = '—'
  let produtoCinza = true
  if (temProduto) {
    const mp = info?.meta_produto ?? 0
    const pe = info?.produto_executado ?? 0
    if (mp > 0 && pe >= mp) {
      produtoTexto = mp > 1 ? `Entregue (${pe} de ${mp})` : 'Entregue'
      produtoCinza = false
    } else if (pe > 0) {
      produtoTexto = `${pe} de ${mp} entregues`
      produtoCinza = false
    } else {
      produtoTexto = 'Não entregue'
    }
  }

  const dadosMeta = [
    { nome: 'Meta', valor: alvo },
    { nome: 'Resultado', valor: realizado },
  ]

  // distribuicao: curada (metas-acoes) ou derivada por regional
  const temCurada = !!desc?.distribuicao && desc.distribuicao.length > 0
  const distribuicao = temCurada ? desc!.distribuicao! : contagem(ativs, 'regional')
  const tituloDistrib = temCurada ? 'Atividade por tipo' : 'Atividades por regional'

  // meses com atividade realizada, em todos os anos, no formato "AAAA-MM"
  const realizadoMeses = [
    ...new Set(ativs.filter((a) => a.data_iso).map((a) => a.data_iso.slice(0, 7))),
  ]

  const corBarra = pct >= 100 ? '#3C9C3C' : pct >= 50 ? '#78C03C' : '#30B4A8'

  const ehInstitucional = (a: Atividade) => /institucional/i.test(a.regional || '')
  const detalheAtividade = (a: Atividade) =>
    ehInstitucional(a)
      ? [a.data, 'Institucional'].filter(Boolean).join(' · ')
      : [a.data, a.municipios?.length ? a.municipios.join(', ') : a.municipio, a.regional]
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
            de acompanhamento desta ação continuam em andamento e são contabilizadas abaixo.
          </span>
        </div>
      )}

      {ehAcaoEquipe && equipe && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Frente
              titulo="Contratação"
              realizado={contratados}
              meta={metaContrat}
              pct={pctContrat}
              unidade="contratados"
            />
            <Frente
              titulo="Capacitação"
              realizado={atividades.length}
              meta={metaCapac}
              pct={pctCapac}
              unidade="capacitações"
            />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <GraficoDistribuicao titulo="Equipe por sexo" dados={equipe.sexo} />
            <GraficoDistribuicao titulo="Equipe por formação" dados={equipe.formacao} />
            <GraficoDistribuicao titulo="Equipe por grande área" dados={equipe.area} />
          </div>
        </>
      )}

      {!ehAcaoEquipe && (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        {/* Bloco descritivo (formato da versao anterior) com dados reais */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            <Campo titulo="Metas" valor={metaTexto} />
            <Campo titulo="Indicador" valor={indicadorTexto} />
            <Campo titulo="Resultado alcançado" valor={resultadoTexto} />
            <Campo titulo="Produto entregue" valor={produtoTexto} cinza={produtoCinza} />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-5 border-t border-mira-bege pt-4">
            <Campo titulo="Atividades realizadas" valor={`${ativs.length} registradas no PINAR`} />
            <div>
              <div className="mb-1 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-mira-verde">
                  Progresso
                </p>
                <span className="text-sm font-bold text-mira-escuro">{pct}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-mira-bege">
                <div
                  className="h-3 rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: corBarra }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Grafico Meta e resultado */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-2 font-medium text-mira-escuro">Meta e resultado</h3>
          <p className="mb-2 text-xs text-mira-escuro/55">{indicadorTexto}</p>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart
              layout="vertical"
              data={dadosMeta}
              margin={{ top: 4, right: 36, left: 8, bottom: 4 }}
            >
              <XAxis type="number" hide domain={[0, Math.max(alvo, realizado, 1)]} />
              <YAxis
                type="category"
                dataKey="nome"
                width={72}
                tick={{ fontSize: 12, fill: '#18303C' }}
                axisLine={false}
                tickLine={false}
              />
              <Bar dataKey="valor" radius={[0, 6, 6, 0]} barSize={26}>
                <Cell fill="#9FD88A" />
                <Cell fill="#3C9C3C" />
                <LabelList dataKey="valor" position="right" style={{ fontSize: 12, fill: '#18303C' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      )}

      {distribuicao.length > 0 && (
        <GraficoDistribuicao titulo={tituloDistrib} dados={distribuicao} />
      )}

      <Cronograma previsto={info?.cronograma_previsto ?? []} realizado={realizadoMeses} />

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