/**
 * A JSON reader that keeps whatever it could read instead of throwing the
 * whole document away.
 *
 * `JSON.parse` is all-or-nothing, which is correct for data you control and
 * badly wrong for a language model's reply: a single misplaced bracket in an
 * otherwise semantically perfect response discards every byte of it, including
 * a page of content the model got completely right. That is the most expensive
 * failure this pipeline has — the user sees nothing happen and no error.
 *
 * The rule here is **keep what was fully read, drop the malformed remainder,
 * and never invent an association.** On any structural surprise inside an
 * object or array, that container closes with the members already read and the
 * offending character is left for whichever container encloses it. A value
 * therefore stays attached to the key it was literally written under; nothing
 * is re-paired by proximity, which is where "repair" turns into guessing and a
 * model's paragraph lands in the wrong block.
 *
 * Two real failure shapes this covers:
 *
 * - **Truncation.** A `max_tokens` ceiling too low for the reply cuts it
 *   mid-string. Everything before the cut survives; the partial string is kept
 *   (a half-written paragraph is still the model's work, and `salvaged` tells
 *   the caller not to trust the tail).
 * - **A misplaced delimiter.** `…"patch":{"pages":[…]}],"message":…` — the
 *   command object's `}` ended up after `message`. Reading stops at the stray
 *   `]` with `op`, `id` and the complete `patch` already collected, so the
 *   command survives intact.
 *
 * Only ever a fallback: callers try `JSON.parse` first and come here when it
 * throws. Nothing that parses strictly is ever routed through this.
 */

/** A read either produced a value or found nothing readable at all. */
type Read = { ok: true; value: unknown } | { ok: false };

const NOTHING: Read = { ok: false };

export interface TolerantJsonResult {
  value: unknown;
  /**
   * The text was not valid JSON and something was dropped to recover this.
   * Always inspect it: a salvaged value is the readable part of a broken
   * reply, not a clean parse.
   */
  salvaged: boolean;
}

interface Scanner {
  text: string;
  pos: number;
  salvaged: boolean;
}

const SIMPLE_ESCAPES: Record<string, string> = {
  '"': '"',
  '\\': '\\',
  '/': '/',
  b: '\b',
  f: '\f',
  n: '\n',
  r: '\r',
  t: '\t',
};

function skipWhitespace(scanner: Scanner): void {
  while (scanner.pos < scanner.text.length) {
    const char = scanner.text[scanner.pos]!;
    if (char !== ' ' && char !== '\t' && char !== '\n' && char !== '\r') break;
    scanner.pos += 1;
  }
}

function peek(scanner: Scanner): string | undefined {
  return scanner.text[scanner.pos];
}

/**
 * Reads a quoted string. An unterminated one (the reply was cut off inside it)
 * yields what was read so far rather than nothing — the same "keep the
 * readable part" rule the containers follow.
 */
function readString(scanner: Scanner): string {
  scanner.pos += 1; // opening quote, already checked by the caller
  let out = '';

  while (scanner.pos < scanner.text.length) {
    const char = scanner.text[scanner.pos]!;

    if (char === '"') {
      scanner.pos += 1;
      return out;
    }

    if (char !== '\\') {
      out += char;
      scanner.pos += 1;
      continue;
    }

    const escape = scanner.text[scanner.pos + 1];
    if (escape === undefined) {
      // A trailing backslash at EOF — truncated mid-escape.
      scanner.pos += 1;
      scanner.salvaged = true;
      return out;
    }
    if (escape === 'u') {
      const hex = scanner.text.slice(scanner.pos + 2, scanner.pos + 6);
      if (/^[0-9a-fA-F]{4}$/.test(hex)) {
        out += String.fromCharCode(Number.parseInt(hex, 16));
        scanner.pos += 6;
        continue;
      }
      // Not a real escape — take the characters literally rather than
      // discarding the rest of the string over them.
      out += escape;
      scanner.pos += 2;
      continue;
    }
    out += SIMPLE_ESCAPES[escape] ?? escape;
    scanner.pos += 2;
  }

  scanner.salvaged = true;
  return out;
}

