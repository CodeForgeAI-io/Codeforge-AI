/**
 * Output comparison: trims trailing whitespace per line and surrounding
 * blank lines, then falls back to JSON-aware comparison so `[0, 1]` and
 * `[0,1]` are treated as equal.
 */

export function normalizeOutput(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+$/g, ""))
    .join("\n")
    .replace(/^\n+|\n+$/g, "");
}

function tryParseJson(value: string): unknown | undefined {
  const trimmed = value.trim();
  if (!/^[[{"\-\d]/.test(trimmed)) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a.length === b.length && a.every((item, i) => deepEqual(item, b[i]))
    );
  }
  if (a && b && typeof a === "object") {
    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);
    return (
      keysA.length === keysB.length &&
      keysA.every((key) =>
        deepEqual(
          (a as Record<string, unknown>)[key],
          (b as Record<string, unknown>)[key],
        ),
      )
    );
  }
  return false;
}

export function outputsMatch(actual: string, expected: string): boolean {
  const normActual = normalizeOutput(actual);
  const normExpected = normalizeOutput(expected);
  if (normActual === normExpected) return true;

  const jsonActual = tryParseJson(normActual);
  const jsonExpected = tryParseJson(normExpected);
  if (jsonActual !== undefined && jsonExpected !== undefined) {
    return deepEqual(jsonActual, jsonExpected);
  }
  return false;
}
