import type { Dados } from '../tipos'

export function AvisoQualidade({ qualidade }: { qualidade: Dados['qualidade'] }) {
  const itens = qualidade?.municipios_a_revisar ?? []
  if (itens.length === 0) return null

  return (
    <div className="mt-8 rounded-xl border border-amber-300 bg-amber-50 p-4 print:hidden">
      <p className="text-sm font-medium text-amber-800">
        {itens.length} {itens.length === 1 ? 'município a revisar' : 'municípios a revisar'} na planilha
      </p>
      <p className="mt-1 text-xs text-amber-700/80">
        Estes registros não foram reconhecidos como municípios do programa. Vale conferir na planilha
        e corrigir o preenchimento.
      </p>
      <ul className="mt-3 space-y-1 text-xs text-amber-900/80">
        {itens.map((item, i) => (
          <li key={i} className="flex flex-wrap gap-x-2">
            <span className="font-medium">{item.valor || '(vazio)'}</span>
            <span className="text-amber-700/70">em {item.referencia}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}