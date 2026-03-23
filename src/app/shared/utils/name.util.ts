export function formatearNombre(texto: string): string {
  if (!texto) return '';

  return texto
    .toLowerCase()
    .trim()
    .split(' ')
    .map(palabra =>
      palabra.charAt(0).toUpperCase() + palabra.slice(1)
    )
    .join(' ');
}