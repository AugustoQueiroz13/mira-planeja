type Props = {
  titulo: string
  valor: number | string
  legenda?: string
  aoClicar?: () => void
}

export function CardKPI({ titulo, valor, legenda, aoClicar }: Props) {
  const clicavel = !!aoClicar
  return (
    <div
      onClick={aoClicar}
      className={`rounded-xl bg-white p-4 shadow-sm ${
        clicavel ? 'cursor-pointer transition hover:ring-2 hover:ring-mira-verde/40' : ''
      }`}
    >
      <p className="text-sm font-medium text-mira-verde">{titulo}</p>
      <p className="text-2xl font-bold text-mira-escuro">{valor}</p>
      {legenda && <p className="text-xs leading-tight text-mira-escuro/55">{legenda}</p>}
    </div>
  )
}