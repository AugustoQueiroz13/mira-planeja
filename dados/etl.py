"""
ETL do painel de atividades do Planeja+ (SMA).

Le as planilhas de atividades geradas pelo PINAR (uma ou varias, uma por
periodo) da pasta de entrada, le a planilha de METAS (alvos por acao e
totais por projeto), deduplica atividades intermunicipais e grava um unico
dados.json que o front-end consome.

Uso:
    python dados/etl.py dados/entrada public/dados.json dados/metas.xlsx

- 1o argumento: pasta com as planilhas de atividades (ou um arquivo unico)
- 2o argumento: caminho do dados.json de saida
- 3o argumento: caminho da planilha de METAS (opcional)
"""

import os
import re
import sys
import glob
import json
import unicodedata
from datetime import datetime

import pandas as pd
from openpyxl import load_workbook

from canonicaliza import canonicaliza
from comunicacao import carrega_comunicacao

PROGRAMAS = ["PEA", "PAG", "PGP", "PCS"]

# Data de corte: atividades DEPOIS desta data nao aparecem no painel.
# Para liberar outubro, troque para pd.Timestamp(2026, 10, 31), e assim por diante.
LIMITE_DATA = pd.Timestamp(2026, 9, 30)

# ------------------------------------------------------------------ utilidades

def limpa_texto(v):
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return ""
    return re.sub(r"\s+", " ", str(v)).strip()


def normaliza_programa(v):
    p = limpa_texto(v).upper()
    return p if p in PROGRAMAS else (p or "NAO_INFORMADO")


def extrai_codigo_acao(atividade):
    txt = limpa_texto(atividade)
    m = re.match(r"^\s*(\d+)\s*\.\s*(\d+)", txt)
    if m:
        return f"{m.group(1)}.{m.group(2)}"
    m = re.match(r"^\s*(\d+)\b", txt)
    if m:
        return m.group(1)
    return "s/codigo"


def parse_data(v):
    if isinstance(v, (datetime, pd.Timestamp)):
        return pd.Timestamp(v).normalize()
    txt = limpa_texto(v)
    datas = re.findall(r"(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})", txt)
    if datas:
        d, mth, y = datas[-1]
        y = int(y) + (2000 if len(y) == 2 else 0)
        try:
            return pd.Timestamp(int(y), int(mth), int(d)).normalize()
        except ValueError:
            return pd.NaT
    return pd.NaT


def para_int(v):
    n = pd.to_numeric(v, errors="coerce")
    return int(n) if pd.notna(n) else 0


def municipios_da_celula(valor):
    res = canonicaliza(valor)
    in_scope = list(dict.fromkeys(r["municipio"] for r in res if r["status"] == "ok"))
    if in_scope:
        return in_scope, "; ".join(in_scope), "ok"
    if all(r["status"] == "institucional" for r in res):
        return [], "", "institucional"
    return [], limpa_texto(valor), "revisar"


# ------------------------------------------------------------------ leitura das atividades

MAPA_COLUNAS = {
    "Atividade": "atividade",
    "Data prevista": "data_prevista",
    "Data realizada": "data_realizada",
    "Projeto (PEA, PAG, PGP, PCS)": "programa",
    "Projeto": "programa",
    "Regional": "regional",
    "Estado": "estado",
    "Município do Programa": "municipio",
    "Regional/Município do Programa": "municipio",
    "Local": "local",
    "Objetivo da atividade": "objetivo",
    "Objetivo": "objetivo",
    "Metodologia utilizada": "metodologia",
    "Perfil dos profissionais que conduziram o evento": "perfil",
    "Equipe técnica responsável pela atividade": "perfil",
    "Número de participantes Internos": "part_internos",
    "Número de participantes Externos": "part_externos",
    "Resultados Alcançados": "resultados",
    "Produtos/Encaminhamentos/Status": "produtos",
    "Link do Relatório": "link_relatorio",
    "Nivel de atuação": "nivel_atuacao",
    "Nível de atuação": "nivel_atuacao",
    "Ação relacionada (se houver)": "acao_relacionada",
    "Data de postagem": "data_realizada",
    "Título da peça": "titulo_peca",
    "Plataforma": "plataforma",
    "Link": "link_relatorio",
    "Link da postagem": "link_relatorio",
    "Link (se houver)": "link_relatorio",
    "Interações": "interacoes",
    "Visualizações": "visualizacoes",
}

