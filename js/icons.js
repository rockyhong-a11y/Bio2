// UI 아이콘 (24×24 선 아이콘, currentColor)
const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">${d}</svg>`;

export const ICON = {
  phone: svg('<rect x="7" y="2" width="10" height="20" rx="1"/><path d="M7 11h10M10 5h4M10 14h1M13 14h1M10 17h1M13 17h1"/>'),
  bag: svg('<path d="M4 8h16l-1 13H5z"/><path d="M9 8V5a3 3 0 0 1 6 0v3"/>'),
  doc: svg('<path d="M6 2h9l4 4v16H6z"/><path d="M14 2v5h5M9 12h7M9 16h7"/>'),
  map: svg('<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>'),
  pin: svg('<path d="M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>'),
  save: svg('<path d="M4 3h13l3 3v15H4z"/><path d="M8 3v5h8V3M8 21v-7h8v7"/>'),
  gear: svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>'),
  power: svg('<path d="M12 2v9"/><path d="M6.3 6.3a8 8 0 1 0 11.4 0"/>'),
  flame: svg('<path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3 0-6 1-9z"/>'),
  bolt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 1 4 14h6l-2 9 10-13h-6z" fill="currentColor"/></svg>',
};
