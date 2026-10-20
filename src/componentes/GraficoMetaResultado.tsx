import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { MetaItem } from '../tipos'

export function GraficoMetaResultado({ metas }: { metas: MetaItem[] }) {
  const numericas = metas.filter((m) => typeof m.meta === 'number')
  if (numericas.length === 0) return null

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="mb-3 font-medium text-mira-escuro">Meta e resultado</h3>
      <div className="space-y-5">
        {numericas.map((m, i) => {
          const meta = m.meta as number
          const realizadoNum = typeof m.realizado === 'number' ? m.realizado : null
          const dados = [
            { nome: 'Meta', valor: meta, cor: '#8FCB6E' },
            { nome: 'Resultado', valor: realizadoNum ?? 0, cor: '#2F6B2F' },
          ]
          return (
            <div key={i}>
              <p className="mb-1 text-xs text-mira-escuro/60">{m.indicador}</p>
              <ResponsiveContainer width="100%" height={90}>
                <BarChart data={dados} layout="vertical" margin={{ top: 0, right: 32, bottom: 0, left: 0 }}>
                  <XAxis type="number" hide domain={[0, meta]} />
                  <YAxis type="category" dataKey="nome" width={72} stroke="#18303C" fontSize={12} />
                  <Bar dataKey="valor" radius={[0, 6, 6, 0]} label={{ position: 'right', fontSize: 12, fill: '#18303C' }}>
                    {dados.map((d, j) => (
                      <Cell key={j} fill={d.cor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {realizadoNum === null && (
                <p className="text-xs text-mira-escuro/45">Resultado a apurar</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}