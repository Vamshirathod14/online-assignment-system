export function titleCase(str) {
  if (!str) return str;
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}
