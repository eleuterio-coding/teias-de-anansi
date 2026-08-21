#!/usr/bin/env python3
import importlib.util
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TARGET = ROOT / 'gerar_magias_catalogo.py'

spec = importlib.util.spec_from_file_location('gerador_magias_base', TARGET)
if spec is None or spec.loader is None:
    raise RuntimeError('Não foi possível carregar o gerador base de Magias.')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def clean_5e_tags(text):
    text = str(text or '')

    def repl(match):
        body = match.group(1)
        bits = body.split('|')
        first = bits[0]
        if ' ' in first:
            first = first.split(' ', 1)[1]
        shown = bits[2] if len(bits) > 2 and bits[2] else first
        return re.sub(r'\s*\[[^\]]+\]', '', shown)

    prev = None
    while prev != text:
        prev = text
        text = re.sub(r'\{@([^{}]+)\}', repl, text)
    return re.sub(r'\s+', ' ', text).strip()


module.clean_5e_tags = clean_5e_tags
module.main()
