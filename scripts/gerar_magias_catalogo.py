#!/usr/bin/env python3
import json
import re
import unicodedata
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dados" / "magias-catalogo.json"
LOCAL = ROOT / "dados" / "magias-suplementos-locais.json"

BASE = "https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data"
REMOTE = {
    "XPHB": f"{BASE}/spells/spells-xphb.json",
    "XGE": f"{BASE}/spells/spells-xge.json",
    "TCE": f"{BASE}/spells/spells-tce.json",
    "FRHoF": f"{BASE}/spells/spells-frhof.json",
    "EFA": f"{BASE}/spells/spells-efa.json",
}
LOOKUP_URL = f"{BASE}/generated/gendata-spell-source-lookup.json"

SOURCE_META = {
    "XPHB": {
        "id": "phb-2024",
        "titulo": "Player's Handbook (2024)",
        "ano": 2024,
        "data": "2024-09-17",
        "ruleset": "5.5e",
        "revisao_core": 2024,
        "natureza": "oficial",
        "pdf_origem": "pdf24_merged.pdf",
        "secao": "Chapter 7: Spells",
        "url": "https://www.dndbeyond.com/sources/dnd/phb-2024",
        "prioridade": 20240917,
    },
    "XGE": {
        "id": "xanathar-2017",
        "titulo": "Xanathar's Guide to Everything",
        "ano": 2017,
        "data": "2017-11-21",
        "ruleset": "5e",
        "revisao_core": 2014,
        "natureza": "oficial",
        "pdf_origem": "pdf24_merged.pdf",
        "secao": "Chapter 3: Spells",
        "prioridade": 20171121,
    },
    "TCE": {
        "id": "tasha-2020",
        "titulo": "Tasha's Cauldron of Everything",
        "ano": 2020,
        "data": "2020-11-17",
        "ruleset": "5e",
        "revisao_core": 2014,
        "natureza": "oficial",
        "pdf_origem": "pdf24_merged-1.pdf",
        "secao": "Chapter 3: Magical Miscellany — Spells",
        "prioridade": 20201117,
    },
    "FRHoF": {
        "id": "fr-heroes-2025",
        "titulo": "Forgotten Realms: Heroes of Faerûn",
        "ano": 2025,
        "data": "2025-11-01",
        "ruleset": "5.5e",
        "revisao_core": 2024,
        "natureza": "oficial",
        "pdf_origem": "pdf24_merged.pdf",
        "secao": "Chapter 5: Magic of Faerûn — Spells",
        "url": "https://www.dndbeyond.com/sources/dnd/frhof",
        "prioridade": 20251101,
    },
    "EFA": {
        "id": "eberron-forge-2025",
        "titulo": "Eberron: Forge of the Artificer",
        "ano": 2025,
        "data": "2025-12-09",
        "ruleset": "5.5e",
        "revisao_core": 2024,
        "natureza": "oficial",
        "pdf_origem": "pdf24_merged-1.pdf",
        "secao": "Artificer — Spells",
        "prioridade": 20251209,
    },
}

SCHOOL = {
    "A": "Abjuração", "C": "Conjuração", "D": "Adivinhação", "E": "Encantamento",
    "V": "Evocação", "I": "Ilusão", "N": "Necromancia", "T": "Transmutação",
}
CLASS_PT = {
    "Artificer": "Artífice", "Barbarian": "Bárbaro", "Bard": "Bardo", "Cleric": "Clérigo",
    "Druid": "Druida", "Fighter": "Guerreiro", "Monk": "Monge", "Paladin": "Paladino",
    "Ranger": "Patrulheiro", "Rogue": "Ladino", "Sorcerer": "Feiticeiro",
    "Warlock": "Bruxo", "Wizard": "Mago",
}
SAVE_PT = {
    "strength": "Força", "dexterity": "Destreza", "constitution": "Constituição",
    "intelligence": "Inteligência", "wisdom": "Sabedoria", "charisma": "Carisma",
}
DAMAGE_PT = {
    "acid": "Ácido", "bludgeoning": "Contundente", "cold": "Frio", "fire": "Fogo",
    "force": "Força", "lightning": "Elétrico", "necrotic": "Necrótico", "piercing": "Perfurante",
    "poison": "Veneno", "psychic": "Psíquico", "radiant": "Radiante", "slashing": "Cortante",
    "thunder": "Trovejante",
}
CONDITION_PT = {
    "blinded": "Cego", "charmed": "Enfeitiçado", "deafened": "Surdo", "exhaustion": "Exaustão",
    "frightened": "Amedrontado", "grappled": "Agarrado", "incapacitated": "Incapacitado",
    "invisible": "Invisível", "paralyzed": "Paralisado", "petrified": "Petrificado",
    "poisoned": "Envenenado", "prone": "Caído", "restrained": "Contido", "stunned": "Atordoado",
    "unconscious": "Inconsciente",
}
NAME_PT = {
    "Fireball": "Bola de Fogo",
    "Magic Missile": "Mísseis Mágicos",
    "Cure Wounds": "Curar Ferimentos",
}
AREA_PT = {
    "C": "Cone", "L": "Linha", "R": "Raio", "S": "Esfera", "Q": "Cubo",
    "W": "Muralha", "MT": "Múltiplos alvos", "ST": "Alvo único", "Y": "Cilindro",
}


