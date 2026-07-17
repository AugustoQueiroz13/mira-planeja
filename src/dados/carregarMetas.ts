import { useEffect, useState } from 'react'
import type { Metas } from '../tipos'

const PADRAO: Metas = {
  globais: { programa: 0, trimestre: 0 },
  por_projeto: { PEA: 0, PAG: 0, PGP: 0, PCS: 0 },
}

export function useMetas() {
  const [metas, setMetas] = useState<Metas>(PADRAO)
  useEffect(() => {
    fetch('/metas.json')
      .then((r) => (r.ok ? r.json() : PADRAO))
      .then(setMetas)
      .catch(() => setMetas(PADRAO))
  }, [])
  return metas
}