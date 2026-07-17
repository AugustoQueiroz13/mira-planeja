import type { Metas, SiglaPrograma } from '../tipos'

const ORDEM: SiglaPrograma[] = ['PGP', 'PEA', 'PAG', 'PCS']
const CORES: Record<SiglaPrograma, string> = {
  PGP: '#3C9C3C',
  PEA: '#54B460',
  PAG: '#78C03C',
  PCS: '#30B4A8',
}

export function MetasPorProjeto({ metas }: { metas: Metas }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="mb-4 font-medium text-mira-escuro">Metas por projeto</h3>
      <div className="space-y-4">
        {ORDEM.map((s) => {
          const pct = Math.max(0, Math.min(100, Math.round(metas.por_projeto[s] ?? 0)))
          return (
            <div key={s} className="flex items-center gap-3">
              <span className="w-10 text-sm font-medium text-mira-escuro">{s}</span>
              <div className="h-4 flex-1 rounded-full bg-mira-bege">
                <div
                  className="h-4 rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: CORES[s] }}
                />
              </div>
              <span className="w-12 text-right text-sm font-bold text-mira-escuro">{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}