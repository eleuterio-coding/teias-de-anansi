#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import unicodedata
import uuid
from collections import defaultdict
from pathlib import Path

MODULE_ROUTES = {
    "Regras": "regras.html",
    "Classes": "classes.html",
    "Subclasses": "subclasses.html",
    "Espécies": "especies.html",
    "Antecedentes": "antecedentes.html",
    "Talentos": "talentos.html",
    "Maestrias de Arma": "maestrias-de-arma.html",
    "Monstros": "monstros.html",
    "Armaduras": "armaduras.html",
    "Armas": "armas.html",
    "Equipamentos de Aventura": "equipamentos-aventura.html",
    "Ferramentas": "ferramentas.html",
    "Montarias e Veículos": "montarias-veiculos.html",
    "Comércio e Despesas": "comercio-e-despesas.html",
    "Bugigangas": "bugigangas.html",
    "Itens Mágicos": "itens-magicos.html",
    "Magias": "magias.html",
    "Idiomas": "idiomas.html",
}

PREFIX_MODULE = [
    ("regras", "Regras"),
    ("classe", "Classes"),
    ("subclasse", "Subclasses"),
    ("espec", "Espécies"),
    ("anteced", "Antecedentes"),
    ("talento", "Talentos"),
    ("maestr", "Maestrias de Arma"),
    ("monstro", "Monstros"),
    ("armadura", "Armaduras"),
    ("armas", "Armas"),
    ("equipamento", "Equipamentos de Aventura"),
    ("ferramenta", "Ferramentas"),
    ("montaria", "Montarias e Veículos"),
    ("veiculo", "Montarias e Veículos"),
    ("veículo", "Montarias e Veículos"),
    ("comercio", "Comércio e Despesas"),
    ("despesa", "Comércio e Despesas"),
    ("bugiganga", "Bugigangas"),
    ("itens-magicos", "Itens Mágicos"),
    ("item-magico", "Itens Mágicos"),
    ("magia", "Magias"),
    ("idioma", "Idiomas"),
]

NAME_KEYS = ("nome", "name", "titulo", "title")
ORIGINAL_KEYS = ("original", "nome_original", "original_name")

TEXT_KEYS = {
    "descricao", "description", "texto", "texto_integral", "texto_relevante",
    "resumo", "notas", "notes", "efeito", "effects", "lore", "historia",
    "história", "regras", "regra", "detalhes", "prerequisite", "prerequisites",
    "requisitos", "beneficios", "benefícios", "properties", "propriedades",
    "traits", "traços", "observacao", "observação",
}

EXPLICIT_PATTERNS = [
    re.compile(r"Veja\s+tamb[eé]m\s+(?:o\s+cap[ií]tulo\s+\d+\s*)?[“\"']([^”\"']+)[”\"']", re.I),
    re.compile(r"Consulte\s+[“\"']([^”\"']+)[”\"']", re.I),
    re.compile(r"See\s+also\s+[“\"']([^”\"']+)[”\"']", re.I),
]

STRUCTURAL_TARGETS = {
    "classe": "Classes", "classes": "Classes", "class": "Classes", "parent_class": "Classes", "classe_base": "Classes",
    "subclasse": "Subclasses", "subclasses": "Subclasses", "parent_subclass": "Subclasses",
    "especie": "Espécies", "espécie": "Espécies", "especies": "Espécies", "espécies": "Espécies", "species": "Espécies",
    "antecedente": "Antecedentes", "antecedentes": "Antecedentes", "background": "Antecedentes", "backgrounds": "Antecedentes",
    "talento": "Talentos", "talentos": "Talentos", "feat": "Talentos", "feats": "Talentos", "dragonmarks": "Talentos",
    "maestria": "Maestrias de Arma", "maestrias": "Maestrias de Arma", "mastery": "Maestrias de Arma", "masteries": "Maestrias de Arma",
    "monstro": "Monstros", "monstros": "Monstros", "monster": "Monstros", "monsters": "Monstros",
    "armadura": "Armaduras", "armaduras": "Armaduras", "armor": "Armaduras",
    "arma": "Armas", "armas": "Armas", "weapon": "Armas", "weapons": "Armas",
    "equipamento": "Equipamentos de Aventura", "equipamentos": "Equipamentos de Aventura", "gear": "Equipamentos de Aventura",
    "ferramenta": "Ferramentas", "ferramentas": "Ferramentas", "tool": "Ferramentas", "tools": "Ferramentas",
    "montaria": "Montarias e Veículos", "montarias": "Montarias e Veículos", "mount": "Montarias e Veículos", "mounts": "Montarias e Veículos",
    "veiculo": "Montarias e Veículos", "veículo": "Montarias e Veículos", "veiculos": "Montarias e Veículos",
    "veículos": "Montarias e Veículos", "vehicle": "Montarias e Veículos", "vehicles": "Montarias e Veículos",
    "servico": "Comércio e Despesas", "serviço": "Comércio e Despesas", "servicos": "Comércio e Despesas", "serviços": "Comércio e Despesas",
    "bugiganga": "Bugigangas", "bugigangas": "Bugigangas", "trinket": "Bugigangas", "trinkets": "Bugigangas",
    "item_magico": "Itens Mágicos", "item_mágico": "Itens Mágicos", "itens_magicos": "Itens Mágicos",
    "itens_mágicos": "Itens Mágicos", "magic_item": "Itens Mágicos", "magic_items": "Itens Mágicos",
    "magia": "Magias", "magias": "Magias", "spell": "Magias", "spells": "Magias",
    "idioma": "Idiomas", "idiomas": "Idiomas", "language": "Idiomas", "languages": "Idiomas",
    "condicao": "Regras", "condição": "Regras", "condicoes": "Regras", "condições": "Regras",
    "condition": "Regras", "conditions": "Regras",
}