def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Teias-de-Anansi-Hub/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def norm(s):
    s = unicodedata.normalize("NFKD", str(s or "")).encode("ascii", "ignore").decode("ascii")
    s = re.sub(r"[^a-zA-Z0-9]+", " ", s).strip().lower()
    return s


def slug(s):
    return norm(s).replace(" ", "-") or "magia"


def clean_5e_tags(text):
    text = str(text or "")
    def repl(m):
        body = m.group(1)
        bits = body.split("|")
        first = bits[0]
        if " " in first:
            first = first.split(" ", 1)[1]
        shown = bits[2] if len(bits) > 2 and bits[2] else first
        shown = re.sub(r"\s*\[[^\]]+\]", "", shown)
        return shown
    prev = None
    while prev != text:
        prev = text
        text = re.sub(r"\{@[^{}]+\}", repl, text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def flatten_entries(node):
    out = []
    if node is None:
        return out
    if isinstance(node, str):
        t = clean_5e_tags(node)
        if t:
            out.append(t)
        return out
    if isinstance(node, list):
        for x in node:
            out.extend(flatten_entries(x))
        return out
    if isinstance(node, dict):
        name = clean_5e_tags(node.get("name", ""))
        sub = []
        for k in ("entry", "entries", "items"):
            if k in node:
                sub.extend(flatten_entries(node[k]))
        if node.get("type") == "table":
            caption = clean_5e_tags(node.get("caption", ""))
            if caption:
                sub.append(caption)
            for row in node.get("rows", []):
                vals = []
                for cell in row:
                    vals.extend(flatten_entries(cell))
                if vals:
                    sub.append(" | ".join(vals))
        if name and sub:
            out.append(name + ": " + " ".join(sub))
        elif sub:
            out.extend(sub)
        return out
    return out


def fmt_time(spell):
    xs = spell.get("time") or []
    if not xs:
        return "—"
    unit = {"action": "Ação", "bonus": "Ação Bônus", "reaction": "Reação", "round": "rodada", "minute": "minuto", "hour": "hora"}
    parts = []
    for x in xs:
        n = x.get("number", 1)
        u = unit.get(x.get("unit"), str(x.get("unit", "")))
        if u in ("Ação", "Ação Bônus", "Reação") and n == 1:
            txt = u
        else:
            txt = f"{n} {u}{'' if n == 1 else 's'}"
        if x.get("condition"):
            txt += ", " + clean_5e_tags(x["condition"])
        parts.append(txt)
    return " ou ".join(parts)


def fmt_range(spell):
    r = spell.get("range") or {}
    typ = r.get("type", "")
    d = r.get("distance") or {}
    dtype = d.get("type", "")
    amt = d.get("amount")
    if dtype == "self": base = "Pessoal"
    elif dtype == "touch": base = "Toque"
    elif dtype == "sight": base = "Visão"
    elif dtype == "unlimited": base = "Ilimitado"
    elif dtype == "planetary": base = "Mesmo plano"
    elif dtype == "feet": base = f"{amt} pés"
    elif dtype == "miles": base = f"{amt} milha{'s' if amt != 1 else ''}"
    elif dtype: base = f"{amt or ''} {dtype}".strip()
    else: base = "—"
    if typ in {"cone", "cube", "line", "radius", "sphere", "hemisphere", "cylinder", "emanation"}:
        shape = {"cone":"cone","cube":"cubo","line":"linha","radius":"raio","sphere":"esfera","hemisphere":"hemisfério","cylinder":"cilindro","emanation":"emanação"}[typ]
        return f"{base} ({shape})"
    return base


def fmt_components(spell):
    c = spell.get("components") or {}
    m = c.get("m")
    material = ""
    if isinstance(m, str): material = clean_5e_tags(m)
    elif isinstance(m, dict): material = clean_5e_tags(m.get("text", ""))
    return {
        "verbal": bool(c.get("v")),
        "somatico": bool(c.get("s")),
        "material": bool(m),
        "material_texto": material,
    }


def fmt_duration(spell):
    ds = spell.get("duration") or []
    if not ds:
        return "—", False
    parts, conc = [], False
    for d in ds:
        typ = d.get("type")
        if d.get("concentration"):
            conc = True
        if typ == "instant": txt = "Instantânea"
        elif typ == "permanent": txt = "Até ser dissipada"
        elif typ == "special": txt = "Especial"
        elif typ == "timed":
            z = d.get("duration") or {}
            n = z.get("amount", 1)
            u = {"turn":"turno","round":"rodada","minute":"minuto","hour":"hora","day":"dia","week":"semana","year":"ano"}.get(z.get("type"), z.get("type", ""))
            txt = f"{n} {u}{'' if n == 1 else 's'}"
            if d.get("upTo"):
                txt = "Até " + txt
        else: txt = typ or "—"
        if d.get("concentration"):
            txt = "Concentração, " + txt.lower()
        parts.append(txt)
    return " ou ".join(parts), conc


def extract_classes(lookup, src, name):
    node = (lookup.get(src.lower(), {}) or {}).get(name.lower(), {}) or {}
    found = set()
    for bucket in ("class", "classVariant"):
        for _, cmap in (node.get(bucket, {}) or {}).items():
            if isinstance(cmap, dict):
                found.update(cmap.keys())
    order = ["Artificer", "Bard", "Cleric", "Druid", "Paladin", "Ranger", "Sorcerer", "Warlock", "Wizard", "Fighter", "Rogue", "Monk", "Barbarian"]
    return [CLASS_PT.get(x, x) for x in order if x in found] + sorted(CLASS_PT.get(x, x) for x in found if x not in order)


def get_attack_save(spell):
    parts = []
    saves = spell.get("savingThrow") or []
    if saves:
        parts.append("Salvaguarda de " + ", ".join(SAVE_PT.get(x, x.title()) for x in saves))
    attacks = spell.get("spellAttack") or []
    if attacks:
        amap = {"M": "Ataque de magia corpo a corpo", "R": "Ataque de magia à distância"}
        parts.extend(amap.get(x, x) for x in attacks)
    return "; ".join(parts) or "Nenhum indicado"


def get_first_damage(spell):
    blob = json.dumps(spell.get("entries", []), ensure_ascii=False)
    m = re.search(r"\{@damage\s+([^}|]+)", blob)
    return m.group(1).strip() if m else ""


def build_editorial_summary(spell):
    parts = []
    saves = spell.get("savingThrow") or []
    if saves:
        parts.append("exige salvaguarda de " + ", ".join(SAVE_PT.get(x, x.title()) for x in saves))
    attacks = spell.get("spellAttack") or []
    if attacks:
        amap = {"M": "usa ataque de magia corpo a corpo", "R": "usa ataque de magia à distância"}
        parts.extend(amap.get(x, x) for x in attacks)
    damage = spell.get("damageInflict") or []
    if damage:
        parts.append("pode causar dano " + ", ".join(DAMAGE_PT.get(x, x.title()) for x in damage))
    conditions = spell.get("conditionInflict") or []
    if conditions:
        parts.append("pode impor " + ", ".join(CONDITION_PT.get(x, x.title()) for x in conditions))
    resist = spell.get("damageResist") or []
    if resist:
        parts.append("pode conceder resistência a " + ", ".join(DAMAGE_PT.get(x, x.title()) for x in resist))
    immune = spell.get("damageImmune") or []
    if immune:
        parts.append("pode conceder imunidade a " + ", ".join(DAMAGE_PT.get(x, x.title()) for x in immune))
    areas = [AREA_PT[x] for x in (spell.get("areaTags") or []) if x in AREA_PT]
    if areas:
        parts.append("estrutura de alvo/área: " + ", ".join(dict.fromkeys(areas)))
    misc = set(spell.get("miscTags") or [])
    if "SMN" in misc: parts.append("envolve invocação de criatura ou entidade")
    if "THP" in misc: parts.append("pode conceder Pontos de Vida Temporários")
    if spell.get("entriesHigherLevel") or "HL" in misc: parts.append("possui efeito ou escalonamento em espaços de nível superior")
    if not parts:
        parts.append("efeito definido integralmente na fonte comercial indicada")
    return "Resumo mecânico editorial: " + "; ".join(parts) + ". O texto narrativo integral permanece na fonte comercial e não é reproduzido no Hub."


def convert_official(spell, src, lookup):
    meta = SOURCE_META[src]
    duration, concentration = fmt_duration(spell)
    open_text = bool(spell.get("srd52"))
    description = " ".join(flatten_entries(spell.get("entries", []))) if open_text else build_editorial_summary(spell)
    if not description:
        description = build_editorial_summary(spell)
        open_text = False
    higher = ""
    if spell.get("entriesHigherLevel"):
        if open_text:
            higher = " ".join(flatten_entries(spell.get("entriesHigherLevel")))
        else:
            higher = "A magia possui escalonamento ou efeito adicional com espaços de nível superior; consulte a fonte para os valores e condições completos."
    damages = spell.get("damageInflict") or []
    return {
        "id": slug(spell["name"]),
        "nome": NAME_PT.get(spell["name"], spell["name"]),
        "nome_original": spell["name"],
        "ruleset": meta["ruleset"],
        "revisao_core": meta["revisao_core"],
        "versao_mais_recente": True,
        "fonte": meta["id"],
        "pagina_fonte": spell.get("page"),
        "pdf_origem": meta["pdf_origem"],
        "nivel": spell.get("level", 0),
        "escola": SCHOOL.get(spell.get("school"), spell.get("school", "—")),
        "tempo_conjuracao": fmt_time(spell),
        "alcance": fmt_range(spell),
        "componentes": fmt_components(spell),
        "duracao": duration,
        "concentracao": concentration,
        "ritual": bool((spell.get("meta") or {}).get("ritual")),
        "ataque_salvaguarda": get_attack_save(spell),
        "tipo_efeito": "Dano" if damages else "Magia",
        "tipo_dano": ", ".join(DAMAGE_PT.get(x, x.title()) for x in damages),
        "dano_base": get_first_damage(spell),
        "classes_base": extract_classes(lookup, src, spell["name"]),
        "descricao": description,
        "niveis_superiores": higher,
        "descricao_tipo": "texto_aberto_srd_5_2_1" if open_text else "resumo_mecanico_editorial",
        "texto_integral_publicavel": open_text,
        "completude": "completo_aberto" if open_text else "stats_completos_resumo",
        "natureza": "oficial",
    }


def convert_local(item, source_meta):
    src = source_meta[item["fonte"]]
    comp = item.get("componentes") or {"verbal": False, "somatico": False, "material": False, "material_texto": ""}
    complete = item.get("completude", "metadados_protegidos")
    desc = item.get("descricao")
    if not desc:
        desc = "Entrada identificada no apêndice de magias da fonte. O Hub registra nível, escola, página e proveniência, mas não reproduz o texto integral porque a própria publicação designa suas magias como Product Identity e conteúdo não aberto."
    return {
        "id": slug(item["nome_original"]),
        "nome": item.get("nome", item["nome_original"]),
        "nome_original": item["nome_original"],
        "ruleset": src.get("ruleset", "5e"),
        "revisao_core": 2024 if src.get("ruleset") == "5.5e" else 2014,
        "versao_mais_recente": True,
        "fonte": item["fonte"],
        "pagina_fonte": item.get("pagina_fonte"),
        "pdf_origem": src.get("pdf_origem"),
        "nivel": item.get("nivel", 0),
        "escola": item.get("escola", "—"),
        "escola_alternativa": item.get("escola_alternativa", ""),
        "tempo_conjuracao": item.get("tempo_conjuracao", "Não republicado"),
        "alcance": item.get("alcance", "Não republicado"),
        "componentes": comp,
        "duracao": item.get("duracao", "Não republicado"),
        "concentracao": item.get("concentracao"),
        "ritual": item.get("ritual"),
        "ataque_salvaguarda": item.get("ataque_salvaguarda", "Não republicado"),
        "tipo_efeito": "Magia",
        "tipo_dano": item.get("tipo_dano", ""),
        "dano_base": item.get("dano_base", ""),
        "classes_base": item.get("classes_base", []),
        "descricao": desc,
        "niveis_superiores": item.get("niveis_superiores", ""),
        "descricao_tipo": item.get("descricao_tipo", "metadados_protegidos"),
        "texto_integral_publicavel": False,
        "completude": complete,
        "natureza": src.get("natureza", "terceiro"),
        "nota_versao": item.get("nota_versao", ""),
    }


def main():
    print("Baixando metadados estruturados das fontes confirmadas nos PDFs...")
    lookup = fetch_json(LOOKUP_URL)
    raw_by_source = {src: fetch_json(url).get("spell", []) for src, url in REMOTE.items()}
    with LOCAL.open(encoding="utf-8") as f:
        local = json.load(f)

    candidates = defaultdict(list)
    for src, spells in raw_by_source.items():
        for spell in spells:
            key = norm(spell.get("name"))
            if not key:
                continue
            candidates[key].append((SOURCE_META[src]["prioridade"], src, spell))

    retained = []
    discarded = []
    for key, rows in candidates.items():
        rows.sort(key=lambda x: x[0], reverse=True)
        _, src, spell = rows[0]
        rec = convert_official(spell, src, lookup)
        older = []
        for _, old_src, old_spell in rows[1:]:
            older.append({
                "fonte": SOURCE_META[old_src]["id"],
                "ano": SOURCE_META[old_src]["ano"],
                "pagina_fonte": old_spell.get("page"),
            })
            discarded.append((old_spell.get("name"), old_src, src))
        if older:
            rec["versoes_anteriores_descartadas"] = older
        retained.append(rec)

    official_names = {norm(x["nome_original"]) for x in retained}
    for item in local.get("itens", []):
        key = norm(item.get("nome_original"))
        if key in official_names:
            # Terceiros não substituem a definição oficial homônima.
            discarded.append((item.get("nome_original"), item.get("fonte"), "oficial"))
            continue
        retained.append(convert_local(item, local.get("fontes", {})))

    retained.sort(key=lambda x: (int(x.get("nivel", 0)), norm(x.get("escola")), norm(x.get("nome"))))
    for i, rec in enumerate(retained, 1):
        rec["ordem_catalogo"] = i

    all_sources = {}
    for src, meta in SOURCE_META.items():
        all_sources[meta["id"]] = {k: v for k, v in meta.items() if k not in {"id", "prioridade"}}
    all_sources.update(local.get("fontes", {}))
    all_sources["srd-5.2.1"] = {
        "titulo": "System Reference Document 5.2.1",
        "editora": "Wizards of the Coast LLC",
        "ano": 2025,
        "ruleset": "5.5e",
        "licenca": "CC-BY-4.0",
        "url": "https://www.dndbeyond.com/srd",
        "nota": "Os registros marcados texto_aberto_srd_5_2_1 usam somente texto identificado como SRD 5.2.1 aberto."
    }

    counts = Counter(x["fonte"] for x in retained)
    completeness = Counter(x["completude"] for x in retained)
    payload = {
        "schema": "hub-rpg/magias/v2",
        "gerado_em": "2026-08-19",
        "modulo": "Magias",
        "politica": "Uma única definição por magia. Entre fontes oficiais do corpus, prevalece a definição publicada mais recentemente; conteúdo oficial prevalece sobre reimpressão homônima de terceiros. Fontes antigas sobrevivem apenas quando não existe versão posterior equivalente.",
        "corpus": ["pdf24_merged.pdf", "pdf24_merged-1.pdf"],
        "controle": {
            "validado": True,
            "quantidade": len(retained),
            "candidatos_oficiais": sum(len(v) for v in raw_by_source.values()),
            "descartados_por_versao_ou_precedencia": len(discarded),
            "por_fonte": dict(sorted(counts.items())),
            "por_completude": dict(sorted(completeness.items())),
            "ordenacao": "nível crescente > escola > nome",
            "fontes_documentais": ["PHB 2024", "Xanathar 2017", "Tasha 2020", "Heroes of Faerûn 2025", "Forge of the Artificer 2025", "Quickstone", "L'Arsène's Ledger"],
        },
        "fontes": all_sources,
        "licenciamento": {
            "srd_5_2_1": "CC-BY-4.0; texto aberto pode ser exibido integralmente com atribuição.",
            "comercial": "O Hub publica parâmetros factuais e resumo mecânico/editorial original, sem reproduzir prosa protegida não aberta.",
            "larsene": "A própria obra declara spells como Product Identity e not open content; portanto somente metadados e resumo editorial são publicados."
        },
        "itens": retained,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Catálogo gerado: {len(retained)} magias; {len(discarded)} versões/reimpressões descartadas.")
    print("Por fonte:", dict(counts))


if __name__ == "__main__":
    main()
