import { useState } from 'react'
import type { Dados } from '../tipos'

export function PainelPublicar({ dados }: { dados: Dados }) {
  const [confirmando, setConfirmando] = useState(false)
  const [senha, setSenha] = useState('')
  const [publicando, setPublicando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  function cancelar() {
    setConfirmando(false)
    setSenha('')
  }

  async function publicar() {
    if (!senha) return
    setPublicando(true)
    setMsg(null)
    try {
      const resp = await fetch('/api/publicar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha, dados }),
      })
      if (resp.ok) {
        setMsg({ tipo: 'ok', texto: 'Publicado. O painel público atualiza em cerca de um minuto.' })
        setConfirmando(false)
        setSenha('')
      } else if (resp.status === 401) {
        setMsg({ tipo: 'erro', texto: 'Senha incorreta.' })
      } else if (resp.status === 422) {
        setMsg({
          tipo: 'erro',
          texto: 'Conteúdo inválido: a planilha carregada não tem atividades válidas.',
        })
      } else {
        setMsg({ tipo: 'erro', texto: 'Não foi possível publicar agora. Tente novamente em instantes.' })
      }
    } catch {
      setMsg({ tipo: 'erro', texto: 'Não foi possível conectar. Verifique a conexão e tente de novo.' })
    } finally {
      setPublicando(false)
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setConfirmando(true)
          setMsg(null)
        }}
        className="rounded-md bg-mira-verde px-3 py-1 text-xs font-medium text-white transition hover:opacity-90"
      >
        Publicar
      </button>

      {confirmando && (
        <div className="mt-2 w-full rounded-md border border-amber-300 bg-white p-3">
          <p className="text-sm font-medium text-mira-escuro">
            Isto vai substituir o dado que todos veem. Digite a senha para confirmar.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && publicar()}
              placeholder="Senha"
              autoFocus
              className="rounded-lg border border-mira-escuro/15 bg-white px-3 py-2 text-sm text-mira-escuro"
            />
            <button
              onClick={publicar}
              disabled={publicando || !senha}
              className="rounded-lg bg-mira-verde px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {publicando ? 'Publicando...' : 'Confirmar publicação'}
            </button>
            <button
              onClick={cancelar}
              disabled={publicando}
              className="rounded-lg border border-mira-escuro/20 px-4 py-2 text-sm font-medium text-mira-escuro/70 transition hover:bg-mira-bege"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {msg && (
        <p
          className={`mt-2 w-full text-sm ${
            msg.tipo === 'ok' ? 'text-green-700' : 'text-red-600'
          }`}
        >
          {msg.texto}
        </p>
      )}
    </>
  )
}