SEED_RULE_TERMS = [
    "Pontos de Vida", "Pontos de Vida Temporários", "Classe de Armadura",
    "Dados de Vida", "Salvaguarda Contra Morte", "Salvaguarda", "Vantagem",
    "Desvantagem", "Ação", "Ação Bônus", "Reação", "Concentração", "Cobertura",
    "Terreno Difícil", "Inspiração Heroica", "Percepção Passiva", "Proficiência",
]


def norm(value):
    text = unicodedata.normalize("NFKD", str(value or ""))
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    return re.sub(r"\s+", " ", text.casefold()).strip()


def infer_module(path, obj=None):
    if isinstance(obj, dict):
        for key in ("modulo", "módulo"):
            if obj.get(key) in MODULE_ROUTES:
                return obj[key]
        family = str(obj.get("familia", ""))
        if family in {"Regra Geral", "Ação", "Área de Efeito", "Atitude", "Condição", "Perigo", "Regra da Casa"}:
            return "Regras"

    path_key = norm(str(path).replace("_", "-"))
    for prefix, module in PREFIX_MODULE:
        if prefix in path_key:
            return module
    return None


def pick(obj, keys):
    if not isinstance(obj, dict):
        return None
    for key in keys:
        value = obj.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def aliases(obj, name):
    values = [name]

    for key in ORIGINAL_KEYS:
        value = obj.get(key)
        if isinstance(value, str) and value.strip():
            values.append(value.strip())

    for key in ("aliases", "apelidos"):
        value = obj.get(key)
        if isinstance(value, list):
            values.extend(x.strip() for x in value if isinstance(x, str) and x.strip())

    qualified = re.fullmatch(r"\s*(.*?)\s*\[[^]]+\]\s*", name or "")
    if qualified:
        values.append(qualified.group(1).strip())

    text = " ".join(str(obj.get(key, "")) for key in TEXT_KEYS if isinstance(obj.get(key), str))
    abbreviation = re.search(r"\b" + re.escape(name) + r"\s*\(([A-ZÁÉÍÓÚÇ]{2,8})\)", text, re.I) if name else None
    if abbreviation:
        values.append(abbreviation.group(1))

    output, seen = [], set()
    for value in values:
        key = norm(value)
        if key and key not in seen:
            seen.add(key)
            output.append(value)
    return output


def source_priority(path):
    key = norm(path)
    if any(token in key for token in ("2025", "2024", "srd-5.2", "dndbeyond-2024")):
        return 30
    if any(token in key for token in ("2022", "2020")):
        return 20
    if "2014" in key:
        return 10
    return 15


def stable_id(module, name, original, path):
    key = f"{module}|{norm(original or name)}|{Path(path).name}"
    return "ref-" + uuid.uuid5(
        uuid.NAMESPACE_URL,
        "https://teias-de-anansi.invalid/" + key,
    ).hex


def iter_named_dicts(obj):
    if isinstance(obj, dict):
        name = pick(obj, NAME_KEYS)
        if name and (
            any(
                key in obj
                for key in (
                    "descricao", "description", "familia", "fonte", "source", "original",
                    "tipo", "type", "subtipo", "raridade", "escola", "nivel", "nível",
                    "custo", "preco", "preço",
                )
            )
            or len(obj) >= 4
        ):
            yield obj

        for value in obj.values():
            yield from iter_named_dicts(value)

    elif isinstance(obj, list):
        for value in obj:
            yield from iter_named_dicts(value)


