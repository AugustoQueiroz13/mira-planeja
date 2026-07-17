import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { Contagem } from '../tipos'

type Props = {
  titulo: string
  dados: Contagem[]
  cores?: Record<string, string>
  corPadrao?: string
}

export function GraficoBarras({ titulo, dados, cores, corPadrao = '#3C9C3C' }: Props) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="mb-4 font-medium text-mira-escuro">{titulo}</h3>
      {dados.length === 0 ? (
        <p className="text-sm text-mira-escuro/50">Sem dados no filtro atual.</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={dados} layout="vertical" margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
            <XAxis type="number" stroke="#18303C" fontSize={12} allowDecimals={false} />
            <YAxis type="category" dataKey="rotulo" stroke="#18303C" fontSize={12} width={110} />
            <Tooltip />
            <Bar dataKey="quantidade" radius={[0, 6, 6, 0]}>
              {dados.map((d) => (
                <Cell key={d.rotulo} fill={cores?.[d.rotulo] ?? corPadrao} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}