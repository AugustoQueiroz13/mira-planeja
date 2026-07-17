type Props = {
  titulo: string
  percentual: number
  legenda: string
  cor?: string
}

export function CardMeta({ titulo, percentual, legenda, cor = '#3C9C3C' }: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(percentual)))
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-mira-verde">{titulo}</p>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-2 flex-1 rounded-full bg-mira-bege">
          <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: cor }} />
        </div>
        <span className="text-sm font-bold text-mira-escuro">{pct}%</span>
      </div>
      <p className="mt-1 text-xs leading-tight text-mira-escuro/55">{legenda}</p>
    </div>
  )
}