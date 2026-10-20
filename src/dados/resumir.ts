import type { Atividade, Indicadores, PontoTempo, Contagem } from '../tipos'

export function indicadores(ativs: Atividade[]): Indicadores {
  const total = ativs.length
  const internos = ativs.reduce((s, a) => s + (a.part_internos || 0), 0)
  const externos = ativs.reduce((s, a) => s + (a.part_externos || 0), 0)
  const participantes = internos + externos
  const municipios = new Set<string>()
  ativs.forEach((a) => (a.municipios || []).forEach((m) => municipios.add(m)))
  const regionais = new Set(ativs.map((a) => a.regional).filter(Boolean))
  return {
    total_atividades: total,
    total_participantes: participantes,
    internos,
    externos,
    media_participantes: total ? Math.round((participantes / total) * 100) / 100 : 0,
    municipios_atendidos: municipios.size,
    regionais: regionais.size,
  }
}

export function serieMensal(ativs: Atividade[]): PontoTempo[] {
  const cont: Record<string, number> = {}
  ativs.forEach((a) => {
    if (a.mes_ref) cont[a.mes_ref] = (cont[a.mes_ref] || 0) + 1
  })
  return Object.keys(cont)
    .sort()
    .map((mes) => ({ mes, atividades: cont[mes] }))
}

export function contagem(ativs: Atividade[], campo: 'estado' | 'regional' | 'programa'): Contagem[] {
  const cont: Record<string, number> = {}
  ativs.forEach((a) => {
    const v = a[campo]
    if (v) cont[v] = (cont[v] || 0) + 1
  })
  return Object.entries(cont)
    .map(([rotulo, quantidade]) => ({ rotulo, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade)
}