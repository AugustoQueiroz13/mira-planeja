import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { PontoTempo } from '../tipos'

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function rotuloMes(mes: string) {
  const [ano, m] = mes.split('-')
  return `${MESES[Number(m) - 1]}/${ano.slice(2)}`
}

export function GraficoEvolucao({ serie }: { serie: PontoTempo[] }) {
  const dados = serie.map((p) => ({ nome: rotuloMes(p.mes), atividades: p.atividades }))
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="mb-4 font-medium text-mira-escuro">Evolução temporal das atividades</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={dados} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
          <XAxis dataKey="nome" stroke="#18303C" fontSize={12} />
          <YAxis stroke="#18303C" fontSize={12} allowDecimals={false} />
          <Tooltip />
          <Line type="monotone" dataKey="atividades" stroke="#3C9C3C" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}