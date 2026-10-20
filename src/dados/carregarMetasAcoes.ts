import { useEffect, useState } from 'react'
import type { MetasAcoes } from '../tipos'

export function useMetasAcoes() {
  const [metasAcoes, setMetasAcoes] = useState<MetasAcoes | null>(null)
  useEffect(() => {
    fetch('/metas-acoes.json')
      .then((r) => (r.ok ? r.json() : null))
      .then(setMetasAcoes)
      .catch(() => setMetasAcoes(null))
  }, [])
  return metasAcoes
}