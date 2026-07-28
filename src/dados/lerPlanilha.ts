import * as XLSX from 'xlsx'
import { indicadores, serieMensal } from './resumir'
import type { Atividade, Dados, SiglaPrograma } from '../tipos'

const PROGRAMAS: SiglaPrograma[] = ['PEA', 'PAG', 'PGP', 'PCS']

const MAPA: Record<string, string> = {
  Atividade: 'atividade',
  'Data prevista': 'data_prevista',
  'Data realizada': 'data_realizada',
  'Projeto (PEA, PAG, PGP, PCS)': 'programa',
  Regional: 'regional',
  Estado: 'estado',
  'Município do Programa': 'municipio',
  Local: 'local',
  'Objetivo da atividade': 'objetivo',
  'Metodologia utilizada': 'metodologia',
  'Perfil dos profissionais que conduziram o evento': 'perfil',
  'Número de participantes Internos': 'part_internos',
  'Número de participantes Externos': 'part_externos',
  'Resultados Alcançados': 'resultados',
  'Produtos/Encaminhamentos/Status': 'produtos',
}

// ---------------------------------------------------------------- utilidades

function limpa(v: unknown): string {
  return v == null ? '' : String(v).replace(/\s+/g, ' ').trim()
}

function norm(txt: unknown): string {
  return (txt == null ? '' : String(txt))
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizaPrograma(v: unknown): string {
  const p = limpa(v).toUpperCase()
  return (PROGRAMAS as string[]).includes(p) ? p : p || 'NAO_INFORMADO'
}

function extraiCodigo(atividade: unknown): string {
  const t = limpa(atividade)
  let m = t.match(/^\s*(\d+)\s*\.\s*(\d+)/)
  if (m) return `${m[1]}.${m[2]}`
  m = t.match(/^\s*(\d+)\b/)
  if (m) return m[1]
  return 's/codigo'
}

function paraInt(v: unknown): number {
  const n = parseInt(String(v).replace(/[^\d-]/g, ''), 10)
  return isNaN(n) ? 0 : n
}

function parseData(v: unknown): Date | null {
  if (v instanceof Date && !isNaN(v.getTime())) return v
  const txt = limpa(v)
  const matches = [...txt.matchAll(/(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})/g)]
  if (matches.length) {
    const m = matches[matches.length - 1]
    const ano = Number(m[3]) + (m[3].length === 2 ? 2000 : 0)
    const dt = new Date(ano, Number(m[2]) - 1, Number(m[1]))
    return isNaN(dt.getTime()) ? null : dt
  }
  return null
}

function fmt(dt: Date | null, tipo: 'br' | 'iso' | 'mes'): string {
  if (!dt) return ''
  const dd = String(dt.getDate()).padStart(2, '0')
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const yyyy = dt.getFullYear()
  if (tipo === 'br') return `${dd}/${mm}/${yyyy}`
  if (tipo === 'iso') return `${yyyy}-${mm}-${dd}`
  return `${yyyy}-${mm}`
}

// ---------------------------------------------------------------- municípios

type Entrada = { municipio: string; uf: string; regiao: string }
type Contexto = { indice: Record<string, Entrada>; marcadores: Set<string>; fora: Set<string> }
let contextoCache: Contexto | null = null
const PREFIXO_REGIONAL = /^\s*(regional\s+)?[ivx]+\s*[-–]\s*/i

async function carregarContexto(): Promise<Contexto> {
  if (contextoCache) return contextoCache
  const cfg: any = await fetch('/municipios.json').then((r) => r.json())
  const indice: Record<string, Entrada> = {}
  for (const [regiao, dados] of Object.entries<any>(cfg.regioes)) {
    for (const m of dados.municipios) indice[norm(m)] = { municipio: m, uf: dados.uf, regiao }
  }
  for (const [variante, oficial] of Object.entries<any>(cfg.depara || {})) {
    indice[norm(variante)] = indice[norm(oficial)]
  }
  contextoCache = {
    indice,
    marcadores: new Set<string>(cfg.marcadores_institucionais || []),
    fora: new Set<string>((cfg.fora_de_abrangencia || []).map(norm)),
  }
  return contextoCache
}

type Resultado = { status: string; municipio: string | null }

