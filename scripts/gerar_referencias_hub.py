#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import unicodedata
import uuid
from collections import defaultdict, Counter
from pathlib import Path

ROUTES = {
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
PREFIX = [
    ("subclasse", "Subclasses"), ("regras", "Regras"), ("classe", "Classes"),
    ("espec", "Espécies"), ("anteced", "Antecedentes"), ("talento", "Talentos"),
    ("maestr", "Maestrias de Arma"), ("monstro", "Monstros"), ("armadura", "Armaduras"),
    ("armas", "Armas"), ("equipamento", "Equipamentos de Aventura"),
    ("ferramenta", "Ferramentas"), ("montaria", "Montarias e Veículos"),
    ("veiculo", "Montarias e Veículos"), ("veículo", "Montarias e Veículos"),
    ("comercio", "Comércio e Despesas"), ("despesa", "Comércio e Despesas"),
    ("bugiganga", "Bugigangas"), ("itens-magicos", "Itens Mágicos"),
    ("item-magico", "Itens Mágicos"), ("magia", "Magias"), ("idioma", "Idiomas"),
]
TEXT = {
    "descricao", "description", "texto", "texto_integral", "texto_relevante", "resumo",
    "notas", "notes", "efeito", "effects", "lore", "historia", "história", "regras",
    "regra", "detalhes", "prerequisite", "prerequisites", "requisitos", "beneficios",
    "benefícios", "properties", "propriedades", "traits", "traços", "observacao",
    "observação",
}
EXPLICIT = [
    re.compile(r"Veja\s+tamb[eé]m\s+(?:o\s+cap[ií]tulo\s+\d+\s*)?[“\"']([^”\"']+)[”\"']", re.I),
    re.compile(r"Consulte\s+[“\"']([^”\"']+)[”\"']", re.I),
    re.compile(r"See\s+also\s+[“\"']([^”\"']+)[”\"']", re.I),
]
STRUCT = {
    "classe": "Classes", "classes": "Classes", "class": "Classes", "parent_class": "Classes", "classe_base": "Classes",
    "subclasse": "Subclasses", "subclasses": "Subclasses", "parent_subclass": "Subclasses",
    "especie": "Espécies", "espécie": "Espécies", "especies": "Espécies", "espécies": "Espécies", "species": "Espécies",
    "antecedente": "Antecedentes", "antecedentes": "Antecedentes", "background": "Antecedentes", "backgrounds": "Antecedentes",
    "talento": "Talentos", "talentos": "Talentos", "feat": "Talentos", "feats": "Talentos", "dragonmarks": "Talentos",
    "maestria": "Maestrias de Arma", "maestrias": "Maestrias de Arma", "mastery": "Maestrias de Arma", "masteries": "Maestrias de Arma",
    "monstro": "Monstros", "monstros": "Monstros", "monster": "Monstros", "monsters": "Monstros", "criatura": "Monstros", "criaturas": "Monstros",
    "armadura": "Armaduras", "armaduras": "Armaduras", "armor": "Armaduras",
    "arma": "Armas", "armas": "Armas", "weapon": "Armas", "weapons": "Armas",
    "equipamento": "Equipamentos de Aventura", "equipamentos": "Equipamentos de Aventura", "gear": "Equipamentos de Aventura", "item_base": "Equipamentos de Aventura",
    "ferramenta": "Ferramentas", "ferramentas": "Ferramentas", "tool": "Ferramentas", "tools": "Ferramentas",
    "montaria": "Montarias e Veículos", "montarias": "Montarias e Veículos", "mount": "Montarias e Veículos", "mounts": "Montarias e Veículos",
    "veiculo": "Montarias e Veículos", "veículo": "Montarias e Veículos", "veiculos": "Montarias e Veículos", "veículos": "Montarias e Veículos",
    "vehicle": "Montarias e Veículos", "vehicles": "Montarias e Veículos",
    "servico": "Comércio e Despesas", "serviço": "Comércio e Despesas", "servicos": "Comércio e Despesas", "serviços": "Comércio e Despesas",
    "bugiganga": "Bugigangas", "bugigangas": "Bugigangas", "trinket": "Bugigangas", "trinkets": "Bugigangas",
    "item_magico": "Itens Mágicos", "item_mágico": "Itens Mágicos", "itens_magicos": "Itens Mágicos", "itens_mágicos": "Itens Mágicos",
    "magic_item": "Itens Mágicos", "magic_items": "Itens Mágicos",
    "magia": "Magias", "magias": "Magias", "spell": "Magias", "spells": "Magias",
    "idioma": "Idiomas", "idiomas": "Idiomas", "language": "Idiomas", "languages": "Idiomas",
    "condicao": "Regras", "condição": "Regras", "condicoes": "Regras", "condições": "Regras",
    "condition": "Regras", "conditions": "Regras",
    "regra": "Regras", "regras": "Regras", "rule": "Regras", "rules": "Regras",
}
SEEDS = [
    "Pontos de Vida", "Pontos de Vida Temporários", "Classe de Armadura", "Dados de Vida",
    "Salvaguarda Contra Morte", "Salvaguarda", "Vantagem", "Desvantagem", "Ação",
    "Ação Bônus", "Reação", "Concentração", "Cobertura", "Terreno Difícil",
    "Inspiração Heroica", "Percepção Passiva", "Proficiência",
]
GENERIC = {"nenhum", "nenhuma", "qualquer", "varia", "-", "n/a", "na", "none", "any", "all", "todos", "todas", "—"}


def norm(v):
    s = unicodedata.normalize("NFKD", str(v or ""))
    return re.sub(r"\s+", " ", "".join(c for c in s if not unicodedata.combining(c)).casefold()).strip()


NSTRUCT = {norm(k): v for k, v in STRUCT.items()}


def module(path, o=None):
    if isinstance(o, dict):
        if o.get("modulo") in ROUTES:
            return o["modulo"]
        if o.get("módulo") in ROUTES:
            return o["módulo"]
        if str(o.get("familia", "")) in {"Regra Geral", "Ação", "Área de Efeito", "Atitude", "Condição", "Perigo", "Regra da Casa"}:
            return "Regras"
    p = norm(path)
    for x, m in PREFIX:
        if x in p:
            return m
    return None


def pick(o, keys):
    for k in keys:
        v = o.get(k) if isinstance(o, dict) else None
        if isinstance(v, str) and v.strip():
            return v.strip()
    return None


def aliases(o, n):
    vals = [n] + [
        o[k].strip()
        for k in ("original", "nome_original", "original_name")
        if isinstance(o.get(k), str) and o[k].strip()
    ]
    for k in ("aliases", "apelidos"):
        if isinstance(o.get(k), list):
            vals += [x.strip() for x in o[k] if isinstance(x, str) and x.strip()]
    q = re.fullmatch(r"\s*(.*?)\s*\[[^]]+\]\s*", n or "")
    if q:
        vals.append(q.group(1).strip())
    out, seen = [], set()
    for v in vals:
        x = norm(v)
        if x and x not in seen:
            seen.add(x)
            out.append(v)
    return out


def priority(p):
    p = norm(p)
    if any(x in p for x in ("2025", "2024", "srd-5.2", "dndbeyond-2024")):
        return 30
    if any(x in p for x in ("2022", "2020")):
        return 20
    if "2014" in p:
        return 10
    return 15


def sid(m, n, o):
    return "ref-" + uuid.uuid5(uuid.NAMESPACE_URL, f"https://teias-de-anansi.invalid/entity/{m}|{norm(o or n)}").hex


def route_for(m, n, source=""):
    if m == "Classes" and norm(n) != "artificer":
        return "classes-v3.html"
    return ROUTES[m]


def named(x):
    if isinstance(x, dict):
        n = pick(x, ("nome", "name", "titulo", "title"))
        if n and (len(x) >= 4 or any(k in x for k in ("descricao", "description", "familia", "fonte", "source", "original", "tipo", "type", "raridade", "escola"))):
            yield x
        for v in x.values():
            yield from named(v)
    elif isinstance(x, list):
        for v in x:
            yield from named(v)


def texts(x):
    if isinstance(x, dict):
        for k, v in x.items():
            if k in TEXT and isinstance(v, str):
                yield v
            else:
                yield from texts(v)
    elif isinstance(x, list):
        for v in x:
            yield from texts(v)


def refs(x, path=""):
    if isinstance(x, dict):
        for k, v in x.items():
            p = f"{path}.{k}" if path else k
            t = NSTRUCT.get(norm(k))
            if t:
                vals = [v] if isinstance(v, str) else v if isinstance(v, list) else []
                for s in vals:
                    if isinstance(s, str):
                        s = s.strip()
                        if 0 < len(s) <= 100 and "\n" not in s and len(s.split()) <= 12 and norm(s) not in GENERIC:
                            yield s, t, p
            yield from refs(v, p)
    elif isinstance(x, list):
        for i, v in enumerate(x):
            yield from refs(v, f"{path}[{i}]")


def html_docs(root):
    routes = set(ROUTES.values()) | {"classes-v3.html"}
    for r in routes:
        p = root / r
        if not p.exists():
            continue
        m = next((mod for mod, url in ROUTES.items() if url == r), None) or ("Classes" if r == "classes-v3.html" else None)
        if not m:
            continue
        h = p.read_text(encoding="utf-8", errors="replace")
        seen = set()
        pats = [
            re.compile(r"\bnome\s*:\s*'([^'\n]{2,100})'", re.I),
            re.compile(r'\bnome\s*:\s*"([^"\n]{2,100})"', re.I),
            re.compile(r"<summary[^>]*>\s*<strong[^>]*>([^<]{2,100})</strong>", re.I),
            re.compile(r"\['([^'\n]{2,80})','[^'\n]+'\]"),
        ]
        for pat in pats:
            for mm in pat.finditer(h):
                n = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", mm.group(1))).strip()
                k = norm(n)
                if k and k not in seen and len(n.split()) <= 14:
                    seen.add(k)
                    yield p, {"nome": n, "modulo": m, "descricao": "", "_html_catalog": True}


def docs(root):
    for p in (root / "dados").rglob("*.json"):
        if p.name.startswith("referencias-hub-") or p.name == "referencias-regras-curadas.json":
            continue
        try:
            yield p, json.loads(p.read_text(encoding="utf-8", errors="replace"))
        except Exception:
            pass
    parts = sorted((root / "dados").glob("regras-dndbeyond-2024.part*.txt"))
    if parts:
        raw = "".join(p.read_text(encoding="utf-8", errors="replace") for p in parts)
        try:
            data = json.loads(raw)
        except Exception as e:
            raise RuntimeError(f"Falha ao reconstruir regras-dndbeyond-2024: {e}")
        yield root / "dados" / "regras-dndbeyond-2024.reconstruido.json", data
    yield from html_docs(root)


def parse_curated_target(spec):
    if "::" not in spec:
        return "Regras", "original", spec
    mod, value = spec.split("::", 1)
    if mod not in ROUTES:
        raise RuntimeError(f"Módulo inválido em referência curada: {spec}")
    if value.startswith("#"):
        return mod, "id", value[1:]
    return mod, "original", value


def validate_curated(root, allr):
    path = root / "dados" / "referencias-regras-curadas.json"
    if not path.exists():
        raise RuntimeError("Mapa curado de Regras ausente: dados/referencias-regras-curadas.json")
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("schema") != "hub-rpg.referencias-regras-curadas.v1":
        raise RuntimeError(f"Schema curado inesperado: {data.get('schema')}")
    if data.get("modulo_origem") != "Regras":
        raise RuntimeError("Mapa curado não está marcado como módulo Regras.")

    rules_map = data.get("regras")
    if not isinstance(rules_map, dict):
        raise RuntimeError("Campo 'regras' do mapa curado deve ser um objeto.")

    expected_modules = set(ROUTES)
    if set(data.get("modulos_analisados") or []) != expected_modules:
        raise RuntimeError("Matriz curada não confirma exatamente os 18 módulos oficiais.")

    published_rules = {
        norm(r.get("original")): r
        for r in allr
        if r.get("modulo") == "Regras" and r.get("status") == "publicado" and r.get("original")
    }
    curated_keys = {norm(k): k for k in rules_map}
    uncurated_published = {
        norm("Base Ability Score Distribution (House Rule)"),
        norm("Wealth by Level (House Rule)"),
    }
    absent_exceptions = sorted(k for k in uncurated_published if k not in published_rules)
    curated_exceptions = sorted(k for k in uncurated_published if k in curated_keys)
    if absent_exceptions or curated_exceptions:
        raise RuntimeError(
            f"Exceções curadas inconsistentes: ausentes_publicadas={absent_exceptions} "
            f"presentes_no_mapa={curated_exceptions}"
        )
    missing = sorted(k for k in published_rules if k not in curated_keys and k not in uncurated_published)
    extra = sorted(k for k in curated_keys if k not in published_rules)
    if missing or extra:
        raise RuntimeError(f"Cobertura de origens curadas inválida: ausentes={missing[:8]} extras={extra[:8]}")
    if len(rules_map) != 160 or data.get("total_regras") != 160:
        raise RuntimeError(f"Mapa curado deve cobrir 160 regras; encontrou {len(rules_map)}.")

    by_id = {r["id"]: r for r in allr if r.get("id")}
    by_original = defaultdict(list)
    for r in allr:
        if r.get("original"):
            by_original[(r.get("modulo"), norm(r.get("original")))].append(r)

    total = 0
    dist = Counter()
    self_refs = []
    invalid = []
    duplicates = []
    for origin_original, targets in rules_map.items():
        origin = published_rules[norm(origin_original)]
        seen = set()
        for spec in targets:
            if not isinstance(spec, str) or not spec.strip():
                invalid.append((origin_original, spec))
                continue
            mod, mode, value = parse_curated_target(spec.strip())
            if mode == "id":
                target = by_id.get(value)
                if not target or target.get("modulo") != mod:
                    invalid.append((origin_original, spec))
                    continue
            else:
                rows = by_original.get((mod, norm(value)), [])
                if len(rows) != 1:
                    invalid.append((origin_original, spec))
                    continue
                target = rows[0]
            if target["id"] == origin["id"]:
                self_refs.append((origin_original, spec))
                continue
            key = target["id"]
            if key in seen:
                duplicates.append((origin_original, spec))
                continue
            seen.add(key)
            total += 1
            dist[mod] += 1

    if invalid:
        raise RuntimeError(f"Destinos curados inválidos/ambíguos: {invalid[:8]}")
    if self_refs:
        raise RuntimeError(f"Autorreferências curadas proibidas: {self_refs[:8]}")
    if duplicates:
        raise RuntimeError(f"Referências curadas duplicadas: {duplicates[:8]}")
    if total != data.get("total_referencias"):
        raise RuntimeError(f"Total curado divergente: mapa={data.get('total_referencias')} calculado={total}")

    magic_rows = by_original.get(("Regras", norm("Magic")), [])
    spell_rows = by_original.get(("Regras", norm("Spell")), [])
    if len(magic_rows) != 1 or len(spell_rows) != 1 or magic_rows[0]["id"] == spell_rows[0]["id"]:
        raise RuntimeError("As duas regras visíveis 'Magia' (Magic/Spell) não possuem identidades distintas.")

    return {
        "total_regras": len(rules_map),
        "total_referencias": total,
        "regras_sem_referencia": sum(1 for v in rules_map.values() if not v),
        "regras_publicadas_sem_relacao_curada": [
            published_rules[k].get("original") for k in sorted(uncurated_published)
        ],
        "distribuicao_destinos": {m: int(dist.get(m, 0)) for m in ROUTES},
        "autorreferencias": 0,
        "destinos_invalidos": 0,
        "duplicidades": 0,
        "modulos_analisados": len(expected_modules),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".")
    ap.add_argument("--output", default="dados/referencias-hub-index.json")
    ap.add_argument("--stubs", default="dados/referencias-hub-stubs.json")
    a = ap.parse_args()

    root = Path(a.root)
    recs, explicit, struct = [], [], []

    for p, d in docs(root):
        dm = module(p)
        for o in named(d):
            n = pick(o, ("nome", "name", "titulo", "title"))
            m = module(p, o) or dm
            if not n or not m:
                continue
            orig = pick(o, ("original", "nome_original", "original_name"))
            rid = o.get("id") if isinstance(o.get("id"), str) and o.get("id").strip() else sid(m, n, orig)
            recs.append({
                "id": rid,
                "nome": n,
                "original": orig,
                "aliases": aliases(o, n),
                "modulo": m,
                "url": route_for(m, n, str(p)),
                "fonte_arquivo": str(p.relative_to(root)).replace("\\", "/"),
                "prioridade": priority(p),
                "status": "publicado",
            })
            for t in texts(o):
                for pat in EXPLICIT:
                    explicit += [(z.group(1).strip(), m, str(p.relative_to(root))) for z in pat.finditer(t)]
        struct += [(n, m, str(p.relative_to(root)), f) for n, m, f in refs(d)]

    best = {}
    for r in recs:
        identity = norm(r.get("original") or r["nome"])
        k = (r["modulo"], identity)
        if k not in best or r["prioridade"] > best[k]["prioridade"]:
            best[k] = r
    recs = list(best.values())

    existing = defaultdict(set)
    global_existing = defaultdict(list)
    for r in recs:
        for x in r["aliases"]:
            k = norm(x)
            existing[r["modulo"]].add(k)
            global_existing[k].append(r)

    stubs = []

    def stub(n, m, why, src=None, field=None, allow_if_global=False):
        k = norm(n)
        if not k or m not in ROUTES or k in existing[m] or k in GENERIC:
            return None
        if not allow_if_global and global_existing.get(k):
            return None
        rid = "ref-" + uuid.uuid5(uuid.NAMESPACE_URL, f"https://teias-de-anansi.invalid/stub/{m}/{k}").hex
        row = {
            "id": rid, "nome": n, "original": None, "aliases": [n], "modulo": m,
            "url": "referencia.html", "status": "pendente", "motivo": why,
            "fonte_referencia": src, "campo_referencia": field, "prioridade": 0,
        }
        stubs.append(row)
        existing[m].add(k)
        global_existing[k].append(row)
        return row

    for n in SEEDS:
        if norm(n) not in existing["Regras"]:
            stub(n, "Regras", "conceito mecânico central referenciado pela Biblioteca", allow_if_global=True)
    for n, m, s in explicit:
        stub(n, m, "referência editorial explícita sem entidade resolvida", s, allow_if_global=False)
    for n, m, s, f in struct:
        stub(n, m, "referência estrutural sem entidade publicada", s, f, allow_if_global=True)

    allr = recs + stubs
    amap = defaultdict(list)
    for r in allr:
        for x in r["aliases"]:
            amap[norm(x)].append(r)

    resolved, amb = [], []
    for k, rows in amap.items():
        by_id = {r["id"]: r for r in rows}
        rs = sorted(by_id.values(), key=lambda x: (x.get("status") == "publicado", x.get("prioridade", 0)), reverse=True)
        official = [
            r for r in rs
            if r["modulo"] == "Regras"
            and r.get("prioridade", 0) >= 30
            and "regras-dndbeyond-2024" in r.get("fonte_arquivo", "")
        ]
        if len(official) == 1:
            resolved.append({"termo": k, "id": official[0]["id"]})
            continue
        if len(official) > 1:
            amb.append({"termo": k, "ids": [r["id"] for r in official]})
            continue
        mods = {r["modulo"] for r in rs}
        if len(rs) == 1:
            resolved.append({"termo": k, "id": rs[0]["id"]})
            continue
        if len(mods) == 1 and ((rs[0].get("status") == "publicado" and rs[1].get("status") != "publicado") or rs[0].get("prioridade", 0) > rs[1].get("prioridade", 0)):
            resolved.append({"termo": k, "id": rs[0]["id"]})
            continue
        amb.append({"termo": k, "ids": [r["id"] for r in rs]})

    ids = {r["id"] for r in allr}
    broken = [x for x in resolved if x["id"] not in ids]
    if broken:
        raise RuntimeError(f"aliases_resolvidos com destino inexistente: {broken[:5]}")

    cov = {m: sum(r["modulo"] == m for r in allr) for m in ROUTES}
    curated_audit = validate_curated(root, allr)

    out = {
        "schema": "hub-rpg.referencias.v3",
        "sintaxe": "[[ID|Texto exibido]]",
        "gerado_automaticamente": True,
        "politica_autorreferencia": "proibida",
        "total_entidades": len(allr),
        "entidades": allr,
        "aliases_resolvidos": resolved,
        "ambiguos": amb,
        "modulos": ROUTES,
        "cobertura_modulos": cov,
        "auditoria": {
            "destinos_invalidos": len(broken),
            "stubs_criados": len(stubs),
            "aliases_ambiguos": len(amb),
            "regras_curadas": curated_audit,
        },
    }
    Path(a.output).write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    Path(a.stubs).write_text(json.dumps({"schema": "hub-rpg.stubs-referencias.v3", "total": len(stubs), "itens": stubs}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"referências: {len(recs)} reais, {len(stubs)} stubs, {len(amb)} aliases ambíguos")
    print("cobertura:", ", ".join(f"{m}={cov[m]}" for m in ROUTES))
    print("Regras curadas:", f"{curated_audit['total_regras']} regras,", f"{curated_audit['total_referencias']} referências,", f"{curated_audit['regras_sem_referencia']} sem referências,", f"{curated_audit['modulos_analisados']}/18 módulos.")


if __name__ == "__main__":
    main()