export type Contagem = { rotulo: string; quantidade: number }
export type PontoTempo = { mes: string; atividades: number }
export type SiglaPrograma = 'PEA' | 'PAG' | 'PGP' | 'PCS'

export interface Indicadores {
  total_atividades: number
  total_participantes: number
  internos: number
  externos: number
  media_participantes: number
  municipios_atendidos: number
  regionais: number
}

export interface Atividade {
  codigo_acao: string
  atividade: string
  programa: string
  data: string
  data_iso: string
  mes_ref: string
  regional: string
  estado: string
  municipio: string
  municipios: string[]
  abrangencia: string
  local: string
  objetivo: string
  metodologia: string
  perfil: string
  participantes: number
  part_internos: number
  part_externos: number
  resultados: string
  produtos: string
  link_relatorio: string
  nivel_atuacao: string
}

export interface Programa {
  sigla: string
  tem_dados: boolean
  indicadores: Indicadores
  serie_temporal: PontoTempo[]
  atividades: Atividade[]
}

// Bloco de metas vindo do ETL (planilha de METAS)
export interface MetaAcaoInfo {
  projeto: string
  tipo: 'atividade' | 'produto' | 'hibrida' | 'sem_meta'
  alvo: number
  rotulo: string
  concluido?: boolean
  produto_entregue?: boolean
  meta_produto?: number
  produto_executado?: number
  cronograma_previsto?: string[]
}

export interface MetasInfo {
  acoes: Record<string, MetaAcaoInfo>
  totais_projeto: Record<string, number>
}

// Bloco de comunicacao (PCS): imprensa, redes e engajamento
export interface MateriaImprensa {
  tema: string
  veiculo: string
  tipo_midia: string
  data: string
  municipio: string
  link: string
}

export interface SerieMes {
  mes: string
  valor: number
}

export interface RedeSeguidores {
  rede: string
  org: string
  serie: SerieMes[]
}

export interface Comunicacao {
  imprensa: MateriaImprensa[]
  total_materias: number
  seguidores: RedeSeguidores[]
  whatsapp: { por_mes: { mes: string; membros: number }[]; total: number }
  engajamento: { posts: number; interacoes: number; visualizacoes: number }
}

// Equipe (acao 1.1): agregados de contratacao, sem dados individuais
export interface Equipe {
  total: number
  sexo: Contagem[]
  formacao: Contagem[]
  area: Contagem[]
}

export interface Dados {
  gerado_em: string
  periodo: { inicio: string; fim: string }
  global: Indicadores & { serie_temporal: PontoTempo[] }
  programas: Record<SiglaPrograma, Programa>
  metas: MetasInfo
  comunicacao?: Comunicacao
  equipe?: Equipe
  qualidade: { municipios_a_revisar: { referencia: string; valor: string }[] }
}

// Resultado do calculo de porcentagens
export interface ResumoMetas {
  global: number
  porProjeto: Record<SiglaPrograma, number>
  porAcao: Record<string, number>
}

// Legado (compatibilidade com carregarMetas.ts antigo, se ainda existir)
export interface Metas {
  globais: { programa: number; trimestre: number }
  por_projeto: Record<SiglaPrograma, number>
}

// Metas descritivas por acao (public/metas-acoes.json), usadas na pagina de detalhe
export interface MetaItem {
  rotulo: string
  meta: number | null
  unidade?: string
  indicador: string
  realizado: number | string | null
  produto: string | null
}

export interface AcaoMeta {
  programa: SiglaPrograma
  descricao: string
  metas: MetaItem[]
  distribuicao?: Contagem[]
  grafico_padrao?: 'treemap' | 'pizza' | 'barras'
  cronograma_previsto?: number[]
}

export interface MetasAcoes {
  acoes: Record<string, AcaoMeta>
}