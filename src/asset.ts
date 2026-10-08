/** Caminho de um arquivo de public/, respeitando o endereço onde o site está hospedado. */
export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}
