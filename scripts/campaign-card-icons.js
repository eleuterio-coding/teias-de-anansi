/** Ícones de apresentação dos cards panorâmicos: todos decorativos, sem textos substituídos. */
const shapes={
 book:'<path d="M12 6.5C9.5 4.5 6.5 4 3 5v14c3.5-1 6.5-.5 9 1.5M12 6.5c2.5-2 5.5-2.5 9-1.5v14c-3.5-1-6.5-.5-9 1.5M12 6.5v14"/>',
 scenes:'<path d="M3 5.5 9 3l6 2.5L21 3v15.5L15 21l-6-2.5L3 21V5.5Zm6-2.5v15.5m6-13v15.5"/>',
 encounters:'<path d="M4 3 20 19M20 3 4 19M5 3h5m9 0h-5M3 14v5h5m13-5v5h-5"/>'
};
export const cardMetricIcon=(name)=>`<span class="campaign-card-stat-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false">${shapes[name]||shapes.book}</svg></span>`;
export const cardOpenArrow='<span class="campaign-card-actions-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></span>';
export const cardDeleteIcon='<span class="campaign-card-actions-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M3 6h18M9 6V4h6v2m-9 0 1 15h10l1-15M10 10v7m4-7v7"/></svg></span>';
