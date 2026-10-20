"""
Canonicaliza o nome do municipio conforme a lista oficial do Planeja+.
Entende: municipio simples, listas, "Regional X" (regiao inteira),
"TODAS" (todos os municipios) e "Intermunicipal (a, b, c)".
Cada resultado tem um status: ok, institucional, fora_abrangencia, revisar.
"""

import os
import json
import re
import unicodedata

_AQUI = os.path.dirname(os.path.abspath(__file__))
_CAMINHOS = [
    os.path.join(os.getcwd(), "config", "municipios.json"),
    os.path.join(_AQUI, "..", "config", "municipios.json"),
    os.path.join(_AQUI, "config", "municipios.json"),
    os.path.join(_AQUI, "municipios.json"),
]

_CFG = None
for _c in _CAMINHOS:
    if os.path.exists(_c):
        with open(_c, encoding="utf-8") as _f:
            _CFG = json.load(_f)
        break
if _CFG is None:
    raise FileNotFoundError(
        "Nao encontrei config/municipios.json. Rode o ETL a partir da raiz do projeto."
    )


def _norm(txt):
    forma = unicodedata.normalize("NFKD", str(txt or "").lower())
    sem = "".join(c for c in forma if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", sem).strip()


_INDICE = {}
for _reg, _dados in _CFG["regioes"].items():
    for _m in _dados["municipios"]:
        _INDICE[_norm(_m)] = (_m, _dados["uf"], _reg)
for _variante, _oficial in _CFG["depara"].items():
    if _norm(_oficial) in _INDICE:
        _INDICE[_norm(_variante)] = _INDICE[_norm(_oficial)]

_MARCADORES = {_norm(x) for x in _CFG["marcadores_institucionais"]}
_FORA = {_norm(x) for x in _CFG["fora_de_abrangencia"]}
_PREFIXO_REGIONAL = re.compile(r"^\s*(regional\s+)?[ivx]+\s*[-–]?\s*", re.IGNORECASE)
_REGIONAL_NUM = re.compile(r"^\s*(?:regional\s+)?([ivx]+)\b", re.IGNORECASE)
_INTERMUNICIPAL = re.compile(r"intermunicipal\s*\((.*)\)", re.IGNORECASE | re.DOTALL)
_TODAS = {"todas", "todos", "toda", "todos os municipios", "todos os municípios"}


def _ok(m, uf, reg, entrada):
    return {"entrada": entrada, "municipio": m, "uf": uf, "regiao": reg, "status": "ok"}


def _municipios_regiao(roman):
    d = _CFG["regioes"].get(roman.upper())
    if not d:
        return None
    return [(m, d["uf"], roman.upper()) for m in d["municipios"]]


def _todos_municipios():
    out = []
    for reg, d in _CFG["regioes"].items():
        for m in d["municipios"]:
            out.append((m, d["uf"], reg))
    return out


def _expande_parte(parte):
    bruto = parte.strip()
    n = _norm(bruto)
    if not n:
        return []
    m = _REGIONAL_NUM.match(bruto)
    if m and ("regional" in n or n.split()[0] in ("i", "ii", "iii", "iv", "v", "vi", "vii")):
        munis = _municipios_regiao(m.group(1))
        if munis:
            return [_ok(mm, uf, reg, bruto) for (mm, uf, reg) in munis]
    if n in _MARCADORES:
        return [{"entrada": bruto, "municipio": None, "uf": None, "regiao": None, "status": "institucional"}]
    if n in _FORA:
        return [{"entrada": bruto, "municipio": bruto, "uf": None, "regiao": None, "status": "fora_abrangencia"}]
    if n in _INDICE:
        mm, uf, reg = _INDICE[n]
        return [_ok(mm, uf, reg, bruto)]
    sem_prefixo = _norm(_PREFIXO_REGIONAL.sub("", bruto))
    if sem_prefixo in _INDICE:
        mm, uf, reg = _INDICE[sem_prefixo]
        return [_ok(mm, uf, reg, bruto)]
    return [{"entrada": bruto, "municipio": None, "uf": None, "regiao": None, "status": "revisar"}]


def canonicaliza(valor):
    if valor is None or str(valor).strip() == "":
        return [{"entrada": "", "municipio": None, "uf": None, "regiao": None, "status": "institucional"}]
    texto = str(valor).strip()
    if _norm(texto) in _TODAS:
        return [_ok(mm, uf, reg, texto) for (mm, uf, reg) in _todos_municipios()]
    mi = _INTERMUNICIPAL.search(texto)
    if mi:
        texto = mi.group(1)
    partes = re.split(r";|,| e | E |\band\b", texto)
    resultados = []
    vistos = set()
    for p in partes:
        for r in _expande_parte(p):
            chave = (r["municipio"], r["status"])
            if chave not in vistos:
                vistos.add(chave)
                resultados.append(r)
    return resultados or [
        {"entrada": str(valor), "municipio": None, "uf": None, "regiao": None, "status": "revisar"}
    ]