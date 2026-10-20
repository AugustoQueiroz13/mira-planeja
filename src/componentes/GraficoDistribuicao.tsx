import { useState } from 'react'
import {
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
  Treemap,
} from 'recharts'
import type { Contagem } from '../tipos'

const CORES = ['#3C9C3C', '#54B460', '#78C03C', '#30B4A8', '#639922', '#8FCB6E', '#2AA79B', '#A7D89A']

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
}: {
  titulo?: string
  dados: Contagem[]
}) {
  const [lado, setLado] = useState<'barras' | 'treemap'>('barras')
  const total = dados.reduce((s, d) => s + d.quantidade, 0) || 1
  const treemapData = dados.map((d) => ({ name: d.rotulo, size: d.quantidade }))

  const rosca = (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={dados}
          dataKey="quantidade"
          nameKey="rotulo"
          cx="50%"
          cy="50%"
          innerRadius={65}
          outerRadius={110}
          paddingAngle={2}
          labelLine={false}
        >
          {dados.map((_, i) => (
            <Cell key={i} fill={CORES[i % CORES.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v, n) => {
            const q = Number(v) || 0
            return [`${q} (${Math.round((q / total) * 100)}%)`, n]
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )

  const barras = (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={dados} layout="vertical" margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
        <XAxis type="number" stroke="#18303C" fontSize={12} allowDecimals={false} />
        <YAxis type="category" dataKey="rotulo" stroke="#18303C" fontSize={11} width={140} />
        <Tooltip />
        <Bar dataKey="quantidade" radius={[0, 6, 6, 0]}>
          {dados.map((_, i) => (
            <Cell key={i} fill={CORES[i % CORES.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )

  const treemap = (
    <ResponsiveContainer width="100%" height={300}>
      <Treemap data={treemapData} dataKey="size" content={<ConteudoTreemap />} isAnimationActive={false}>
        <Tooltip />
      </Treemap>
    </ResponsiveContainer>
  )

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-medium text-mira-escuro">{titulo}</h3>
        <div className="flex items-center gap-1 print:hidden">
          <span className="mr-1 text-xs text-mira-escuro/50">Ao lado:</span>
          {(['barras', 'treemap'] as const).map((o) => (
            <button
              key={o}
              onClick={() => setLado(o)}
              className={`rounded px-2 py-1 text-xs transition ${
                lado === o ? 'bg-mira-escuro text-white' : 'bg-mira-bege text-mira-escuro'
              }`}
            >
              {o === 'barras' ? 'Barras' : 'Treemap'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0">{rosca}</div>
        <div className="min-w-0">{lado === 'barras' ? barras : treemap}</div>
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {dados.map((d, i) => (
          <li key={i} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: CORES[i % CORES.length] }}
            />
            <span className="flex-1 truncate text-mira-escuro/80">{d.rotulo}</span>
            <span className="text-mira-escuro/50">{d.quantidade}</span>
            <span className="w-10 text-right font-medium text-mira-escuro">
              {Math.round((d.quantidade / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}