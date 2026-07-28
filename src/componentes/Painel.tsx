import { useState } from 'react'
import { useDados } from '../dados/carregarDados'
import { useMetas } from '../dados/carregarMetas'
import { useMetasAcoes } from '../dados/carregarMetasAcoes'
import { indicadores, serieMensal, contagem } from '../dados/resumir'
import type { Atividade, Dados, SiglaPrograma } from '../tipos'
import { CardKPI } from './CardKPI'
import { CardMeta } from './CardMeta'
import { IconesProjeto } from './IconesProjeto'
import { FiltroBar } from './FiltroBar'
import { GraficoEvolucao } from './GraficoEvolucao'
import { GraficoBarras } from './GraficoBarras'
import { MetasPorProjeto } from './MetasPorProjeto'
import { TabelaAcoes } from './TabelaAcoes'
import { DetalheAtividade } from './DetalheAtividade'
import { ModalLista } from './ModalLista'
import { DetalheAcao } from './DetalheAcao'
import { AvisoQualidade } from './AvisoQualidade'
import { BotaoUpload } from './BotaoUpload'

const SIGLAS: SiglaPrograma[] = ['PEA', 'PAG', 'PGP', 'PCS']

function ordenaAcao(a: string, b: string) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  return pa[0] - pb[0] || (pa[1] || 0) - (pb[1] || 0)
}

