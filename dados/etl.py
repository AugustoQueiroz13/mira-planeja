"""
ETL do painel de atividades do Planeja+ (MIRA).
Lê a planilha, normaliza os campos, canonicaliza os municípios pela lista
oficial e grava um dados.json pronto para o front-end.

Uso (a partir da raiz do projeto):
    python dados/etl.py "dados/entrada/planilha.xlsx" "public/dados.json"
"""

import sys
import re
import json
import unicodedata
from datetime import datetime

import pandas as pd
from canonicaliza import canonicaliza

PROGRAMAS = ["PEA", "PAG", "PGP", "PCS"]


def limpa_texto(v):
    if pd.isna(v):
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
    datas = re.findall(r"(\d{1,2})[/\.](\d{1,2})[/\.](\d{2,4})", txt)
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
    """Devolve (lista_canonica_de_abrangencia, texto_para_exibir, status)."""
    res = canonicaliza(valor)
    in_scope = list(dict.fromkeys(r["municipio"] for r in res if r["status"] == "ok"))
    if in_scope:
        return in_scope, "; ".join(in_scope), "ok"
    if all(r["status"] == "institucional" for r in res):
        return [], "", "institucional"
    return [], limpa_texto(valor), "revisar"


def carrega(caminho):
    bruto = pd.read_excel(caminho, header=1)
    bruto.columns = [limpa_texto(c) for c in bruto.columns]
    mapa = {
        "Atividade": "atividade",
        "Data prevista": "data_prevista",
        "Data realizada": "data_realizada",
        "Projeto (PEA, PAG, PGP, PCS)": "programa",
        "Regional": "regional",
        "Estado": "estado",
        "Município do Programa": "municipio",
        "Local": "local",
        "Objetivo da atividade": "objetivo",
        "Metodologia utilizada": "metodologia",
        "Perfil dos profissionais que conduziram o evento": "perfil",
        "Número de participantes Internos": "part_internos",
        "Número de participantes Externos": "part_externos",
        "Resultados Alcançados": "resultados",
        "Produtos/Encaminhamentos/Status": "produtos",
    }
    bruto = bruto.rename(columns=mapa)
    df = bruto[bruto["atividade"].notna()].copy()
    df = df[df["atividade"].astype(str).str.strip() != "Atividade"]
    return df


def transforma(df):
    df["programa"] = df["programa"].map(normaliza_programa)
    df["codigo_acao"] = df["atividade"].map(extrai_codigo_acao)
    df["atividade"] = df["atividade"].map(limpa_texto)
    df["regional"] = df["regional"].map(limpa_texto)
    df["estado"] = df["estado"].map(lambda v: limpa_texto(v).upper())
    for c in ["objetivo", "resultados", "local", "metodologia", "perfil", "produtos"]:
        df[c] = df[c].map(limpa_texto)

    trip = df["municipio"].map(municipios_da_celula)
    df["municipios_canon"] = trip.map(lambda t: t[0])
    df["municipio"] = trip.map(lambda t: t[1])
    df["abrangencia"] = trip.map(lambda t: t[2])

    df["data"] = df["data_realizada"].map(parse_data)
    df["mes_ref"] = df["data"].dt.strftime("%Y-%m")
    df["data_iso"] = df["data"].dt.strftime("%Y-%m-%d").fillna("")
    df["data_br"] = df["data"].dt.strftime("%d/%m/%Y").fillna("")

    df["part_internos"] = df["part_internos"].map(para_int)
    df["part_externos"] = df["part_externos"].map(para_int)
    df["participantes"] = df["part_internos"] + df["part_externos"]
    return df


def kpis(df):
    total_part = int(df["participantes"].sum())
    total_ativ = int(len(df))
    munis = set()
    for lst in df["municipios_canon"]:
        munis.update(lst)
    return {
        "total_atividades": total_ativ,
        "total_participantes": total_part,
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
    }


def serie_mensal(df):
    s = df[df["mes_ref"].notna()].groupby("mes_ref").size().sort_index()
    return [{"mes": m, "atividades": int(q)} for m, q in s.items()]


def relatorio_qualidade(df):
    a_revisar = {}
    for _, r in df[df["abrangencia"] == "revisar"].iterrows():
        chave = limpa_texto(r["data_realizada"]) + " | " + r["atividade"][:40]
        a_revisar[chave] = r["municipio"] or "(vazio)"
    return {"municipios_a_revisar": [{"referencia": k, "valor": v} for k, v in a_revisar.items()]}


def monta_saida(df):
    saida = {
        "gerado_em": datetime.now().isoformat(timespec="seconds"),
        "periodo": {
            "inicio": df["data"].min().strftime("%d/%m/%Y") if df["data"].notna().any() else "",
            "fim": df["data"].max().strftime("%d/%m/%Y") if df["data"].notna().any() else "",
        },
        "global": {**kpis(df), "serie_temporal": serie_mensal(df)},
        "programas": {},
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


def main():
    entrada = sys.argv[1] if len(sys.argv) > 1 else "planilha.xlsx"
    saida_path = sys.argv[2] if len(sys.argv) > 2 else "dados.json"

    df = transforma(carrega(entrada))
    saida = monta_saida(df)

    with open(saida_path, "w", encoding="utf-8") as f:
        json.dump(saida, f, ensure_ascii=False, indent=2)

    g = saida["global"]
    print(f"OK -> {saida_path}")
    print(f"Periodo: {saida['periodo']['inicio']} a {saida['periodo']['fim']}")
    print(f"Atividades: {g['total_atividades']} | Participantes: {g['total_participantes']} "
          f"| Media: {g['media_participantes']} | Municipios: {g['municipios_atendidos']}")
    n_rev = len(saida["qualidade"]["municipios_a_revisar"])
    print(f"Municipios a revisar: {n_rev}")


if __name__ == "__main__":
    main()