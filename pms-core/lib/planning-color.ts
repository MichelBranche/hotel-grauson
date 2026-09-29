const BLOCK_COLORS = ["#dce8dc", "#d7e4f2", "#f3dce3", "#efe6c9", "#e4ddd2", "#d9ebe4"];

export function planningColor(id: string) {
  const index = id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return BLOCK_COLORS[index % BLOCK_COLORS.length];
}
