const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const TRIMESTRES = ['T1', 'T2', 'T3', 'T4']

function Faixa({ ativos, cor }: { ativos: Set<number>; cor: string }) {
  return (
    <div className="grid flex-1 grid-cols-12 gap-1">
      {MESES.map((_, i) => {
        const m = i + 1
        return (
          <div
            key={m}
            className="h-5 rounded"
            style={{ backgroundColor: ativos.has(m) ? cor : '#EDEBE3' }}
          />
        )
      })}
    </div>
  )
}

export function Cronograma({
  previsto,
  realizado,
  ano = 2026,
}: {
  previsto: number[]
  realizado: number[]
  ano?: number
}) {
  const prev = new Set(previsto)
  const real = new Set(realizado)

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="mb-4 font-medium text-mira-escuro">Cronograma</h3>

      <div className="overflow-x-auto">
        <div className="min-w-[560px] space-y-1">
          <div className="flex">
            <div className="w-24 shrink-0" />
            <div className="grid flex-1 grid-cols-4">
              {TRIMESTRES.map((t) => (
                <div
                  key={t}
                  className="border-l border-mira-bege px-2 text-xs font-medium text-mira-escuro/70"
                >
                  {t} {ano}
                </div>
              ))}
            </div>
          </div>

          <div className="flex">
            <div className="w-24 shrink-0" />
            <div className="grid flex-1 grid-cols-12">
              {MESES.map((mes) => (
                <div key={mes} className="text-center text-[10px] text-mira-escuro/50">
                  {mes}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-24 shrink-0 text-xs text-mira-escuro/70">Previsto</div>
            <Faixa ativos={prev} cor="#8FCB6E" />
          </div>

          <div className="flex items-center">
            <div className="w-24 shrink-0 text-xs text-mira-escuro/70">Realizado</div>
            <Faixa ativos={real} cor="#2F6B2F" />
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-4 text-xs text-mira-escuro/60">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: '#8FCB6E' }} />
          Previsto
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: '#2F6B2F' }} />
          Realizado
        </span>
      </div>
    </div>
  )
}