const NUMBER = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/;

function readNumber(scanner: Scanner): Read {
  const match = NUMBER.exec(scanner.text.slice(scanner.pos));
  if (!match) return NOTHING;
  scanner.pos += match[0].length;
  return { ok: true, value: Number(match[0]) };
}

function readLiteral(scanner: Scanner): Read {
  if (scanner.text.startsWith('true', scanner.pos)) {
    scanner.pos += 4;
    return { ok: true, value: true };
  }
  if (scanner.text.startsWith('false', scanner.pos)) {
    scanner.pos += 5;
    return { ok: true, value: false };
  }
  if (scanner.text.startsWith('null', scanner.pos)) {
    scanner.pos += 4;
    return { ok: true, value: null };
  }
  return NOTHING;
}

function readArray(scanner: Scanner): unknown[] {
  scanner.pos += 1; // '['
  const out: unknown[] = [];

  for (;;) {
    skipWhitespace(scanner);
    const char = peek(scanner);
    if (char === undefined) {
      scanner.salvaged = true;
      return out;
    }
    if (char === ']') {
      scanner.pos += 1;
      return out;
    }

    const element = readValue(scanner);
    if (!element.ok) {
      scanner.salvaged = true;
      return out;
    }
    out.push(element.value);

    skipWhitespace(scanner);
    const next = peek(scanner);
    if (next === ',') {
      scanner.pos += 1;
      continue;
    }
    if (next === ']') {
      scanner.pos += 1;
      return out;
    }
    // A structural break. Close here with what's collected and leave the
    // offending character in place for the enclosing container.
    scanner.salvaged = true;
    return out;
  }
}

function readObject(scanner: Scanner): Record<string, unknown> {
  scanner.pos += 1; // '{'
  const out: Record<string, unknown> = {};

  for (;;) {
    skipWhitespace(scanner);
    const char = peek(scanner);
    if (char === undefined) {
      scanner.salvaged = true;
      return out;
    }
    if (char === '}') {
      scanner.pos += 1;
      return out;
    }
    if (char !== '"') {
      scanner.salvaged = true;
      return out;
    }

    const key = readString(scanner);
    skipWhitespace(scanner);
    if (peek(scanner) !== ':') {
      scanner.salvaged = true;
      return out;
    }
    scanner.pos += 1;

    const value = readValue(scanner);
    if (!value.ok) {
      scanner.salvaged = true;
      return out;
    }
    out[key] = value.value;

    skipWhitespace(scanner);
    const next = peek(scanner);
    if (next === ',') {
      scanner.pos += 1;
      continue;
    }
    if (next === '}') {
      scanner.pos += 1;
      return out;
    }
    scanner.salvaged = true;
    return out;
  }
}

function readValue(scanner: Scanner): Read {
  skipWhitespace(scanner);
  const char = peek(scanner);
  if (char === undefined) return NOTHING;
  if (char === '{') return { ok: true, value: readObject(scanner) };
  if (char === '[') return { ok: true, value: readArray(scanner) };
  if (char === '"') return { ok: true, value: readString(scanner) };
  if (char === '-' || (char >= '0' && char <= '9')) return readNumber(scanner);
  return readLiteral(scanner);
}

/**
 * Reads the first JSON value in `text`, tolerating a malformed remainder.
 *
 * Returns `undefined` only when there is no readable value at the start at all
 * — prose, an empty string. Otherwise `salvaged` says whether anything had to
 * be dropped, including trailing characters after an otherwise complete value
 * (which are themselves evidence the reply was malformed).
 */
export function tolerantJsonParse(text: string): TolerantJsonResult | undefined {
  const scanner: Scanner = { text, pos: 0, salvaged: false };
  const read = readValue(scanner);
  if (!read.ok) return undefined;

  skipWhitespace(scanner);
  if (scanner.pos < scanner.text.length) scanner.salvaged = true;

  return { value: read.value, salvaged: scanner.salvaged };
}
