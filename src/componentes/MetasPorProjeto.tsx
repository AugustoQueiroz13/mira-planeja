import type { MetasInfo, SiglaPrograma } from '../tipos'
import type { ResumoMetas } from '../tipos'

const CORES: Record<SiglaPrograma, string> = {
  PGP: '#3C9C3C',
  PEA: '#54B460',
  PAG: '#78C03C',
  PCS: '#30B4A8',
}
const ORDEM: SiglaPrograma[] = ['PGP', 'PEA', 'PAG', 'PCS']

function ordenaAcao(a: string, b: string) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  return pa[0] - pb[0] || (pa[1] || 0) - (pb[1] || 0)
}

function LinhaBarra({
  rotulo,
  pct,
  cor,
  largo,
}: {
  rotulo: string
  pct: number
  cor: string
  largo?: boolean
}) {
  const p = Math.max(0, Math.min(100, Math.round(pct)))
  return (
    <div className="flex items-center gap-3">
      <span
        className={`${largo ? 'w-56' : 'w-12'} shrink-0 truncate text-sm font-medium text-mira-escuro`}
        title={rotulo}
      >
        {rotulo}
      </span>
      <div className="h-4 flex-1 rounded-full bg-mira-bege">
        <div className="h-4 rounded-full" style={{ width: `${p}%`, backgroundColor: cor }} />
      </div>
      <span className="w-12 text-right text-sm font-bold text-mira-escuro">{p}%</span>
    </div>
  )
}

export function MetasPorProjeto({
  resumo,
  programa,
  metas,
}: {
  resumo: ResumoMetas
  programa: SiglaPrograma | 'TODOS'
  metas: MetasInfo | undefined
}) {
  if (programa === 'TODOS') {
    return (
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-medium text-mira-escuro">Metas por projeto</h3>
        <div className="space-y-4">
          {ORDEM.map((s) => (
            <LinhaBarra key={s} rotulo={s} pct={resumo.porProjeto[s]} cor={CORES[s]} />
          ))}
        </div>
      </div>
    )
  }

  const acoes = metas
    ? Object.entries(metas.acoes)
        .filter(([, d]) => d.projeto === programa && d.alvo > 0)
        .sort((a, b) => ordenaAcao(a[0], b[0]))
    : []

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="mb-4 font-medium text-mira-escuro">Metas do {programa}</h3>
      <LinhaBarra rotulo={`Projeto ${programa}`} pct={resumo.porProjeto[programa]} cor={CORES[programa]} largo />
      <div className="my-4 border-t border-mira-bege" />
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-mira-verde">Por ação</p>
      <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
        {acoes.length === 0 && (
          <p className="text-sm text-mira-escuro/50">Sem ações com meta para este projeto.</p>
        )}
        {acoes.map(([codigo, def]) => (
          <LinhaBarra
            key={codigo}
            rotulo={`${codigo} ${def.rotulo.replace(/^\s*\d+\.?\s*\d*\s*/, '')}`}
            pct={resumo.porAcao[codigo] ?? 0}
            cor={CORES[programa]}
            largo
          />
        ))}
      </div>
    </div>
  )
}