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
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { Comunicacao, RedeSeguidores } from '../tipos'

// Cores reconhecíveis por rede; Facebook e Linkedin em tons distintos de azul
const CORES_REDE: Record<string, string> = {
  Instagram: '#C13584',
  Facebook: '#1877F2',
  YouTube: '#E63946',
  TikTok: '#111827',
  Linkedin: '#0A66C2',
  LinkedIn: '#0A66C2',
}
const CORES_FALLBACK = ['#3C9C3C', '#30B4A8', '#78C03C', '#54B460']

function corRede(rede: string, i: number) {
  return CORES_REDE[rede] ?? CORES_FALLBACK[i % CORES_FALLBACK.length]
}

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

function CardRede({ rede, i }: { rede: RedeSeguidores; i: number }) {
  const serie = rede.serie ?? []
  const atual = serie.length ? serie[serie.length - 1].valor : 0
  const inicial = serie.length ? serie[0].valor : 0
  const delta = atual - inicial
  const pct = inicial > 0 ? Math.round((delta / inicial) * 100) : atual > 0 ? 100 : 0
  const cor = corRede(rede.rede, i)
  const Icone = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus
  const corDelta =
    delta > 0 ? 'text-mira-verde' : delta < 0 ? 'text-red-500' : 'text-mira-escuro/40'

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: cor }} />
        <span className="text-sm font-semibold text-mira-escuro">{rede.rede}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-mira-escuro">{fmt(atual)}</p>
      <div className={`flex items-center gap-1 text-xs font-medium ${corDelta}`}>
        <Icone size={13} />
        {delta > 0 ? '+' : ''}
        {fmt(delta)} desde abril ({delta > 0 ? '+' : ''}
        {pct}%)
      </div>
      <div className="mt-2 h-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={serie} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
            <Line type="monotone" dataKey="valor" stroke={cor} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function GraficoOrg({ titulo, redes }: { titulo: string; redes: RedeSeguidores[] }) {
  const meses: string[] = []
  redes.forEach((r) => r.serie?.forEach((p) => !meses.includes(p.mes) && meses.push(p.mes)))
  const dados = meses.map((mes) => {
    const ponto: Record<string, number | string> = { mes }
    redes.forEach((r) => {
      const achou = r.serie?.find((p) => p.mes === mes)
      if (achou) ponto[r.rede] = achou.valor
    })
    return ponto
  })
  if (dados.length === 0) return null

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="mb-3 font-medium text-mira-escuro">{titulo}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={dados} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
          <XAxis dataKey="mes" stroke="#18303C" fontSize={12} />
          <YAxis stroke="#18303C" fontSize={12} width={48} />
          <Tooltip formatter={(v) => fmt(Number(v) || 0)} />
          <Legend />
          {redes.map((r, i) => (
            <Line
              key={r.rede}
              type="monotone"
              dataKey={r.rede}
              stroke={corRede(r.rede, i)}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function PainelComunicacao({ com }: { com: Comunicacao }) {
  const planeja = com.seguidores.filter((s) => /planeja/i.test(s.org))
  const raizes = com.seguidores.filter((s) => !/planeja/i.test(s.org))

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

      {planeja.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-mira-verde">
            Seguidores, redes do Planeja+
          </h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {planeja.map((r, i) => (
              <CardRede key={r.rede} rede={r} i={i} />
            ))}
          </div>
        </div>
      )}

      {raizes.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-mira-verde">
            Seguidores, redes da Associação Raízes
          </h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {raizes.map((r, i) => (
              <CardRede key={r.rede} rede={r} i={i} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <GraficoOrg titulo="Evolução dos seguidores, Planeja+" redes={planeja} />
        <GraficoOrg titulo="Evolução dos seguidores, Associação Raízes" redes={raizes} />
      </div>

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