import { useRef, useState } from 'react'
import { lerPlanilha } from '../dados/lerPlanilha'
import type { Dados } from '../tipos'

export function BotaoUpload({
  aoCarregar,
  aoErro,
}: {
  aoCarregar: (d: Dados) => void
  aoErro: (msg: string) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [carregando, setCarregando] = useState(false)

  async function aoSelecionar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCarregando(true)
    aoErro('')
    try {
      const dados = await lerPlanilha(file)
      aoCarregar(dados)
    } catch (err) {
      console.error(err)
      aoErro('Não consegui ler esta planilha. Confira se é o arquivo de atividades no formato padrão.')
    } finally {
      setCarregando(false)
      if (ref.current) ref.current.value = ''
    }
  }

  return (
    <>
      <button
        onClick={() => ref.current?.click()}
        disabled={carregando}
        className="rounded-md border border-mira-verde px-3 py-1.5 text-xs font-medium text-mira-verde transition hover:bg-mira-verde hover:text-white disabled:opacity-50 print:hidden"
      >
        {carregando ? 'Carregando...' : 'Carregar planilha'}
      </button>
      <input
        ref={ref}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={aoSelecionar}
      />
    </>
  )
}