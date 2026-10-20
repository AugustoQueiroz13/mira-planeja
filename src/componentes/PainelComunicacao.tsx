import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { Comunicacao } from '../tipos'

const CORES = ['#3C9C3C', '#30B4A8', '#78C03C', '#639922', '#2AA79B', '#8FCB6E', '#54B460', '#A7D89A']

function fmt(n: number) {
  return n.toLocaleString('pt-BR')
}

function Kpi({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-mira-verde">{titulo}</p>
      <p className="text-2xl font-bold text-mira-escuro">{valor}</p>
    </div>
  )
}

export function PainelComunicacao({ com }: { com: Comunicacao }) {
  // Rede sociais do Planeja+ para o grafico (as do programa)
  const redes = com.seguidores.filter((s) => /planeja/i.test(s.org))
  const base = redes.length ? redes : com.seguidores

  // monta dados do grafico: um ponto por mes, uma coluna por rede
  const meses: string[] = []
  base.forEach((r) => r.serie.forEach((p) => !meses.includes(p.mes) && meses.push(p.mes)))
  const dadosGrafico = meses.map((mes) => {
    const ponto: Record<string, number | string> = { mes }
    base.forEach((r) => {
      const achou = r.serie.find((p) => p.mes === mes)
      if (achou) ponto[r.rede] = achou.valor
    })
    return ponto
  })

  return (
    <div className="mt-6 space-y-6">
      <h2 className="text-lg font-medium text-mira-escuro">Comunicação do PCS</h2>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi titulo="Matérias na imprensa" valor={com.total_materias} />
        <Kpi titulo="Publicações" valor={com.engajamento.posts} />
        <Kpi titulo="Interações" valor={fmt(com.engajamento.interacoes)} />
        <Kpi titulo="Visualizações" valor={fmt(com.engajamento.visualizacoes)} />
        <Kpi titulo="Membros no Whatsapp" valor={fmt(com.whatsapp.total)} />
      </div>

      {dadosGrafico.length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-medium text-mira-escuro">Seguidores por rede</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dadosGrafico} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
              <XAxis dataKey="mes" stroke="#18303C" fontSize={12} />
              <YAxis stroke="#18303C" fontSize={12} />
              <Tooltip formatter={(v) => fmt(Number(v) || 0)} />
              <Legend />
              {base.map((r, i) => (
                <Line
                  key={r.rede}
                  type="monotone"
                  dataKey={r.rede}
                  stroke={CORES[i % CORES.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {com.imprensa.length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-medium text-mira-escuro">Matérias na imprensa</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-mira-bege text-mira-escuro/60">
                <tr>
                  <th className="p-2">Tema</th>
                  <th className="p-2">Veículo</th>
                  <th className="p-2">Tipo</th>
                  <th className="p-2">Data</th>
                  <th className="p-2">Matéria</th>
                </tr>
              </thead>
              <tbody>
                {com.imprensa.map((m, i) => (
                  <tr key={i} className="border-b border-mira-bege/60 align-top">
                    <td className="p-2 font-medium text-mira-escuro">{m.tema}</td>
                    <td className="p-2 text-mira-escuro/70">{m.veiculo}</td>
                    <td className="p-2 text-mira-escuro/70">{m.tipo_midia}</td>
                    <td className="whitespace-nowrap p-2 text-mira-escuro/70">{m.data}</td>
                    <td className="p-2">
                      {m.link ? (
                        <a
                          href={m.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-mira-verde hover:underline"
                        >
                          abrir
                        </a>
                      ) : (
                        <span className="text-mira-escuro/40">sem link</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}