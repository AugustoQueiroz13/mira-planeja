import { useEffect, useState } from 'react'
import type { Dados } from '../tipos'

export function useDados() {
  const [dados, setDados] = useState<Dados | null>(null)
  useEffect(() => {
    fetch('/dados.json')
      .then((r) => r.json())
      .then(setDados)
  }, [])
  return dados
}