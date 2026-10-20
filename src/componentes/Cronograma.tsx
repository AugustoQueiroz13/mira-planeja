import { useState } from 'react'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const ANO_CORRENTE = String(new Date().getFullYear())

export function Cronograma({
  previsto,
  realizado,
}: {
  previsto: string[] // "AAAA-MM"
  realizado: string[] // "AAAA-MM"
}) {
  const prev = new Set(previsto)
  const real = new Set(realizado)

  const anos = [...new Set([...previsto, ...realizado].map((s) => s.slice(0, 4)))]
    .filter(Boolean)
    .sort()

  const [anoSel, setAnoSel] = useState<string | null>(null)

  if (anos.length === 0) return null

  // ano exibido: o escolhido se valido, senao o corrente, senao o primeiro
  const ano =
    anoSel && anos.includes(anoSel) ? anoSel : anos.includes(ANO_CORRENTE) ? ANO_CORRENTE : anos[0]

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-medium text-mira-escuro">Cronograma, previsto e realizado</h3>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-4 text-xs text-mira-escuro/60">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-mira-verde/30" /> Previsto
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-mira-verde" /> Realizado
            </span>
          </div>
          <select
            value={ano}
            onChange={(e) => setAnoSel(e.target.value)}
            className="rounded-lg border border-mira-escuro/15 bg-white px-3 py-1.5 text-sm font-medium text-mira-escuro"
          >
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
        {MESES.map((nome, i) => {
          const chave = `${ano}-${String(i + 1).padStart(2, '0')}`
          const p = prev.has(chave)
          const r = real.has(chave)
          const estado =
            p && r ? 'Previsto e realizado' : p ? 'Previsto' : r ? 'Realizado' : 'Sem registro'
          return (
            <div
              key={nome}
              className="flex flex-col items-center gap-1"
              title={`${nome} ${ano}: ${estado}`}
            >
              <div className="flex h-12 w-full flex-col gap-0.5">
                <div className={`flex-1 rounded-sm ${p ? 'bg-mira-verde/30' : 'bg-mira-bege'}`} />
                <div className={`flex-1 rounded-sm ${r ? 'bg-mira-verde' : 'bg-mira-bege'}`} />
              </div>
              <span className="text-[10px] font-medium text-mira-escuro/55">{nome}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}