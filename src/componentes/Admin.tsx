export function Admin() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-mira-bege p-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-bold text-mira-escuro">SMA · Área de administração</h1>
        <p className="mt-3 text-sm text-mira-escuro/70">
          Esta área é protegida. O acesso por senha será ativado na próxima etapa, e só depois de
          entrar é que o carregamento de planilha ficará disponível aqui.
        </p>
      </div>
    </div>
  )
}