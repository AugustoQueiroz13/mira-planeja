"""
Canonicaliza o nome do município conforme a lista oficial do Planeja+.
Devolve uma lista de resultados, cada um com um status:
  ok, institucional, fora_abrangencia, revisar
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
    sem_acento = "".join(c for c in forma if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", sem_acento).strip()


_INDICE = {}
for _reg, _dados in _CFG["regioes"].items():
    for _m in _dados["municipios"]:
        _INDICE[_norm(_m)] = (_m, _dados["uf"], _reg)
for _variante, _oficial in _CFG["depara"].items():
    _INDICE[_norm(_variante)] = _INDICE[_norm(_oficial)]

_MARCADORES = set(_CFG["marcadores_institucionais"])
_FORA = {_norm(x) for x in _CFG["fora_de_abrangencia"]}
_PREFIXO_REGIONAL = re.compile(r"^\s*(regional\s+)?[ivx]+\s*[-\u2013]\s*", re.IGNORECASE)


def _resolve_parte(parte):
    bruto = parte.strip()
    n = _norm(bruto)
    if not n:
        return None
    if n in _MARCADORES:
        return {"entrada": bruto, "municipio": None, "uf": None, "regiao": None, "status": "institucional"}
    if n in _FORA:
        return {"entrada": bruto, "municipio": bruto, "uf": None, "regiao": None, "status": "fora_abrangencia"}
    if n in _INDICE:
        m, uf, reg = _INDICE[n]
        return {"entrada": bruto, "municipio": m, "uf": uf, "regiao": reg, "status": "ok"}
    sem_prefixo = _norm(_PREFIXO_REGIONAL.sub("", bruto))
    if sem_prefixo in _INDICE:
        m, uf, reg = _INDICE[sem_prefixo]
        return {"entrada": bruto, "municipio": m, "uf": uf, "regiao": reg, "status": "ok"}
    return {"entrada": bruto, "municipio": None, "uf": None, "regiao": None, "status": "revisar"}


def canonicaliza(valor):
    if valor is None or str(valor).strip() == "":
        return [{"entrada": "", "municipio": None, "uf": None, "regiao": None, "status": "institucional"}]
    partes = re.split(r";|,| e | E |\band\b", str(valor))
    resultados = []
    vistos = set()
    for p in partes:
        r = _resolve_parte(p)
        if r and (r["municipio"], r["status"], r["entrada"]) not in vistos:
            vistos.add((r["municipio"], r["status"], r["entrada"]))
            resultados.append(r)
    return resultados or [{"entrada": str(valor), "municipio": None, "uf": None, "regiao": None, "status": "revisar"}]