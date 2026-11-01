#!/usr/bin/env python3
"""Gera o resumo leve de contagens da Biblioteca a partir do índice semântico validado.

Conta registros publicados (e não stubs pendentes), evitando que os cards
precisem baixar o índice de referências completo. Módulos com fontes tabulares
ou agregações específicas contam os próprios registros navegáveis.
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

    # Estes catálogos apresentam listas próprias. O índice semântico também
    # relaciona características internas, efeitos e referências, que não devem
    # inflar o número de cards/registros navegáveis nestes quatro módulos.
    classes_dir = ROOT / "dados/classes-ptbr"
    class_files = sorted(classes_dir.glob("*.json"))
    artificer = json.loads((ROOT / "dados/artificer-2025.json").read_text(encoding="utf-8"))
    if not class_files or not artificer.get("classe", {}).get("nome"):
        raise ValueError("Fontes de Classes incompletas.")
    counts["Classes"] = len(class_files) + 1  # 12 classes-base + Artífice

    subclasses = json.loads((ROOT / "dados/subclasses-pdfs.json").read_text(encoding="utf-8"))
    subclass_rows = subclasses.get("subclasses", [])
    if not isinstance(subclass_rows, list) or not subclass_rows:
        raise ValueError("Catálogo de Subclasses vazio.")
    counts["Subclasses"] = len(subclass_rows)

    masteries = json.loads((ROOT / "dados/maestrias-de-arma-pdfs.json").read_text(encoding="utf-8"))
    mastery_rows = masteries.get("itens", [])
    if not isinstance(mastery_rows, list) or not mastery_rows:
        raise ValueError("Catálogo de Maestrias vazio.")
    counts["Maestrias de Arma"] = len(mastery_rows)

    core_gear = json.loads((ROOT / "dados/equipamentos-aventura-core-pdfs.json").read_text(encoding="utf-8"))
    counts["Equipamentos de Aventura"] = (
        len(core_gear["phb"]["itens"])
        + len(core_gear["heroes"]["itens"])
    )

    # A lista de armas é publicada pelo cache canônico, não pelas referências
    # semânticas (que incluem aliases e outros registros não navegáveis).
    weapons = json.loads((ROOT / "cache/armas-catalogo.json").read_text(encoding="utf-8"))
    weapon_rows = weapons.get("itens", [])
    if len(weapon_rows) != weapons.get("controle", {}).get("quantidade"):
        raise ValueError("Contagem de armas diverge do catálogo publicado.")
    if any(str(row.get("status", "")).lower() == "demonstrativo"
           or "não canonizar" in str(row.get("descricao", "")).lower()
           for row in weapon_rows):
        raise ValueError("Arma marcada como Não Canonizar permanece no catálogo.")
    counts["Armas"] = len(weapon_rows)

    if any(n < 1 for n in counts.values()):
        empty = [module for module, n in counts.items() if n < 1]
        raise ValueError(f"Módulos sem registros publicados: {empty}")

    spells_list = spells.get("itens")
    if not isinstance(spells_list, list) or not spells_list:
        raise ValueError("Catálogo unificado de Magias vazio.")
    valid_ids = {row.get("id") for row in spells_list if isinstance(row, dict) and row.get("id")}
    if len(valid_ids) != len(spells_list):
        raise ValueError("Catálogo unificado de Magias possui IDs ausentes/duplicados.")
    # O catálogo suplementar é combinado com o índice do Livro do Jogador
    # no navegador; versões recuperadas de Xanathar/Tasha não são duplicadas.
    from unicodedata import normalize as unicode_normalize, combining
    def normalized(name: str) -> str:
        return "".join(c for c in unicode_normalize("NFD", str(name or "")) if not combining(c)).lower()
    imported = {normalized(row.get("nome_original")) for row in spells_list
                if row.get("fonte") in ("xanathar-2017", "tasha-2020")}
    phb = json.loads((ROOT / "dados/magias-phb-2024-indice.json").read_text(encoding="utf-8"))
    remaining_phb = [row for row in phb.get("itens", [])
                     if normalized(row.get("nome_original")) not in imported]
    counts["Magias"] = len(valid_ids) + len(remaining_phb)
    return counts


def main() -> None:
    index = json.loads(INDEX.read_text(encoding="utf-8"))
    spells = json.loads(SPELLS.read_text(encoding="utf-8"))
    counts = count_records(index, spells)
    payload = {
        "schema": "hub-rpg.biblioteca-contagens.v1",
        "origem": "dados/referencias-hub-index.json",
        "criterio": "Registros publicados indexados; Classes, Subclasses, Talentos, Maestrias, Equipamentos e Magias usam as fontes navegáveis canônicas.",
        "modulos": counts,
        "total": sum(counts.values()),
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Contagens da Biblioteca geradas: " + ", ".join(f"{k}: {v}" for k, v in counts.items()))


if __name__ == "__main__":
    main()
