/**
 * Asterisks in the texts are the bold/italic markers of pasted text (**like this**), never something meant to be
 * read, so they are removed. Used by the form while typing and by the server when saving.
 */
export function stripAsterisks(value: string): string {
  return value.replace(/\*+/g, "");
}

/**
 * Decimals are always written with a dot (8.5, 12.5), never a comma. A comma, which an Italian keyboard or
 * browser offers, becomes a dot. Used by the form while typing and by the server when saving.
 */
export function decimalPoint(value: string): string {
  return value.replace(/,/g, ".");
}
