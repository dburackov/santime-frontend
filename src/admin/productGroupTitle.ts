export function groupTitle(group: { id: number; name: string | null }): string {
  return group.name ? `${group.id} ${group.name}` : String(group.id);
}