COLS_PADRAO = [
    "atividade", "data_prevista", "data_realizada", "programa", "regional",
    "estado", "municipio", "local", "objetivo", "metodologia", "perfil",
    "part_internos", "part_externos", "resultados", "produtos",
    "link_relatorio", "nivel_atuacao", "acao_relacionada",
    "titulo_peca", "plataforma", "interacoes", "visualizacoes", "origem",
]


def _norm_col(c):
    forma = unicodedata.normalize("NFKD", str(c or "").lower())
    sem = "".join(ch for ch in forma if not unicodedata.combining(ch))
    return re.sub(r"\s+", " ", sem).strip()


MAPA_NORM = {_norm_col(k): v for k, v in MAPA_COLUNAS.items()}


def _acha_header(raw):
    """Acha a linha do cabecalho procurando a celula 'Atividade' nas 6
    primeiras linhas. Lida com planilhas que tem titulo na primeira linha
    (cabecalho na linha 2) e com as que tem o cabecalho ja na linha 1."""
    limite = min(6, len(raw))
    for i in range(limite):
        linha = [_norm_col(x) for x in raw.iloc[i].tolist()]
        if "atividade" in linha:
            return i
    return None


def _le_aba(raw):
    hi = _acha_header(raw)
    if hi is None:
        return None
    df = raw.iloc[hi + 1:].copy()
    df.columns = [_norm_col(c) for c in raw.iloc[hi].tolist()]
    df = df.loc[:, ~df.columns.duplicated()]
    cols_norm = set(df.columns)
    origem = "redes" if ("titulo da peca" in cols_norm or "plataforma" in cols_norm) else "atividade"
    renomear = {c: MAPA_NORM[c] for c in df.columns if c in MAPA_NORM}
    df = df.rename(columns=renomear)
    df = df.loc[:, ~df.columns.duplicated()]
    for col in COLS_PADRAO:
        if col not in df.columns:
            df[col] = ""
    df["origem"] = origem
    df = df[df["atividade"].notna()]
    df = df[df["atividade"].astype(str).str.strip() != ""]
    df = df[df["atividade"].astype(str).str.strip().str.lower() != "atividade"]
    return df[COLS_PADRAO]


def carrega(caminho):
    """Le TODAS as abas de atividade de um arquivo (uma por mes, por exemplo),
    ignorando abas de instrucoes. Casa as colunas sem depender de maiusculas
    ou acentos."""
    abas = pd.read_excel(caminho, sheet_name=None, header=None)
    partes = []
    for _nome, raw in abas.items():
        if raw is None or raw.empty:
            continue
        df = _le_aba(raw)
        if df is not None and len(df):
            partes.append(df)
    if not partes:
        return pd.DataFrame(columns=COLS_PADRAO)
    return pd.concat(partes, ignore_index=True)


def carrega_todos(pasta):
    if os.path.isfile(pasta):
        return carrega(pasta)
    arquivos = sorted(glob.glob(os.path.join(pasta, "*.xlsx")))
    arquivos = [a for a in arquivos if not os.path.basename(a).startswith("~$")]
    if not arquivos:
        raise FileNotFoundError(f"Nenhuma planilha .xlsx encontrada em {pasta}")
    partes = []
    for arq in arquivos:
        print(f"Lendo atividades: {os.path.basename(arq)}")
        partes.append(carrega(arq))
    return pd.concat(partes, ignore_index=True)


# ------------------------------------------------------------------ transformacao

# Cidade de referencia de cada regional (Quadro 1 do Plano de Trabalho)
SEDE_REGIONAL = {
    "I": "Marataízes", "II": "Campos", "III": "Macaé", "IV": "Cabo Frio",
    "V": "Niterói", "VI": "Caraguatatuba", "VII": "Iguape",
}
_ROMANO_REGIONAL = re.compile(r"\b(VII|VI|IV|III|II|V|I)\b")


