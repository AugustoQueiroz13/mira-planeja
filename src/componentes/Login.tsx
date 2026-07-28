import { useState } from 'react'

export function Login({ aoEntrar }: { aoEntrar: () => void }) {
  const [senha, setSenha] = useState('')
  const [verificando, setVerificando] = useState(false)
  const [erro, setErro] = useState('')

  async function entrar() {
    if (!senha) return
    setVerificando(true)
    setErro('')
    try {
      const resp = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha }),
      })
      if (resp.ok) {
        aoEntrar()
      } else if (resp.status === 401) {
        setErro('Senha incorreta.')
      } else {
        setErro('Não foi possível verificar agora. Tente novamente em instantes.')
      }
    } catch {
      setErro('Não foi possível conectar. Verifique a conexão e tente de novo.')
    } finally {
      setVerificando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-mira-bege p-8">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-lg font-bold text-mira-escuro">SMA · Área de administração</h1>
        <p className="mt-2 text-sm text-mira-escuro/60">
          Digite a senha para acessar o carregamento de planilhas.
        </p>

        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && entrar()}
          placeholder="Senha"
          autoFocus
          className="mt-5 w-full rounded-lg border border-mira-escuro/15 bg-white px-3 py-2 text-sm text-mira-escuro"
        />

        {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}

        <button
          onClick={entrar}
          disabled={verificando || !senha}
          className="mt-4 w-full rounded-lg bg-mira-verde px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {verificando ? 'Verificando...' : 'Entrar'}
        </button>
      </div>
    </div>
  )
}