def extract_texts(obj):
    if isinstance(obj, dict):
        for key, value in obj.items():
            if key in TEXT_KEYS and isinstance(value, str):
                yield value
            else:
                yield from extract_texts(value)
    elif isinstance(obj, list):
        for value in obj:
            yield from extract_texts(value)


def scalar_strings(value):
    if isinstance(value, str):
        text = value.strip()
        if text and len(text) <= 100 and "\n" not in text and len(text.split()) <= 12:
            yield text
    elif isinstance(value, list):
        for item in value:
            if isinstance(item, str):
                text = item.strip()
                if text and len(text) <= 100 and "\n" not in text and len(text.split()) <= 12:
                    yield text


_NORMALIZED_STRUCTURAL_TARGETS = {norm(key): module for key, module in STRUCTURAL_TARGETS.items()}


def extract_structural_refs(obj, path=""):
    if isinstance(obj, dict):
        for key, value in obj.items():
            current = f"{path}.{key}" if path else key
            target_module = _NORMALIZED_STRUCTURAL_TARGETS.get(norm(key))
            if target_module:
                for text in scalar_strings(value):
                    yield text, target_module, current
            yield from extract_structural_refs(value, current)
    elif isinstance(obj, list):
        for index, value in enumerate(obj):
            yield from extract_structural_refs(value, f"{path}[{index}]")


def load_json(path):
    try:
        return json.loads(path.read_text(encoding="utf-8", errors="replace"))
    except Exception:
        return None


def clean_html_text(value):
    value = re.sub(r"<[^>]+>", "", value)
    value = value.replace("&amp;", "&").replace("&quot;", '"').replace("&#39;", "'")
    return re.sub(r"\s+", " ", value).strip()


def html_named_records(root):
    """Indexa entidades/grupos publicados que existem apenas dentro do HTML/JS."""
    records = []

    for module, route in MODULE_ROUTES.items():
        path = root / route
        if not path.exists():
            continue

        html = path.read_text(encoding="utf-8", errors="replace")
        names = set()

        patterns = [
            re.compile(r"\bnome\s*:\s*'([^'\n]{2,100})'", re.I),
            re.compile(r'\bnome\s*:\s*"([^"\n]{2,100})"', re.I),
            re.compile(r"<summary[^>]*>\s*<strong[^>]*>([^<]{2,100})</strong>", re.I),
        ]

        for pattern in patterns:
            for match in pattern.finditer(html):
                name = clean_html_text(match.group(1))
                if not name or len(name) > 100 or len(name.split()) > 14:
                    continue
                key = norm(name)
                if not key or key in names:
                    continue
                if any(token in key for token in ("carregando", "nenhum item", "buscar ")):
                    continue

                names.add(key)
                records.append(
                    (
                        path,
                        {
                            "nome": name,
                            "modulo": module,
                            "descricao": "",
                            "fonte": {
                                "livro": "Catálogo publicado do Hub",
                                "arquivo": route,
                            },
                            "_html_catalog": True,
                        },
                    )
                )

    return records


