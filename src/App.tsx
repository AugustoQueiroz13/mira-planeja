import { useState } from 'react'
import { useDados } from './dados/carregarDados'
import { useMetas } from './dados/carregarMetas'
import { indicadores, serieMensal, contagem } from './dados/resumir'
import type { Atividade, SiglaPrograma } from './tipos'
import { CardKPI } from './componentes/CardKPI'
import { CardMeta } from './componentes/CardMeta'
import { IconesProjeto } from './componentes/IconesProjeto'
import { FiltroBar } from './componentes/FiltroBar'
import { GraficoEvolucao } from './componentes/GraficoEvolucao'
import { GraficoBarras } from './componentes/GraficoBarras'
import { MetasPorProjeto } from './componentes/MetasPorProjeto'
import { TabelaAcoes } from './componentes/TabelaAcoes'
import { DetalheAtividade } from './componentes/DetalheAtividade'
import { ModalLista } from './componentes/ModalLista'
import { useMetasAcoes } from './dados/carregarMetasAcoes'
import { DetalheAcao } from './componentes/DetalheAcao'

const SIGLAS: SiglaPrograma[] = ['PEA', 'PAG', 'PGP', 'PCS']

function ordenaAcao(a: string, b: string) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  return pa[0] - pb[0] || (pa[1] || 0) - (pb[1] || 0)
}

export default function App() {
  const dados = useDados()
  const metas = useMetas()
  const metasAcoes = useMetasAcoes()
  const [programa, setPrograma] = useState<SiglaPrograma | 'TODOS'>('TODOS')
  const [municipio, setMunicipio] = useState('TODOS')
  const [acao, setAcao] = useState('TODAS')
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [atividadeAberta, setAtividadeAberta] = useState<Atividade | null>(null)
  const [listaAberta, setListaAberta] = useState(false)

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
    <div className="min-h-screen bg-mira-bege p-6 md:p-8">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
         <div
          role="img"
          aria-label="Planeja+"
          className="h-12 w-44 shrink-0 bg-contain bg-left bg-no-repeat"
          style={{ backgroundImage: 'url(/logo-planeja.svg)' }}
        />
          <div>
            <h1 className="text-lg font-bold leading-tight text-mira-escuro">MIRA</h1>
            <p className="text-xs text-mira-escuro/60">
              Monitoramento Integrado de Resultados e Atividades
            </p>
          </div>
        </div>
        <p className="text-2xl font-bold text-mira-escuro">Resultados</p>
      </header>

      <div className="mb-6 rounded-2xl bg-[#E7EDE0] p-5">
        <p className="mb-4 text-sm text-mira-escuro/70">
          Painel de filtros · Selecione o município, a ação ou o período para recalcular os dados
        </p>
        <div className="flex flex-wrap items-end justify-between gap-6">
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
          <IconesProjeto selecionado={programa} aoSelecionar={setPrograma} temDados={temDados} />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <CardKPI
          titulo="Atividades"
          valor={ind.total_atividades}
          legenda="total de atividades realizadas"
          aoClicar={() => setListaAberta(true)}
        />
        <CardKPI
          titulo="Participantes"
          valor={ind.total_participantes}
          legenda="total de pessoas mobilizadas"
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

      {acaoEspecifica && (
  <div className="mt-6">
    <DetalheAcao codigo={acao} metasAcoes={metasAcoes} />
  </div>
)}

      {tabelaVisivel && (
        <div className="mt-6">
          <h2 className="mb-3 text-lg font-medium text-mira-escuro">Ações realizadas</h2>
          <TabelaAcoes atividades={filtradas} aoAbrir={setAtividadeAberta} />
        </div>
      )}

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