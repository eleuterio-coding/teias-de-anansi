#!/usr/bin/env python3
"""Regressão das contagens dos cards com as fontes reais do repositório."""
from __future__ import annotations
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from gerar_biblioteca_contagens import count_records
from gerar_referencias_hub import ROUTES

entities = [
    {"modulo": name, "id": f"test-{i}", "status": "publicado"}
    for i, name in enumerate(ROUTES) if name != "Talentos"
]
entities.append({"modulo": "Regras", "id": "pendente", "status": "pendente"})
index = {"schema": "hub-rpg.referencias.v3", "entidades": entities}
spells = json.loads((ROOT / "dados/magias-catalogo.json").read_text(encoding="utf-8"))
counts = count_records(index, spells)

expected = {
    "Classes": 13,
    "Subclasses": 119,
    "Talentos": 172,
    "Maestrias de Arma": 15,
    "Equipamentos de Aventura": 185,
    "Magias": 537,
}
for module, total in expected.items():
    assert counts[module] == total, f"{module}: {counts[module]} != {total}"
assert counts["Regras"] == 1, "Referências pendentes não devem incrementar contagens."
assert set(counts) == set(ROUTES) and all(n > 0 for n in counts.values())
print("Contagens reais: " + ", ".join(f"{k}={v}" for k, v in expected.items()) + "; 18 módulos — OK")
