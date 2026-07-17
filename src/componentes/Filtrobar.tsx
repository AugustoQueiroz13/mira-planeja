type Props = {
  municipios: string[]
  acoes: { codigo: string; nome: string }[]
  municipio: string
  acao: string
  inicio: string
  fim: string
  setMunicipio: (v: string) => void
  setAcao: (v: string) => void
  setInicio: (v: string) => void
  setFim: (v: string) => void
}

const campo = 'rounded-lg border border-mira-escuro/15 bg-white px-3 py-2 text-sm text-mira-escuro'
const rotulo = 'flex flex-col gap-1 text-xs font-medium text-mira-escuro/60'

export function FiltroBar(p: Props) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <label className={rotulo}>
        Município
        <select className={campo} value={p.municipio} onChange={(e) => p.setMunicipio(e.target.value)}>
          <option value="TODOS">Todos os municípios</option>
          {p.municipios.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </label>

      <label className={rotulo}>
        Ação
        <select className={`${campo} max-w-xs`} value={p.acao} onChange={(e) => p.setAcao(e.target.value)}>
          <option value="TODAS">Todas</option>
          {p.acoes.map((a) => (
            <option key={a.codigo} value={a.codigo}>{a.nome}</option>
          ))}
        </select>
      </label>

      <label className={rotulo}>
        De
        <input type="date" className={campo} value={p.inicio} onChange={(e) => p.setInicio(e.target.value)} />
      </label>

      <label className={rotulo}>
        Até
        <input type="date" className={campo} value={p.fim} onChange={(e) => p.setFim(e.target.value)} />
      </label>
    </div>
  )
}