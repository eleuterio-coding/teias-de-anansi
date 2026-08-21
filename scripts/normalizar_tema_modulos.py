#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BIBLIOTECA = ROOT / "bibliotecas.html"
MARKER = "hub-force-light-theme"

STYLE = r'''<style id="hub-force-light-theme">
:root { color-scheme: only light !important; }
html,
html body,
html body * {
  background: #ffffff !important;
  background-color: #ffffff !important;
  color: #000000 !important;
  -webkit-text-fill-color: #000000 !important;
}
html body *::before,
html body *::after {
  color: #000000 !important;
  -webkit-text-fill-color: #000000 !important;
}
html body a,
html body a:link,
html body a:visited,
html body a:hover,
html body a:active,
html body a:focus {
  background: #ffffff !important;
  color: #000000 !important;
  -webkit-text-fill-color: #000000 !important;
}
html body input,
html body select,
html body textarea,
html body button,
html body option,
html body optgroup {
  background: #ffffff !important;
  color: #000000 !important;
  -webkit-text-fill-color: #000000 !important;
}
html body input::placeholder,
html body textarea::placeholder {
  color: #000000 !important;
  -webkit-text-fill-color: #000000 !important;
  opacity: .68 !important;
}
html body svg text { fill: #000000 !important; }
</style>'''


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
    html = path.read_text(encoding="utf-8")
    html = re.sub(
        rf'\s*<style\s+id=["\']{re.escape(MARKER)}["\']>.*?</style>\s*',
        "\n",
        html,
        flags=re.I | re.S,
    )
    if "</body>" not in html.lower():
        raise RuntimeError(f"Elemento </body> ausente: {path.name}")
    html = re.sub(r'</body>', STYLE + "\n</body>", html, count=1, flags=re.I)
    path.write_text(html, encoding="utf-8")


def validate(pages: list[Path]) -> None:
    failures: list[str] = []
    for path in pages:
        html = path.read_text(encoding="utf-8")
        if html.count(f'id="{MARKER}"') != 1:
            failures.append(path.name)
        if "#ffffff !important" not in html or "#000000 !important" not in html:
            failures.append(path.name)
    if failures:
        raise RuntimeError("Tema claro não validado em: " + ", ".join(sorted(set(failures))))


if __name__ == "__main__":
    pages = module_pages()
    for page in pages:
        normalize(page)
    validate(pages)
    print(f"Tema claro validado em {len(pages)} módulos da Biblioteca.")
