/**
 * Picks one entry at random, e.g. a footer quip or an empty-box prompt from the text catalog.
 * `random` returns a number in [0, 1) like Math.random (injectable for tests); the index is clamped either way.
 */
export function pickFrom(list: readonly string[], random: () => number = Math.random): string {
  const index = Math.min(list.length - 1, Math.max(0, Math.floor(random() * list.length)));
  return list[index];
}
