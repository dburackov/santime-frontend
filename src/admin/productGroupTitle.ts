export function groupTitle(group: { id: number; name: string }): string {
  return group.name ? `${group.id} ${group.name}` : String(group.id);
}
