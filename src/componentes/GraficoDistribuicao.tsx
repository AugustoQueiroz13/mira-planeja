import { useState } from 'react'
import {
  Treemap,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts'
import type { Contagem } from '../tipos'

export type TipoGrafico = 'treemap' | 'pizza' | 'barras'

const CORES = ['#3C9C3C', '#54B460', '#78C03C', '#30B4A8', '#639922', '#8FCB6E', '#2AA79B', '#A7D89A']
const ROTULO: Record<TipoGrafico, string> = { treemap: 'Treemap', pizza: 'Pizza', barras: 'Barras' }

function ConteudoTreemap(props: any) {
  const { x, y, width, height, index, name, size } = props
  if (width < 1 || height < 1) return null
  const cor = CORES[index % CORES.length]
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} style={{ fill: cor, stroke: '#fff', strokeWidth: 2 }} />
      {width > 60 && height > 22 && (
        <text x={x + 6} y={y + 18} fill="#fff" fontSize={12}>{name}</text>
      )}
      {width > 60 && height > 38 && (
        <text x={x + 6} y={y + 34} fill="#fff" fontSize={11} opacity={0.9}>{size}</text>
      )}
    </g>
  )
}

export function GraficoDistribuicao({
  titulo = 'Atividade por tipo',
  dados,
  padrao = 'treemap',
}: {
  titulo?: string
  dados: Contagem[]
  padrao?: TipoGrafico
}) {
  const [tipo, setTipo] = useState<TipoGrafico>(padrao)
  const opcoes: TipoGrafico[] = ['treemap', 'pizza', 'barras']
  const treemapData = dados.map((d) => ({ name: d.rotulo, size: d.quantidade }))

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-medium text-mira-escuro">{titulo}</h3>
        <div className="flex gap-1 print:hidden">
          {opcoes.map((o) => (
            <button
              key={o}
              onClick={() => setTipo(o)}
              className={`rounded px-2 py-1 text-xs transition ${
                tipo === o ? 'bg-mira-escuro text-white' : 'bg-mira-bege text-mira-escuro'
              }`}
            >
              {ROTULO[o]}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        {tipo === 'treemap' ? (
          <Treemap data={treemapData} dataKey="size" content={<ConteudoTreemap />} isAnimationActive={false}>
            <Tooltip />
          </Treemap>
        ) : tipo === 'pizza' ? (
          <PieChart>
            <Pie
              data={dados}
              dataKey="quantidade"
              nameKey="rotulo"
              cx="50%"
              cy="50%"
              outerRadius={85}
              label={({ percent }) => `${Math.round((percent || 0) * 100)}%`}
            >
              {dados.map((_, i) => (
                <Cell key={i} fill={CORES[i % CORES.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        ) : (
          <BarChart data={dados} layout="vertical" margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
            <XAxis type="number" stroke="#18303C" fontSize={12} allowDecimals={false} />
            <YAxis type="category" dataKey="rotulo" stroke="#18303C" fontSize={11} width={130} />
            <Tooltip />
            <Bar dataKey="quantidade" radius={[0, 6, 6, 0]}>
              {dados.map((_, i) => (
                <Cell key={i} fill={CORES[i % CORES.length]} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}