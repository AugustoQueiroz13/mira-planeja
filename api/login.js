import crypto from 'crypto'

// Função de servidor do Vercel: confere a senha de administração.
// A senha real fica na variável de ambiente SEGREDO_ADMIN, guardada no
// servidor, nunca no código. A comparação usa hash mais tempo constante,
// para não vazar informação pelo tempo de resposta.

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, erro: 'Método não permitido' })
  }

  const segredo = process.env.SEGREDO_ADMIN
  if (!segredo) {
    return res.status(500).json({ ok: false, erro: 'Segredo não configurado no servidor' })
  }

  let senha = ''
  try {
    const corpo = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    senha = String(corpo.senha || '')
  } catch {
    senha = ''
  }

  const a = crypto.createHash('sha256').update(senha).digest()
  const b = crypto.createHash('sha256').update(segredo).digest()
  const confere = crypto.timingSafeEqual(a, b)

  if (confere) {
    return res.status(200).json({ ok: true })
  }
  return res.status(401).json({ ok: false })
}