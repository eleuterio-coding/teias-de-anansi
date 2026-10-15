#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BIBLIOTECA = ROOT / "bibliotecas.html"
MARKER = "hub-force-light-theme"

def module_pages() -> list[Path]:
    html = BIBLIOTECA.read_text(encoding="utf-8")
    block_match = re.search(r'<ol\s+class="modulos"[^>]*>(.*?)</ol>', html, flags=re.I | re.S)
    if not block_match:
        raise RuntimeError("Lista .modulos não encontrada em bibliotecas.html")

    hrefs = re.findall(r'href=["\']([^"\']+\.html)(?:\?[^"\']*)?["\']', block_match.group(1), flags=re.I)
    pages: list[Path] = []
    seen: set[str] = set()
    for href in hrefs:
        clean = href.split("#", 1)[0].split("?", 1)[0].strip()
        if not clean or clean in seen:
            continue
        seen.add(clean)
        path = ROOT / clean
        if not path.exists():
            raise RuntimeError(f"Módulo listado sem página: {clean}")
        pages.append(path)

    if not pages:
        raise RuntimeError("Nenhum módulo encontrado na Biblioteca")
    return pages


def normalize(path: Path) -> None:
    """Remover qualquer tema global forçado legado, preservando o HTML do catálogo."""
    html = path.read_text(encoding="utf-8")
    normalized = re.sub(
        rf'\s*<style\s+id=["\']{re.escape(MARKER)}["\']>.*?</style>\s*',
        "\n",
        html,
        flags=re.I | re.S,
    )
    if "</body>" not in normalized.lower():
        raise RuntimeError(f"Elemento </body> ausente: {path.name}")
    if normalized != html:
        path.write_text(normalized, encoding="utf-8")


def validate(pages: list[Path]) -> None:
    errors: list[str] = []
    for path in pages:
        html = path.read_text(encoding="utf-8")
        if MARKER in html:
            errors.append(f"{path.name}: estilo forçado legado ainda presente")
        if "biblioteca-light.css" not in html:
            errors.append(f"{path.name}: sem folha de leitura comum")
        if "scripts/hub-ux.js" not in html and "scripts/module-clean-loader.js" not in html:
            errors.append(f"{path.name}: sem carregador de navegação unificada")
    if errors:
        raise RuntimeError("Contratos visuais incompletos: " + "; ".join(errors))


if __name__ == "__main__":
    pages = module_pages()
    for page in pages:
        normalize(page)
    validate(pages)
    print(f"Layout compartilhado validado em {len(pages)} módulos, sem estilos globais forçados.")
