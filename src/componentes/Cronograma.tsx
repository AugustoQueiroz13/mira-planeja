const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export function Cronograma({
  previsto,
  realizado,
  ano,
}: {
  previsto: number[]
  realizado: number[]
  ano: number
}) {
  const prev = new Set(previsto)
  const real = new Set(realizado)

  // Sem previsto e sem realizado: nao mostra o bloco
  if (prev.size === 0 && real.size === 0) return null

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium text-mira-escuro">Cronograma {ano}</h3>
        <div className="flex gap-4 text-xs text-mira-escuro/60">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-mira-verde/30" /> Previsto
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-mira-verde" /> Realizado
          </span>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
        {MESES.map((nome, i) => {
          const mes = i + 1
          const p = prev.has(mes)
          const r = real.has(mes)
          const estado = p && r ? 'Previsto e realizado' : p ? 'Previsto' : r ? 'Realizado' : 'Sem registro'
          return (
            <div key={nome} className="flex flex-col items-center gap-1" title={`${nome}: ${estado}`}>
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