def load_sources(root):
    documents = []

    for path in (root / "dados").rglob("*.json"):
        data = load_json(path)
        if data is not None:
            documents.append((path, data))

    # A fonte principal de Regras é armazenada em quatro fragmentos textuais.
    # Cada parte isolada não é JSON válido; elas precisam ser remontadas.
    parts = sorted((root / "dados").glob("regras-dndbeyond-2024.part*.txt"))
    if parts:
        text = "".join(path.read_text(encoding="utf-8", errors="replace") for path in parts)
        try:
            data = json.loads(text)
        except Exception as exc:
            raise RuntimeError(f"Falha ao reconstruir regras-dndbeyond-2024: {exc}") from exc

        documents.append((root / "dados" / "regras-dndbeyond-2024.reconstruido.json", data))

    documents.extend(html_named_records(root))
    return documents


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    parser.add_argument("--output", default="dados/referencias-hub-index.json")
    parser.add_argument("--stubs", default="dados/referencias-hub-stubs.json")
    args = parser.parse_args()

    root = Path(args.root)
    records = []
    explicit_refs = []
    structural_refs = []

    for path, data in load_sources(root):
        default_module = infer_module(path)

        for obj in iter_named_dicts(data):
            name = pick(obj, NAME_KEYS)
            module = infer_module(path, obj) or default_module
            if not name or not module:
                continue
            if name.lower().startswith(("auditoria ", "manifesto ", "manifest ", "catálogo ", "catalogo ")):
                continue

            original = pick(obj, ORIGINAL_KEYS)
            object_id = obj.get("id") if isinstance(obj.get("id"), str) and obj.get("id").strip() else None
            record_id = object_id or stable_id(module, name, original, path)

            records.append(
                {
                    "id": record_id,
                    "nome": name,
                    "aliases": aliases(obj, name),
                    "modulo": module,
                    "url": MODULE_ROUTES[module],
                    "fonte_arquivo": str(path.relative_to(root)).replace("\\", "/"),
                    "prioridade": source_priority(str(path)),
                    "status": "publicado",
                }
            )

            for text in extract_texts(obj):
                for pattern in EXPLICIT_PATTERNS:
                    explicit_refs.extend(
                        (match.group(1).strip(), module, str(path.relative_to(root)))
                        for match in pattern.finditer(text)
                    )

        for label, target_module, field_path in extract_structural_refs(data):
            structural_refs.append(
                (label, target_module, str(path.relative_to(root)), field_path)
            )

    # Deduplicação dentro do mesmo módulo respeitando a precedência de fontes.
    best = {}
    for record in records:
        key = (record["modulo"], norm(record["nome"]))
        if key not in best or record["prioridade"] > best[key]["prioridade"]:
            best[key] = record
    records = list(best.values())

    existing_by_module = defaultdict(set)
    for record in records:
        for alias in record["aliases"]:
            existing_by_module[record["modulo"]].add(norm(alias))

    stubs = []

    def add_stub(name, module, reason, source=None, field=None):
        key = norm(name)
        if not key or module not in MODULE_ROUTES:
            return
        if key in existing_by_module[module]:
            return
        if key in {"nenhum", "nenhuma", "qualquer", "varia", "—", "-", "n/a", "na"}:
            return

        record_id = "ref-" + uuid.uuid5(
            uuid.NAMESPACE_URL,
            "https://teias-de-anansi.invalid/stub/" + module + "/" + key,
        ).hex

        stubs.append(
            {
                "id": record_id,
                "nome": name,
                "aliases": [name],
                "modulo": module,
                "url": "referencia.html",
                "status": "pendente",
                "motivo": reason,
                "fonte_referencia": source,
                "campo_referencia": field,
            }
        )
        existing_by_module[module].add(key)

    for name in SEED_RULE_TERMS:
        add_stub(
            name,
            "Regras",
            "conceito mecânico central referenciado pela Biblioteca",
        )

    for name, origin_module, source in explicit_refs:
        candidate_modules = [
            module for module, aliases_set in existing_by_module.items()
            if norm(name) in aliases_set
        ]
        target_module = candidate_modules[0] if len(candidate_modules) == 1 else origin_module
        add_stub(name, target_module, "referência editorial explícita", source)

    for name, target_module, source, field in structural_refs:
        add_stub(
            name,
            target_module,
            "referência estrutural sem entidade publicada",
            source,
            field,
        )

    all_records = records + stubs
    alias_map = defaultdict(list)

    for record in all_records:
        for alias in record["aliases"]:
            alias_map[norm(alias)].append(record)

    aliases_resolvidos = []
    ambiguos = []

    for alias_key, candidates in alias_map.items():
        modules = {candidate["modulo"] for candidate in candidates}

        if len(modules) == 1:
            candidates = sorted(
                candidates,
                key=lambda item: item.get("prioridade", 0),
                reverse=True,
            )
            top = candidates[0]

            if (
                len(candidates) == 1
                or top.get("prioridade", 0) > candidates[1].get("prioridade", 0)
                or len({item["id"] for item in candidates}) == 1
            ):
                aliases_resolvidos.append({"termo": alias_key, "id": top["id"]})
            else:
                ambiguos.append(
                    {"termo": alias_key, "ids": [item["id"] for item in candidates]}
                )
        else:
            ambiguos.append(
                {"termo": alias_key, "ids": [item["id"] for item in candidates]}
            )

    coverage = {
        module: sum(1 for record in all_records if record["modulo"] == module)
        for module in MODULE_ROUTES
    }

    output = {
        "schema": "hub-rpg.referencias.v2",
        "sintaxe": "[[ID|Texto exibido]]",
        "gerado_automaticamente": True,
        "total_entidades": len(all_records),
        "entidades": all_records,
        "aliases_resolvidos": aliases_resolvidos,
        "ambiguos": ambiguos,
        "modulos": MODULE_ROUTES,
        "cobertura_modulos": coverage,
    }

    Path(args.output).write_text(
        json.dumps(output, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    Path(args.stubs).write_text(
        json.dumps(
            {
                "schema": "hub-rpg.stubs-referencias.v2",
                "total": len(stubs),
                "itens": stubs,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    print(
        f"referências: {len(records)} reais, {len(stubs)} stubs, "
        f"{len(ambiguos)} aliases ambíguos"
    )
    print(
        "cobertura:",
        ", ".join(f"{module}={coverage[module]}" for module in MODULE_ROUTES),
    )


if __name__ == "__main__":
    main()