export function Painel({ admin = false }: { admin?: boolean }) {
  const dadosPublicados = useDados()
  const metas = useMetas()
  const metasAcoes = useMetasAcoes()
  const [dadosCarregados, setDadosCarregados] = useState<Dados | null>(null)
  const [erroUpload, setErroUpload] = useState('')
  const [programa, setPrograma] = useState<SiglaPrograma | 'TODOS'>('TODOS')
  const [municipio, setMunicipio] = useState('TODOS')
  const [acao, setAcao] = useState('TODAS')
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [atividadeAberta, setAtividadeAberta] = useState<Atividade | null>(null)
  const [listaAberta, setListaAberta] = useState(false)

  const dados = dadosCarregados ?? dadosPublicados

  if (!dados) return <p className="p-8 text-mira-escuro">Carregando...</p>

  const todas: Atividade[] = SIGLAS.flatMap((s) => dados.programas[s].atividades)

  const municipiosOpcoes = [...new Set(todas.flatMap((a) => a.municipios ?? []))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'pt'))

  const rotuloAcao = new Map<string, string>()
  todas.forEach((a) => {
    if (a.codigo_acao && a.codigo_acao !== 's/codigo' && !rotuloAcao.has(a.codigo_acao)) {
      rotuloAcao.set(a.codigo_acao, a.atividade)
    }
  })
  const acoesOpcoes = [...rotuloAcao.entries()]
    .map(([codigo, nome]) => ({ codigo, nome }))
    .sort((a, b) => ordenaAcao(a.codigo, b.codigo))

  const filtradas = todas.filter(
    (a) =>
      (programa === 'TODOS' || a.programa === programa) &&
      (municipio === 'TODOS' || a.municipios.includes(municipio)) &&
      (acao === 'TODAS' || a.codigo_acao === acao) &&
      (!inicio || !a.data_iso || a.data_iso >= inicio) &&
      (!fim || !a.data_iso || a.data_iso <= fim)
  )

  const ind = indicadores(filtradas)
  const serie = serieMensal(filtradas)
  const porEstado = contagem(filtradas, 'estado')
  const porRegional = contagem(filtradas, 'regional')

  const temDados = {
    PEA: dados.programas.PEA.tem_dados,
    PAG: dados.programas.PAG.tem_dados,
    PGP: dados.programas.PGP.tem_dados,
    PCS: dados.programas.PCS.tem_dados,
  }

  const acaoEspecifica = acao !== 'TODAS'
  const tabelaVisivel = programa !== 'TODOS' && municipio === 'TODOS' && acao === 'TODAS'

  return (
    <div className="min-h-screen bg-mira-bege p-4 md:p-8 print:bg-white">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src="/logo-planeja.png" alt="Planeja+" className="h-10 w-auto shrink-0 md:h-12" />
          <div>
            <h1 className="text-base font-bold leading-tight text-mira-escuro md:text-lg">SMA</h1>
            <p className="text-[11px] text-mira-escuro/60 md:text-xs">
              Sistema de Monitoramento de Atividades
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {admin && (
            <BotaoUpload
              aoCarregar={(d) => {
                setDadosCarregados(d)
                setErroUpload('')
              }}
              aoErro={setErroUpload}
            />
          )}
          <button
            onClick={() => window.print()}
            className="rounded-md border border-mira-verde px-3 py-1.5 text-xs font-medium text-mira-verde transition hover:bg-mira-verde hover:text-white print:hidden"
          >
            Exportar PDF
          </button>
          <p className="text-xl font-bold text-mira-escuro md:text-2xl">Resultados</p>
        </div>
      </header>

      {admin && dadosCarregados && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800 print:hidden">
          <span>
            Você está vendo uma planilha carregada, apenas nesta sessão. Os dados publicados não
            foram alterados.
          </span>
          <button
            onClick={() => setDadosCarregados(null)}
            className="rounded-md border border-amber-400 px-3 py-1 text-xs font-medium text-amber-800 transition hover:bg-amber-100"
          >
            Voltar aos dados publicados
          </button>
        </div>
      )}

      {admin && erroUpload && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 print:hidden">
          {erroUpload}
        </div>
      )}

      <div className="mb-6 rounded-2xl bg-[#E7EDE0] p-4 md:p-5 print:hidden">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <p className="mb-4 text-sm text-mira-escuro/70">
              Painel de filtros · Selecione o município, a ação ou o período para recalcular os dados
            </p>
            <FiltroBar
              municipios={municipiosOpcoes}
              acoes={acoesOpcoes}
              municipio={municipio}
              acao={acao}
              inicio={inicio}
              fim={fim}
              setMunicipio={setMunicipio}
              setAcao={setAcao}
              setInicio={setInicio}
              setFim={setFim}
            />
          </div>
          <IconesProjeto selecionado={programa} aoSelecionar={setPrograma} temDados={temDados} />
        </div>
      </div>

      {acaoEspecifica ? (
        <div className="space-y-4">
          <button
            onClick={() => setAcao('TODAS')}
            className="text-sm font-medium text-mira-verde hover:underline print:hidden"
          >
            ← Voltar ao panorama
          </button>
          <DetalheAcao codigo={acao} metasAcoes={metasAcoes} atividades={filtradas} />
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <CardKPI
              titulo="Atividades"
              valor={ind.total_atividades}
              legenda="total de atividades realizadas"
              aoClicar={() => setListaAberta(true)}
            />
            <CardKPI
              titulo="Participantes"
              valor={ind.total_participantes}
              legenda={`${ind.internos} internos · ${ind.externos} externos`}
            />
            <CardKPI
              titulo="Média de Participantes"
              valor={ind.media_participantes}
              legenda="por atividade"
            />
            <CardKPI titulo="Municípios" valor={ind.municipios_atendidos} legenda="atendidos" />
            <CardMeta
              titulo="Metas globais"
              percentual={metas.globais.programa}
              legenda="das metas previstas para o programa"
            />
            <CardMeta
              titulo="Metas parcial"
              percentual={metas.globais.trimestre}
              legenda="das metas previstas para o trimestre"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <GraficoEvolucao serie={serie} />
            <MetasPorProjeto metas={metas} />
          </div>

          {programa !== 'TODOS' && (
            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
              <GraficoBarras titulo="Atividades por estado" dados={porEstado} />
              <GraficoBarras titulo="Atividades por regional" dados={porRegional} />
            </div>
          )}

          {tabelaVisivel && (
            <div className="mt-6">
              <h2 className="mb-3 text-lg font-medium text-mira-escuro">Ações realizadas</h2>
              <TabelaAcoes atividades={filtradas} aoAbrir={setAtividadeAberta} />
            </div>
          )}
        </>
      )}

      {admin && <AvisoQualidade qualidade={dados.qualidade} />}

      {listaAberta && (
        <ModalLista
          titulo="Atividades no filtro atual"
          atividades={filtradas}
          aoAbrir={(a) => {
            setListaAberta(false)
            setAtividadeAberta(a)
          }}
          aoFechar={() => setListaAberta(false)}
        />
      )}

      {atividadeAberta && (
        <DetalheAtividade atividade={atividadeAberta} aoFechar={() => setAtividadeAberta(null)} />
      )}
    </div>
  )
}