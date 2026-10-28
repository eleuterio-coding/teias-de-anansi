#!/usr/bin/env python3
"""Gera o resumo leve de contagens da Biblioteca a partir do índice semântico validado.

Conta registros publicados (e não stubs pendentes), evitando que os cards
precisem baixar o índice de referências completo. Magias usa a contagem
canônica do catálogo unificado exibido no próprio módulo.
"""
from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

from gerar_referencias_hub import ROUTES

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "dados/referencias-hub-index.json"
SPELLS = ROOT / "dados/magias-catalogo.json"
OUTPUT = ROOT / "dados/biblioteca-contagens.json"


def count_records(index: dict, spells: dict) -> dict[str, int]:
    if index.get("schema") != "hub-rpg.referencias.v3":
        raise ValueError("Índice semântico inesperado; não gerar contagens provisórias.")

    ids: dict[str, set[str]] = defaultdict(set)
    for entry in index.get("entidades", []):
        module, rid = entry.get("modulo"), entry.get("id")
        if module in ROUTES and rid and entry.get("status") == "publicado":
            ids[module].add(str(rid))

    counts = {module: len(ids[module]) for module in ROUTES}

    # Talentos são catalogados como listas tabulares ([nome, categoria, ...]).
    # O índice semântico não transforma essas linhas em entidades publicadas,
    # por isso a contagem precisa vir dos arquivos ativos do próprio módulo.
    talent_names: set[str] = set()
    talent_sources = sorted((ROOT / "dados").glob("talentos-*.json"))
    if not talent_sources:
        raise ValueError("Fontes do módulo Talentos ausentes.")
    for path in talent_sources:
        data = json.loads(path.read_text(encoding="utf-8"))
        rows = data.get("itens", [])
        if not isinstance(rows, list):
            raise ValueError(f"Arquivo de Talentos inválido: {path.name}")
        for row in rows:
            name = row[0] if isinstance(row, list) and row else row.get("nome_original", row.get("nome", "")) if isinstance(row, dict) else ""
            if isinstance(name, str) and name.strip():
                talent_names.add(name.strip().casefold())
    counts["Talentos"] = len(talent_names)

    if any(n < 1 for n in counts.values()):
        empty = [module for module, n in counts.items() if n < 1]
        raise ValueError(f"Módulos sem registros publicados: {empty}")

    spells_list = spells.get("itens")
    if not isinstance(spells_list, list) or not spells_list:
        raise ValueError("Catálogo unificado de Magias vazio.")
    valid_ids = {row.get("id") for row in spells_list if isinstance(row, dict) and row.get("id")}
    if len(valid_ids) != len(spells_list):
        raise ValueError("Catálogo unificado de Magias possui IDs ausentes/duplicados.")
    counts["Magias"] = len(valid_ids)
    return counts


def main() -> None:
    index = json.loads(INDEX.read_text(encoding="utf-8"))
    spells = json.loads(SPELLS.read_text(encoding="utf-8"))
    counts = count_records(index, spells)
    payload = {
        "schema": "hub-rpg.biblioteca-contagens.v1",
        "origem": "dados/referencias-hub-index.json",
        "criterio": "Registros publicados, deduplicados por ID dentro de cada módulo; Magias usa o catálogo canônico unificado.",
        "modulos": counts,
        "total": sum(counts.values()),
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Contagens da Biblioteca geradas: " + ", ".join(f"{k}: {v}" for k, v in counts.items()))


if __name__ == "__main__":
    main()
