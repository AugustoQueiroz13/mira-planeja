import type { Atividade } from '../tipos'

function resumo(texto: string, limite = 160) {
  return texto.length > limite ? texto.slice(0, limite) + '...' : texto
}

export function TabelaAcoes({
  atividades,
  aoAbrir,
}: {
  atividades: Atividade[]
  aoAbrir: (a: Atividade) => void
}) {
  if (atividades.length === 0) {
    return (
      <div className="rounded-xl bg-white p-8 text-center text-mira-escuro/60 shadow-sm">
        Nenhuma atividade registrada para este projeto no período.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-mira-escuro text-white">
          <tr>
            <th className="p-3">Atividade</th>
            <th className="p-3">Data</th>
            <th className="p-3">Regional</th>
            <th className="p-3">Estado</th>
            <th className="p-3">Município</th>
            <th className="p-3 text-right">Particip.</th>
            <th className="p-3">Resultados</th>
          </tr>
        </thead>
        <tbody>
          {atividades.map((a, i) => (
            <tr
              key={i}
              onClick={() => aoAbrir(a)}
              className="cursor-pointer border-b border-mira-bege align-top hover:bg-mira-bege/50"
            >
              <td className="p-3 font-medium text-mira-escuro">{a.atividade}</td>
              <td className="whitespace-nowrap p-3 text-mira-escuro/70">{a.data}</td>
              <td className="p-3 text-mira-escuro/70">{a.regional}</td>
              <td className="p-3 text-mira-escuro/70">{a.estado}</td>
              <td className="p-3 text-mira-escuro/70">{a.municipio}</td>
              <td className="p-3 text-right text-mira-escuro/70">{a.participantes}</td>
              <td className="p-3 text-mira-escuro/70">{resumo(a.resultados)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}