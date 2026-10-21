import { useEffect, useState, type FormEvent } from 'react'

// Dois destinatarios: o email principal recebe e o segundo entra como copia (CC).
const EMAIL_PRINCIPAL = 'carlosaugustoq.planejamais@associacaoraizes.org.br'
const EMAIL_COPIA = 'monitoramento.planejamais@associacaoraizes.org.br'
const ENDPOINT = `https://formsubmit.co/ajax/${EMAIL_PRINCIPAL}`

type Estado = 'parado' | 'enviando' | 'ok' | 'erro'

export function RodapeFeedback() {
  const [aberto, setAberto] = useState(false)
  const [estado, setEstado] = useState<Estado>('parado')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [tipo, setTipo] = useState<'Erro' | 'Sugestão'>('Erro')
  const [mensagem, setMensagem] = useState('')
  const [honey, setHoney] = useState('') // honeypot anti-spam: humanos nao preenchem

  // Fecha com a tecla Esc
  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fechar()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aberto])

  function fechar() {
    setAberto(false)
    // Pequeno atraso para nao resetar enquanto o modal some
    setTimeout(() => {
      setEstado('parado')
      setNome('')
      setEmail('')
      setTipo('Erro')
      setMensagem('')
      setHoney('')
    }, 200)
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (honey) return // robo preencheu o campo oculto: ignora silenciosamente
    if (!mensagem.trim()) return
    setEstado('enviando')
    try {
      const resp = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _cc: EMAIL_COPIA,
          _subject: `[Painel SMA] ${tipo}: relato de ${nome.trim() || 'anônimo'}`,
          _template: 'table',
          _captcha: 'false',
          Tipo: tipo,
          Nome: nome.trim() || '(não informado)',
          'Email para resposta': email.trim() || '(não informado)',
          Mensagem: mensagem.trim(),
        }),
      })
      if (resp.ok) setEstado('ok')
      else setEstado('erro')
    } catch {
      setEstado('erro')
    }
  }

  return (
    <>
      <footer className="mt-10 border-t border-mira-escuro/10 pt-6 pb-4 text-center print:hidden">
        <p className="text-xs text-mira-escuro/60">
          Encontrou algum erro nos dados ou tem uma ideia de melhoria?{' '}
          <button
            onClick={() => setAberto(true)}
            className="font-medium text-mira-verde underline underline-offset-2 hover:text-mira-escuro"
          >
            Reportar erro ou sugerir melhoria
          </button>
        </p>
      </footer>

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:hidden"
          onClick={fechar}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {estado === 'ok' ? (
              <div className="text-center">
                <h2 className="mb-2 text-lg font-bold text-mira-escuro">Mensagem enviada</h2>
                <p className="mb-5 text-sm text-mira-escuro/70">
                  Obrigado pela contribuição. Sua mensagem foi encaminhada para a equipe de
                  monitoramento.
                </p>
                <button
                  onClick={fechar}
                  className="rounded-md bg-mira-verde px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                >
                  Fechar
                </button>
              </div>
            ) : (
              <form onSubmit={enviar}>
                <div className="mb-4 flex items-start justify-between">
                  <h2 className="text-lg font-bold text-mira-escuro">
                    Reportar erro ou sugestão
                  </h2>
                  <button
                    type="button"
                    onClick={fechar}
                    className="text-mira-escuro/40 hover:text-mira-escuro"
                    aria-label="Fechar"
                  >
                    ✕
                  </button>
                </div>

                {/* Honeypot: invisivel para humanos, robos tendem a preencher */}
                <input
                  type="text"
                  name="_honey"
                  value={honey}
                  onChange={(e) => setHoney(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />

                <label className="mb-3 block">
                  <span className="mb-1 block text-xs font-medium text-mira-escuro/70">Tipo</span>
                  <div className="flex gap-2">
                    {(['Erro', 'Sugestão'] as const).map((op) => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => setTipo(op)}
                        className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition ${
                          tipo === op
                            ? 'border-mira-verde bg-mira-verde text-white'
                            : 'border-mira-escuro/20 text-mira-escuro/70 hover:border-mira-verde'
                        }`}
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                </label>

                <label className="mb-3 block">
                  <span className="mb-1 block text-xs font-medium text-mira-escuro/70">Nome</span>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full rounded-md border border-mira-escuro/20 px-3 py-2 text-sm text-mira-escuro focus:border-mira-verde focus:outline-none"
                    placeholder="Como você se chama"
                  />
                </label>

                <label className="mb-3 block">
                  <span className="mb-1 block text-xs font-medium text-mira-escuro/70">
                    Email para resposta <span className="font-normal">(opcional)</span>
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md border border-mira-escuro/20 px-3 py-2 text-sm text-mira-escuro focus:border-mira-verde focus:outline-none"
                    placeholder="seu@email.com"
                  />
                </label>

                <label className="mb-4 block">
                  <span className="mb-1 block text-xs font-medium text-mira-escuro/70">
                    Mensagem
                  </span>
                  <textarea
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    required
                    rows={4}
                    className="w-full resize-none rounded-md border border-mira-escuro/20 px-3 py-2 text-sm text-mira-escuro focus:border-mira-verde focus:outline-none"
                    placeholder="Descreva o erro encontrado ou a sua sugestão"
                  />
                </label>

                {estado === 'erro' && (
                  <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
                    Não foi possível enviar agora. Tente novamente em instantes.
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={fechar}
                    className="rounded-md border border-mira-escuro/20 px-4 py-2 text-sm font-medium text-mira-escuro/70 transition hover:border-mira-escuro/40"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={estado === 'enviando'}
                    className="rounded-md bg-mira-verde px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    {estado === 'enviando' ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}