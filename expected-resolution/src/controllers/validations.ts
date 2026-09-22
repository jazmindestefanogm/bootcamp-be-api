// Convierte el texto a número entero positivo.
// Devuelve null si no se puede (ej.: "abc", "2.5", "-3").
export function parseId(text: string): number | null {
  const value = Number(text);
  if (!Number.isInteger(value) || value < 1) return null;
  return value;
}

// "true" → true, "false" → false, cualquier otra cosa → null.
export function parseBoolean(text: string): boolean | null {
  if (text === "true") return true;
  if (text === "false") return false;
  return null;
}

// Revisa los campos de un libro que vienen en el body.
// Si `allRequired` es true (POST y PUT), falta un campo → error.
// Si es false (PATCH), cada campo es opcional, pero si viene tiene que estar bien.
// Devuelve el mensaje de error, o null si está todo bien.
export function validateBook(body: any, allRequired: boolean): string | null {
  const { title, year, author_id } = body;

  if (title === undefined) {
    if (allRequired) return "Missing field: title";
  } else if (typeof title !== "string" || title.length < 1 || title.length > 200) {
    return "title must be a string of 1 to 200 characters";
  }

  if (year === undefined) {
    if (allRequired) return "Missing field: year";
  } else if (!Number.isInteger(year) || year < 1000 || year > 2100) {
    return "year must be an integer from 1000 to 2100";
  }

  if (author_id === undefined) {
    if (allRequired) return "Missing field: author_id";
  } else if (!Number.isInteger(author_id) || author_id < 1) {
    return "author_id must be an integer greater than 0";
  }

  return null;
}
