/**
 * Orders programs and method steps by the number shown on the card
 * ("01", "02", …), so renumbering one in the admin reorders the site.
 *
 * Anything without a usable number keeps its place at the end, and equal
 * numbers keep the order they were added in, so the list never jumps around.
 */
export function byNumber<T extends { number: string }>(records: T[]): T[] {
  return records
    .map((record, index) => ({
      record,
      index,
      key: Number.parseInt(record.number, 10),
    }))
    .sort((a, b) => {
      const aHas = Number.isFinite(a.key);
      const bHas = Number.isFinite(b.key);

      if (aHas && bHas && a.key !== b.key) return a.key - b.key;
      if (aHas !== bHas) return aHas ? -1 : 1;

      return a.index - b.index;
    })
    .map((entry) => entry.record);
}
