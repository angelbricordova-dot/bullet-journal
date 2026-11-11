/** Pick a random item (kept out of render bodies for the purity lint). */
export function pickRandom<T>(list: readonly T[], avoid?: (x: T) => boolean): T {
  if (list.length > 1 && avoid) {
    const pool = list.filter((x) => !avoid(x));
    if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
  }
  return list[Math.floor(Math.random() * list.length)];
}