function resolveParte(bruto: string, ctx: Contexto): Resultado | null {
  const b = bruto.trim()
  const n = norm(b)
  if (!n) return null
  if (ctx.marcadores.has(n)) return { status: 'institucional', municipio: null }
  if (ctx.fora.has(n)) return { status: 'fora_abrangencia', municipio: b }
  if (ctx.indice[n]) return { status: 'ok', municipio: ctx.indice[n].municipio }
  const semPrefixo = norm(b.replace(PREFIXO_REGIONAL, ''))
  if (ctx.indice[semPrefixo]) return { status: 'ok', municipio: ctx.indice[semPrefixo].municipio }
  return { status: 'revisar', municipio: null }
}

function canonicaliza(valor: unknown, ctx: Contexto): Resultado[] {
  if (valor == null || String(valor).trim() === '')
    return [{ status: 'institucional', municipio: null }]
  const partes = String(valor).split(/;|,| e | E |\band\b/)
  const res: Resultado[] = []
  const vistos = new Set<string>()
  for (const p of partes) {
    const r = resolveParte(p, ctx)
    if (r) {
      const chave = `${r.municipio}|${r.status}`
      if (!vistos.has(chave)) {
        vistos.add(chave)
        res.push(r)
      }
    }
  }
  return res.length ? res : [{ status: 'revisar', municipio: null }]
}

// ---------------------------------------------------------------- principal

function isoParaBr(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function montarDados(
  atividades: Atividade[],
  revisar: { referencia: string; valor: string }[]
): Dados {
  const isos = atividades.map((a) => a.data_iso).filter(Boolean).sort()
  const periodo = {
    inicio: isos.length ? isoParaBr(isos[0]) : '',
    fim: isos.length ? isoParaBr(isos[isos.length - 1]) : '',
  }
  const programas = {} as Dados['programas']
  for (const s of PROGRAMAS) {
    const sub = atividades.filter((a) => a.programa === s)
    programas[s] = {
      sigla: s,
      tem_dados: sub.length > 0,
      indicadores: indicadores(sub),
      serie_temporal: serieMensal(sub),
      atividades: sub,
    }
  }
  return {
    gerado_em: new Date().toISOString(),
    periodo,
    global: { ...indicadores(atividades), serie_temporal: serieMensal(atividades) },
    programas,
    qualidade: { municipios_a_revisar: revisar },
  }
}

export async function lerPlanilha(file: File): Promise<Dados> {
  const ctx = await carregarContexto()
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array', cellDates: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const linhas = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { range: 1, defval: '' })

  const atividades: Atividade[] = []
  const revisar: { referencia: string; valor: string }[] = []

  for (const row of linhas) {
    const c: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(row)) {
      const nk = limpa(k)
      if (MAPA[nk]) c[MAPA[nk]] = v
    }
    const atividadeTexto = limpa(c.atividade)
    if (!atividadeTexto || atividadeTexto === 'Atividade') continue

    const cano = canonicaliza(c.municipio, ctx)
    const inScope = [
      ...new Set(cano.filter((r) => r.status === 'ok').map((r) => r.municipio as string)),
    ]
    let municipioDisplay = ''
    let abrangencia = 'revisar'
    if (inScope.length) {
      municipioDisplay = inScope.join('; ')
      abrangencia = 'ok'
    } else if (cano.every((r) => r.status === 'institucional')) {
      municipioDisplay = ''
      abrangencia = 'institucional'
    } else {
      municipioDisplay = limpa(c.municipio)
      abrangencia = 'revisar'
    }

    const dt = parseData(c.data_realizada)
    const partInt = paraInt(c.part_internos)
    const partExt = paraInt(c.part_externos)

    atividades.push({
      codigo_acao: extraiCodigo(c.atividade),
      atividade: atividadeTexto,
      programa: normalizaPrograma(c.programa),
      data: fmt(dt, 'br'),
      data_iso: fmt(dt, 'iso'),
      mes_ref: fmt(dt, 'mes'),
      regional: limpa(c.regional),
      estado: limpa(c.estado).toUpperCase(),
      municipio: municipioDisplay,
      municipios: inScope,
      abrangencia,
      local: limpa(c.local),
      objetivo: limpa(c.objetivo),
      metodologia: limpa(c.metodologia),
      perfil: limpa(c.perfil),
      participantes: partInt + partExt,
      part_internos: partInt,
      part_externos: partExt,
      resultados: limpa(c.resultados),
      produtos: limpa(c.produtos),
    })

    if (abrangencia === 'revisar') {
      revisar.push({
        referencia: `${limpa(c.data_realizada)} | ${atividadeTexto.slice(0, 40)}`,
        valor: municipioDisplay || '(vazio)',
      })
    }
  }

  return montarDados(atividades, revisar)
}