def normaliza_regional(valor):
    """Padroniza a Regional num unico formato ('Regional III - Macaé'),
    juntando as varias grafias (numero, nome da cidade, com e sem a palavra
    'Regional') que aparecem nas planilhas de meses diferentes."""
    s = limpa_texto(valor)
    if not s:
        return ""
    low = s.lower()
    if "institucional" in low:
        return "Institucional"
    if "gerencia" in low or "gerência" in low:
        return "Gerência"
    m = _ROMANO_REGIONAL.search(s.upper())
    if m and m.group(1) in SEDE_REGIONAL:
        rom = m.group(1)
        return f"Regional {rom} - {SEDE_REGIONAL[rom]}"
    return s


def transforma(df):
    df["programa"] = df["programa"].map(normaliza_programa)
    df["codigo_acao"] = df["atividade"].map(extrai_codigo_acao)
    df["atividade"] = df["atividade"].map(limpa_texto)
    df["regional"] = df["regional"].map(normaliza_regional)
    df["estado"] = df["estado"].map(lambda v: limpa_texto(v).upper())
    for c in ["local", "objetivo", "metodologia", "perfil", "resultados",
              "produtos", "link_relatorio", "nivel_atuacao", "acao_relacionada",
              "titulo_peca", "plataforma", "origem"]:
        df[c] = df[c].map(limpa_texto)
    df["interacoes"] = df["interacoes"].map(para_int)
    df["visualizacoes"] = df["visualizacoes"].map(para_int)

    trip = df["municipio"].map(municipios_da_celula)
    df["municipios_canon"] = trip.map(lambda t: t[0])
    df["municipio"] = trip.map(lambda t: t[1])
    df["abrangencia"] = trip.map(lambda t: t[2])

    # Atividades de nivel institucional nao sao atribuidas a municipios: evita
    # parecer que os municipios executaram uma acao que e institucional e nao
    # infla a contagem de municipios atendidos.
    inst = df["regional"].str.contains("institucional", case=False, na=False)
    df.loc[inst, "municipios_canon"] = df.loc[inst, "municipios_canon"].map(lambda _: [])
    df.loc[inst, "municipio"] = "Institucional"
    df.loc[inst, "abrangencia"] = "institucional"

    df["data"] = df["data_realizada"].map(parse_data)
    df["mes_ref"] = df["data"].dt.strftime("%Y-%m")
    df["data_iso"] = df["data"].dt.strftime("%Y-%m-%d").fillna("")
    df["data_br"] = df["data"].dt.strftime("%d/%m/%Y").fillna("")

    df["part_internos"] = df["part_internos"].map(para_int)
    df["part_externos"] = df["part_externos"].map(para_int)
    df["participantes"] = df["part_internos"] + df["part_externos"]
    return df


