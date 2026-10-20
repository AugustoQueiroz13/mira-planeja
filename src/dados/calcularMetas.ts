import type { Atividade, MetasInfo, ResumoMetas, SiglaPrograma } from '../tipos'

export type { ResumoMetas } from '../tipos'

const SIGLAS: SiglaPrograma[] = ['PEA', 'PAG', 'PGP', 'PCS']

const RESUMO_VAZIO: ResumoMetas = {
  global: 0,
  porProjeto: { PEA: 0, PAG: 0, PGP: 0, PCS: 0 },
  porAcao: {},
}

/**
 * Calcula as porcentagens de meta a partir do bloco de metas do dados.json
 * (alvo por acao e total por projeto, lidos da planilha de METAS) e da
 * contagem de atividades realizadas.
 *
 * - Por acao: realizado dividido pelo alvo, limitado a 100%.
 * - Acao sem meta (alvo 0): 100% local se houver atividade, mas nao soma no projeto.
 * - Por projeto: atividades do projeto divididas pelo total do projeto.
 * - Global: soma dos realizados dividida pela soma dos totais.
 */
export function calcularMetas(metas: MetasInfo | undefined, atividades: Atividade[]): ResumoMetas {
  if (!metas || !metas.acoes) return RESUMO_VAZIO

  const contagem: Record<string, number> = {}
  for (const a of atividades) {
    if (a.codigo_acao) contagem[a.codigo_acao] = (contagem[a.codigo_acao] || 0) + 1
  }

  const porAcao: Record<string, number> = {}
  const projNum: Record<SiglaPrograma, number> = { PEA: 0, PAG: 0, PGP: 0, PCS: 0 }

  for (const [cod, def] of Object.entries(metas.acoes)) {
    const real = contagem[cod] || 0
    if (def.concluido) {
      // acao marcada como "Executado" na planilha de METAS: 100%
      porAcao[cod] = 100
      if (def.projeto in projNum) projNum[def.projeto as SiglaPrograma] += def.alvo
    } else if (def.alvo > 0) {
      porAcao[cod] = Math.min(100, Math.round((real / def.alvo) * 100))
      // contribuicao limitada ao alvo, para nao superestimar o projeto
      if (def.projeto in projNum) projNum[def.projeto as SiglaPrograma] += Math.min(real, def.alvo)
    } else {
      porAcao[cod] = real > 0 ? 100 : 0
    }
  }

  const porProjeto: Record<SiglaPrograma, number> = { PEA: 0, PAG: 0, PGP: 0, PCS: 0 }
  let globalNum = 0
  let globalDen = 0
  for (const p of SIGLAS) {
    const den = metas.totais_projeto?.[p] || 0
    porProjeto[p] = den ? Math.min(100, Math.round((projNum[p] / den) * 100)) : 0
    globalNum += projNum[p]
    globalDen += den
  }
  const global = globalDen ? Math.min(100, Math.round((globalNum / globalDen) * 100)) : 0

  return { global, porProjeto, porAcao }
}

/** Realizado (contagem de atividades) de uma acao, para a pagina de detalhe. */
export function realizadoDaAcao(codigo: string, atividades: Atividade[]): number {
  return atividades.filter((a) => a.codigo_acao === codigo).length
}