export function filterByRutOrName(
  list: any[],
  term: string,
  keys: { nameKey: string; rutKey: string },
): any[] {
  if (!term) return list;

  const search = normalize(term);

  return list.filter((item) => {
    const name = normalize(item[keys.nameKey] || '');
    const rut = normalizeRut(item[keys.rutKey] || '');

    return name.includes(search) || rut.includes(normalizeRut(term));
  });
}

// 🔥 NORMALIZA TEXTO
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// 🔥 NORMALIZA RUT
function normalizeRut(rut: string): string {
  return rut.replace(/\./g, '').replace('-', '').toLowerCase();
}
