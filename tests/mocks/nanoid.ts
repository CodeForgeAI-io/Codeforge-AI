/** CJS-friendly stand-in for the ESM-only nanoid package in jest */
export function customAlphabet(alphabet: string, size: number) {
  return () =>
    Array.from(
      { length: size },
      () => alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join("");
}

export function nanoid(size = 21): string {
  return customAlphabet(
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_",
    size,
  )();
}
