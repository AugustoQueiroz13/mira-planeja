export type Contagem = { rotulo: string; quantidade: number }
export type PontoTempo = { mes: string; atividades: number }
export type SiglaPrograma = 'PEA' | 'PAG' | 'PGP' | 'PCS'

export interface Indicadores {
  total_atividades: number
  total_participantes: number
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
}

export interface Programa {
  sigla: string
  tem_dados: boolean
  indicadores: Indicadores
  serie_temporal: PontoTempo[]
  atividades: Atividade[]
}

export interface Dados {
  gerado_em: string
  periodo: { inicio: string; fim: string }
  global: Indicadores & { serie_temporal: PontoTempo[] }
  programas: Record<SiglaPrograma, Programa>
  qualidade: { municipios_a_revisar: { referencia: string; valor: string }[] }
}

export interface Metas {
  globais: { programa: number; trimestre: number }
  por_projeto: Record<SiglaPrograma, number>
}

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
}

export interface MetasAcoes {
  acoes: Record<string, AcaoMeta>
}