def _norm_chave(txt):
    forma = unicodedata.normalize("NFKD", str(txt or "").lower())
    sem = "".join(c for c in forma if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", sem).strip()


def filtra_periodo(df, limite=LIMITE_DATA):
    """Remove atividades depois da data de corte (ex: outubro) e linhas
    vazias (sem data e sem conteudo), que entram como ruido."""
    if df.empty:
        return df
    antes = len(df)
    fora = df["data"].notna() & (df["data"] > limite)
    vazia = (
        df["data"].isna()
        & (df["objetivo"].astype(str).str.strip() == "")
        & (df["titulo_peca"].astype(str).str.strip() == "")
        & (df["resultados"].astype(str).str.strip() == "")
    )
    df = df[~(fora | vazia)].reset_index(drop=True)
    rem = antes - len(df)
    if rem:
        print(f"Removidas (fora do periodo ate {limite.strftime('%d/%m/%Y')} ou vazias): {rem}")
    return df


def remove_publicacao_duplicada(df):
    """A acao 28.2 (publicacoes) e contada pela planilha de redes sociais
    (origem 'redes'). Remove as linhas 28.2 que vieram do arquivo de
    atividades, para nao contar a mesma publicacao duas vezes."""
    if df.empty or "origem" not in df.columns:
        return df
    antes = len(df)
    mask = ~((df["codigo_acao"] == "28.2") & (df["origem"] != "redes"))
    df = df[mask].reset_index(drop=True)
    rem = antes - len(df)
    if rem:
        print(f"Publicacoes 28.2 duplicadas removidas do arquivo de atividades: {rem}")
    return df


def deduplica_intermunicipal(df):
    """Colapsa linhas que representam a mesma atividade intermunicipal:
    mesma data, mesma descricao, mesmo projeto e mesma regional, variando
    apenas o municipio. Vira UMA atividade, somando os municipios para o
    alcance territorial. Evita contar '8 reunioes' quando foi 1 reuniao
    representando 8 municipios."""
    if df.empty:
        return df
    df = df.copy()
    # Inclui o LOCAL na chave: duas atividades na mesma data, acao e regional,
    # mas em locais diferentes (ex: uma em Sao Francisco e outra em Campos), sao
    # eventos distintos e NAO devem ser agrupados. So agrupa quando e o mesmo
    # evento (mesmo local) registrado em varias linhas de municipio.
    df["_chave"] = (
        df["data_iso"].astype(str) + "|" +
        df["codigo_acao"].map(_norm_chave) + "|" +
        df["atividade"].map(_norm_chave) + "|" +
        df["programa"].map(_norm_chave) + "|" +
        df["regional"].map(_norm_chave) + "|" +
        df["local"].map(_norm_chave)
    )
    # Publicacoes (28.2) na mesma data e regional, mas em redes diferentes,
    # sao publicacoes distintas e NAO devem ser agrupadas. Cada uma recebe uma
    # chave unica para passar direto pela deduplicacao intermunicipal.
    e28 = df["codigo_acao"] == "28.2"
    if e28.any():
        df.loc[e28, "_chave"] = [f"pub-{i}" for i in range(int(e28.sum()))]
    linhas = []
    for _, grupo in df.groupby("_chave", sort=False):
        base = grupo.iloc[0].to_dict()
        if len(grupo) > 1:
            munis = []
            for lst in grupo["municipios_canon"]:
                for m in lst:
                    if m not in munis:
                        munis.append(m)
            base["municipios_canon"] = munis
            base["municipio"] = "; ".join(munis) if munis else base["municipio"]
            base["_agregou"] = len(grupo)
        else:
            base["_agregou"] = 1
        linhas.append(base)
    out = pd.DataFrame(linhas)
    removidas = len(df) - len(out)
    if removidas:
        print(f"Atividades intermunicipais agrupadas: {removidas} linhas colapsadas")
    return out


# ------------------------------------------------------------------ metas

def _num_meta(v):
    if v is None:
        return None
    if isinstance(v, (int, float)) and not pd.isna(v):
        return float(v)
    m = re.search(r"\d+(?:[.,]\d+)?", str(v))
    return float(m.group().replace(",", ".")) if m else None


def carrega_metas(caminho):
    """Le a aba 'Metas Totais'. Colunas:
      C Meta: Atividades Realizadas | D Meta: Produto |
      E Produto Executado | F Meta Geral Por Projeto

    Atividade e medida pela contagem do PINAR (alvo = coluna C).
    Produto e medido pela propria planilha: Produto Executado / Meta Produto
    (colunas E / D). Acoes com os dois sao hibridas: a barra segue as
    atividades e o produto entra como selo. "Executado" (texto) = 100%.
    """
    wb = load_workbook(caminho, read_only=True, data_only=True)
    ws = wb["Metas Totais"]
    rows = list(ws.iter_rows(values_only=True))
    acc = {}
    totais = {}
    for r in rows[1:]:
        proj = limpa_texto(r[0]) if len(r) > 0 else ""
        desc = limpa_texto(r[1]) if len(r) > 1 else ""
        if not desc:
            continue
        cod = extrai_codigo_acao(desc)
        ma = r[2] if len(r) > 2 else None   # Meta Atividades (C)
        mp = r[3] if len(r) > 3 else None   # Meta Produto (D)
        pe = r[4] if len(r) > 4 else None   # Produto Executado (E)
        geral = r[5] if len(r) > 5 else None  # Meta Geral Por Projeto (F)
        if isinstance(geral, (int, float)) and geral and geral > 5 and proj:
            totais[proj] = float(geral)
        if cod == "s/codigo":
            continue
        na = _num_meta(ma)
        npd = _num_meta(mp)
        npe = _num_meta(pe)
        ma_txt = limpa_texto(ma).lower()
        mp_txt = limpa_texto(mp).lower()
        pe_txt = limpa_texto(pe).lower()
        rec = acc.setdefault(cod, {
            "projeto": proj, "rotulo": desc,
            "meta_ativ": 0.0, "meta_prod": 0.0, "prod_exec": 0.0,
            "num_ativ": False, "num_prod": False,
            "exec_ativ": False, "exec_prod": False,
        })
        if na and na > 0:
            rec["meta_ativ"] += na
            rec["num_ativ"] = True
        if npd and npd > 0:
            rec["meta_prod"] += npd
            rec["num_prod"] = True
        if npe and npe > 0:
            rec["prod_exec"] += npe
        # "Executado" (sozinho ou junto do numero, ex "8 - Executado").
        # Na coluna Atividades encerra a acao; na de Produto/Executado conta o produto.
        if "executado" in ma_txt:
            rec["exec_ativ"] = True
        if "executado" in mp_txt or "executado" in pe_txt:
            rec["exec_prod"] = True

    # Datas previstas (aba Mun-Reg-Ger, coluna DatesGoals): meses previstos de
    # cada acao em todos os anos do programa, no formato "AAAA-MM", para o
    # cronograma multi-ano
    previsto_por_cod = {}
    if "Metas_dos_Mun-Reg-Ger." in wb.sheetnames:
        ws2 = wb["Metas_dos_Mun-Reg-Ger."]
        for r in ws2.iter_rows(min_row=2, values_only=True):
            if not r or not r[0]:
                continue
            cod = extrai_codigo_acao(limpa_texto(r[0]))
            if cod == "s/codigo":
                continue
            datas = r[6] if len(r) > 6 else None
            meses = previsto_por_cod.setdefault(cod, set())
            if datas is None:
                continue
            if hasattr(datas, "year"):  # celula com uma data (datetime)
                meses.add(f"{datas.year:04d}-{datas.month:02d}")
            else:  # texto com varias datas dd/mm/aaaa separadas por ; ou quebra
                for m in re.finditer(r"(\d{1,2})/(\d{1,2})/(\d{4})", str(datas)):
                    meses.add(f"{m.group(3)}-{int(m.group(2)):02d}")
    wb.close()

    acoes = {}
    for cod, rec in acc.items():
        tem_ativ = rec["num_ativ"]
        tem_prod = rec["num_prod"] or rec["exec_prod"]
        # Produto sem numero mas marcado "Executado" vale como 1 de 1
        meta_prod = rec["meta_prod"] if rec["num_prod"] else (1.0 if rec["exec_prod"] else 0.0)
        prod_exec = rec["prod_exec"] if rec["num_prod"] else (1.0 if rec["exec_prod"] else 0.0)
        if rec["exec_prod"] and not rec["num_prod"]:
            prod_exec = meta_prod  # "Executado" textual => produto completo

        item = {"projeto": rec["projeto"], "rotulo": rec["rotulo"], "concluido": False}
        if tem_ativ and tem_prod:
            # Hibrida: barra pelas atividades; produto entra como selo
            item["tipo"] = "hibrida"
            item["alvo"] = rec["meta_ativ"]
            item["meta_produto"] = meta_prod
            item["produto_executado"] = prod_exec
            item["produto_entregue"] = meta_prod > 0 and prod_exec >= meta_prod
            item["concluido"] = rec["exec_ativ"]
        elif tem_prod:
            # Produto puro: medido por Produto Executado / Meta Produto
            item["tipo"] = "produto"
            item["alvo"] = meta_prod
            item["meta_produto"] = meta_prod
            item["produto_executado"] = prod_exec
            item["produto_entregue"] = False
            item["concluido"] = rec["exec_ativ"] or (meta_prod > 0 and prod_exec >= meta_prod)
        elif tem_ativ:
            # Atividade pura: medida pela contagem do PINAR
            item["tipo"] = "atividade"
            item["alvo"] = rec["meta_ativ"]
            item["concluido"] = rec["exec_ativ"]
        else:
            item["tipo"] = "sem_meta"
            item["alvo"] = 1.0 if (rec["exec_ativ"] or rec["exec_prod"]) else 0.0
            item["concluido"] = rec["exec_ativ"] or rec["exec_prod"]
        item["cronograma_previsto"] = sorted(previsto_por_cod.get(cod, set()))
        acoes[cod] = item
    return {"acoes": acoes, "totais_projeto": totais}


# ------------------------------------------------------------------ agregacoes

def kpis(df):
    total_part = int(df["participantes"].sum())
    total_ativ = int(len(df))
    munis = set()
    for lst in df["municipios_canon"]:
        munis.update(lst)
    internos = int(df["part_internos"].sum())
    externos = int(df["part_externos"].sum())
    return {
        "total_atividades": total_ativ,
        "total_participantes": total_part,
        "internos": internos,
        "externos": externos,
        "media_participantes": round(total_part / total_ativ, 2) if total_ativ else 0,
        "municipios_atendidos": len(munis),
        "regionais": len([r for r in df["regional"].unique() if r]),
    }


def registro(row):
    return {
        "codigo_acao": row["codigo_acao"],
        "atividade": row["atividade"],
        "programa": row["programa"],
        "data": row["data_br"],
        "data_iso": row["data_iso"],
        "mes_ref": row["mes_ref"] if pd.notna(row["mes_ref"]) else "",
        "regional": row["regional"],
        "estado": row["estado"],
        "municipio": row["municipio"],
        "municipios": row["municipios_canon"],
        "abrangencia": row["abrangencia"],
        "local": row["local"],
        "objetivo": row["objetivo"],
        "metodologia": row["metodologia"],
        "perfil": row["perfil"],
        "participantes": int(row["participantes"]),
        "part_internos": int(row["part_internos"]),
        "part_externos": int(row["part_externos"]),
        "resultados": row["resultados"],
        "produtos": row["produtos"],
        "link_relatorio": row.get("link_relatorio", ""),
        "nivel_atuacao": row.get("nivel_atuacao", ""),
        "titulo_peca": row.get("titulo_peca", ""),
        "plataforma": row.get("plataforma", ""),
        "interacoes": int(row.get("interacoes", 0) or 0),
        "visualizacoes": int(row.get("visualizacoes", 0) or 0),
        "origem": row.get("origem", "atividade"),
    }


def serie_mensal(df):
    sub = df[df["mes_ref"].notna() & (df["mes_ref"] != "")]
    s = sub.groupby("mes_ref").size().sort_index()
    return [{"mes": m, "atividades": int(q)} for m, q in s.items()]


def relatorio_qualidade(df):
    a_revisar = {}
    for _, r in df[df["abrangencia"] == "revisar"].iterrows():
        chave = limpa_texto(r["data_realizada"]) + " | " + str(r["atividade"])[:40]
        a_revisar[chave] = r["municipio"] or "(vazio)"
    return {"municipios_a_revisar": [{"referencia": k, "valor": v} for k, v in a_revisar.items()]}


def engajamento_pcs(df):
    sub = df[(df["programa"] == "PCS") & (df["origem"] == "redes")]
    return {
        "posts": int(len(sub)),
        "interacoes": int(sub["interacoes"].sum()),
        "visualizacoes": int(sub["visualizacoes"].sum()),
    }


def monta_saida(df, metas, comunicacao):
    comunicacao = dict(comunicacao or {})
    comunicacao["engajamento"] = engajamento_pcs(df)
    # As publicacoes 28.2 sao contadas pela planilha de atividades (ja vem
    # consolidadas, uma por publicacao). As 28.2 vindas da planilha de redes
    # servem so ao engajamento (interacoes/visualizacoes, calculado acima) e
    # duplicariam a contagem de atividades, por isso saem daqui em diante.
    df = df[~((df["codigo_acao"] == "28.2") & (df["origem"] == "redes"))].copy()
    tem_data = df["data"].notna().any()
    saida = {
        "gerado_em": datetime.now().isoformat(timespec="seconds"),
        "periodo": {
            "inicio": df["data"].min().strftime("%d/%m/%Y") if tem_data else "",
            "fim": df["data"].max().strftime("%d/%m/%Y") if tem_data else "",
        },
        "global": {**kpis(df), "serie_temporal": serie_mensal(df)},
        "programas": {},
        "metas": metas,
        "comunicacao": comunicacao,
        "qualidade": relatorio_qualidade(df),
    }
    for prog in PROGRAMAS:
        sub = df[df["programa"] == prog]
        saida["programas"][prog] = {
            "sigla": prog,
            "tem_dados": bool(len(sub)),
            "indicadores": kpis(sub),
            "serie_temporal": serie_mensal(sub),
            "atividades": [registro(r) for _, r in sub.iterrows()],
        }
    return saida


# ------------------------------------------------------------------ equipe

def carrega_equipe(caminho):
    """Le os agregados da equipe (aba Planilha1): sexo, formacao e grande area
    de conhecimento. Usa SO os dados agregados, nunca dados individuais."""
    if not os.path.exists(caminho):
        return None
    wb = load_workbook(caminho, read_only=True, data_only=True)
    ws = wb["Planilha1"] if "Planilha1" in wb.sheetnames else wb[wb.sheetnames[0]]
    rows = list(ws.iter_rows(values_only=True))
    wb.close()

    def coleta(col_rot, col_qtd):
        out = []
        for r in rows[1:]:
            rot = limpa_texto(r[col_rot]) if len(r) > col_rot else ""
            q = r[col_qtd] if len(r) > col_qtd else None
            if rot and rot.upper() != "TOTAL" and isinstance(q, (int, float)):
                out.append({"rotulo": rot, "quantidade": int(q)})
        return out

    sexo = coleta(1, 2)       # Sexo | Quantidade
    formacao = coleta(5, 6)   # Formacao | Quantidade
    area = coleta(9, 10)      # Grande area | Quantidade
    total = sum(x["quantidade"] for x in sexo) or sum(x["quantidade"] for x in formacao)
    if not (sexo or formacao or area):
        return None
    return {"total": int(total), "sexo": sexo, "formacao": formacao, "area": area}


# ------------------------------------------------------------------ main

def main():
    entrada = sys.argv[1] if len(sys.argv) > 1 else "dados/entrada"
    saida_path = sys.argv[2] if len(sys.argv) > 2 else "public/dados.json"
    metas_path = sys.argv[3] if len(sys.argv) > 3 else "dados/metas.xlsx"

    df = transforma(carrega_todos(entrada))
    df = filtra_periodo(df)
    # A planilha de atividades do PCS ja vem consolidada (uma linha por
    # publicacao real), entao todas as 28.2 sao contadas. A remocao automatica
    # foi desativada porque descartava publicacoes distintas como se fossem
    # duplicadas. Para reativar uma deduplicacao, fazer por link/identificador.
    df = deduplica_intermunicipal(df)

    metas = {"acoes": {}, "totais_projeto": {}}
    if os.path.exists(metas_path):
        print(f"Lendo metas: {os.path.basename(metas_path)}")
        metas = carrega_metas(metas_path)
    else:
        print(f"AVISO: planilha de metas nao encontrada em {metas_path}")

    com_dir = os.path.join(os.path.dirname(entrada) or ".", "comunicacao") \
        if os.path.isdir(entrada) else "dados/comunicacao"
    comunicacao = carrega_comunicacao(entrada, com_dir)
    print(f"Comunicacao: {comunicacao['total_materias']} materias | "
          f"{len(comunicacao['seguidores'])} redes | whatsapp {comunicacao['whatsapp']['total']} membros")

    saida = monta_saida(df, metas, comunicacao)

    # Equipe (agregados de contratacao): alimenta a acao 1.1
    func_path = os.path.join(os.path.dirname(metas_path) or ".", "funcionarios.xlsx")
    equipe = carrega_equipe(func_path)
    if equipe:
        saida["equipe"] = equipe
        print(f"Equipe: {equipe['total']} contratados (sexo/formacao/area agregados)")

    os.makedirs(os.path.dirname(saida_path) or ".", exist_ok=True)
    with open(saida_path, "w", encoding="utf-8") as f:
        json.dump(saida, f, ensure_ascii=False, indent=2)

    g = saida["global"]
    print(f"\nOK -> {saida_path}")
    print(f"Periodo: {saida['periodo']['inicio']} a {saida['periodo']['fim']}")
    print(f"Atividades: {g['total_atividades']} | Participantes: {g['total_participantes']} "
          f"| Municipios: {g['municipios_atendidos']}")
    print(f"Acoes com meta: {len(metas['acoes'])} | Totais por projeto: {metas['totais_projeto']}")
    print(f"Municipios a revisar: {len(saida['qualidade']['municipios_a_revisar'])}")


if __name__ == "__main__":
    main()