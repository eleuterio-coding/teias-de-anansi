# Regressão: loop de renderização do equipamento

O módulo de equipamento ativo não deve comparar `element.innerHTML` diretamente com o HTML-fonte quando existem atributos booleanos (`checked`, `selected`, `disabled`), porque o navegador normaliza a serialização desses atributos.

Contrato aplicado:
- o bloco renderizado recebe `data-equipment-ownership-ui="1"`;
- o bloco de combate recebe `data-equipment-combat-ui="1"`;
- uma assinatura do HTML esperado é mantida em `dataset`;
- MutationObserver só restaura o bloco quando outro módulo realmente o substitui, sem reescrever indefinidamente a própria renderização.
