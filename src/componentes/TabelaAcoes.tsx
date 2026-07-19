import { useMemo, useState } from 'react'
import type { Atividade } from '../tipos'

type Coluna = 'atividade' | 'data' | 'regional' | 'estado' | 'municipio' | 'participantes'

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
  const [busca, setBusca] = useState('')
  const [ordem, setOrdem] = useState<{ coluna: Coluna; asc: boolean } | null>(null)

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    let r = atividades
    if (termo) {
      r = r.filter((a) =>
        [a.atividade, a.municipio, a.regional, a.estado, a.resultados].some((c) =>
          (c || '').toLowerCase().includes(termo)
        )
      )
    }
    if (ordem) {
      r = [...r].sort((a, b) => {
        let va: string | number
        let vb: string | number
        if (ordem.coluna === 'participantes') {
          va = a.participantes
          vb = b.participantes
        } else if (ordem.coluna === 'data') {
          va = a.data_iso
          vb = b.data_iso
        } else {
          va = (a[ordem.coluna] || '').toString().toLowerCase()
          vb = (b[ordem.coluna] || '').toString().toLowerCase()
        }
        if (va < vb) return ordem.asc ? -1 : 1
        if (va > vb) return ordem.asc ? 1 : -1
        return 0
      })
    }
    return r
  }, [atividades, busca, ordem])

  function ordenarPor(coluna: Coluna) {
    setOrdem((o) => (o && o.coluna === coluna ? { coluna, asc: !o.asc } : { coluna, asc: true }))
  }

  function seta(coluna: Coluna) {
    if (!ordem || ordem.coluna !== coluna) return ''
    return ordem.asc ? ' ↑' : ' ↓'
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar atividade, município, regional..."
        className="w-full rounded-lg border border-mira-escuro/15 bg-white px-3 py-2 text-sm text-mira-escuro md:max-w-sm"
      />

      {lista.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-mira-escuro/60 shadow-sm">
          Nenhuma atividade encontrada.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-mira-escuro text-white">
              <tr>
                <th className="cursor-pointer select-none p-3" onClick={() => ordenarPor('atividade')}>
                  Atividade{seta('atividade')}
                </th>
                <th className="cursor-pointer select-none p-3" onClick={() => ordenarPor('data')}>
                  Data{seta('data')}
                </th>
                <th className="cursor-pointer select-none p-3" onClick={() => ordenarPor('regional')}>
                  Regional{seta('regional')}
                </th>
                <th className="cursor-pointer select-none p-3" onClick={() => ordenarPor('estado')}>
                  Estado{seta('estado')}
                </th>
                <th className="cursor-pointer select-none p-3" onClick={() => ordenarPor('municipio')}>
                  Município{seta('municipio')}
                </th>
                <th
                  className="cursor-pointer select-none p-3 text-right"
                  onClick={() => ordenarPor('participantes')}
                >
                  Particip.{seta('participantes')}
                </th>
                <th className="p-3">Resultados</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((a, i) => (
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
      )}
    </div>
  )
}