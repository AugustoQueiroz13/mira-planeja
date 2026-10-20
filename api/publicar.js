import crypto from 'crypto'

// Função de servidor do Vercel: publica o dados.json no repositório.
// Revalida a senha, valida o conteúdo e grava usando o GITHUB_TOKEN.
// É a única peça com poder de escrever, porque só ela enxerga o token.

const OWNER = 'AugustoQueiroz13'
const REPO = 'mira-planeja'
const CAMINHO = 'public/dados.json'
const BRANCH = 'main'

function senhaConfere(senha, segredo) {
  const a = crypto.createHash('sha256').update(String(senha || '')).digest()
  const b = crypto.createHash('sha256').update(String(segredo)).digest()
  return crypto.timingSafeEqual(a, b)
}

function conteudoValido(dados) {
  if (!dados || typeof dados !== 'object') return false
  if (!dados.programas || typeof dados.programas !== 'object') return false
  const siglas = ['PEA', 'PAG', 'PGP', 'PCS']
  let total = 0
  for (const s of siglas) {
    const p = dados.programas[s]
    if (!p || !Array.isArray(p.atividades)) return false
    total += p.atividades.length
  }
  return total > 0
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, erro: 'Método não permitido' })
  }

  const segredo = process.env.SEGREDO_ADMIN
  const token = process.env.GITHUB_TOKEN
  if (!segredo || !token) {
    return res.status(500).json({ ok: false, erro: 'Configuração do servidor incompleta' })
  }

  let senha = ''
  let dados = null
  try {
    const corpo = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    senha = corpo.senha
    dados = corpo.dados
  } catch {
    return res.status(400).json({ ok: false, erro: 'Requisição inválida' })
  }

  if (!senhaConfere(senha, segredo)) {
    return res.status(401).json({ ok: false, erro: 'Senha incorreta' })
  }

  if (!conteudoValido(dados)) {
    return res
      .status(422)
      .json({ ok: false, erro: 'Conteúdo inválido: estrutura inesperada ou sem atividades' })
  }

  const cabecalhos = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'sma-planeja-publicacao',
  }
  const urlBase = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${CAMINHO}`

  try {
    // Pega o sha atual do arquivo (necessário para sobrescrever).
    let sha
    const atual = await fetch(`${urlBase}?ref=${BRANCH}`, { headers: cabecalhos })
    if (atual.ok) {
      const info = await atual.json()
      sha = info.sha
    } else if (atual.status !== 404) {
      const t = await atual.text()
      return res
        .status(502)
        .json({ ok: false, erro: 'Falha ao ler o arquivo atual', detalhe: t.slice(0, 200) })
    }

    const conteudoB64 = Buffer.from(JSON.stringify(dados, null, 2), 'utf-8').toString('base64')
    const corpoPut = {
      message: `chore: publica dados.json via SMA (${new Date().toISOString()})`,
      content: conteudoB64,
      branch: BRANCH,
    }
    if (sha) corpoPut.sha = sha

    const grava = await fetch(urlBase, {
      method: 'PUT',
      headers: { ...cabecalhos, 'Content-Type': 'application/json' },
      body: JSON.stringify(corpoPut),
    })

    if (!grava.ok) {
      const t = await grava.text()
      return res
        .status(502)
        .json({ ok: false, erro: 'Falha ao gravar no repositório', detalhe: t.slice(0, 200) })
    }

    return res.status(200).json({ ok: true })
  } catch {
    return res.status(500).json({ ok: false, erro: 'Erro inesperado ao publicar' })
  }
}