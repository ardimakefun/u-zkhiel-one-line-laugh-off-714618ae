// Entry for make.fun "One-Line Laugh-Off".
// Writes one original one-line joke (81 characters, under the 200-character
// cap) to /output/entry.txt. Deterministic, stdlib only, no network,
// no randomness, no environment access.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const JOKE =
  "I asked an AI to write the funniest one-liner ever. It said: 'You're reading it.'";

// The gate (RULES.txt): /output/entry.txt must be UTF-8 text of 1 to 200
// characters, not only whitespace; an invalid entry takes no prize. Enforce
// the cap here so a future edit to the joke that breaks it fails loudly
// at build time instead of silently shipping an invalid entry.
if (JOKE.length < 1 || JOKE.length > 200 || JOKE.trim().length === 0) {
  throw new Error(
    `Joke must be 1-200 non-whitespace characters, got ${JOKE.length}`,
  );
}

// The bounty requires exactly one line: a newline or carriage return
// smuggled into the joke would break the single-line entry, so fail loudly.
if (JOKE.includes("\n") || JOKE.includes("\r")) {
  throw new Error("Joke must be a single line (no newline characters)");
}

// Reject invisible control characters (tab, NUL, DEL, other C0 controls):
// they are not visible in a single read, can break the joke's rendering,
// and could trip the gate's UTF-8/single-line expectations. A joke is
// printable text only.
for (const ch of JOKE) {
  const code = ch.codePointAt(0)!;
  if (code < 0x20 || code === 0x7f) {
    throw new Error(
      `Joke contains a control character U+${code.toString(16).toUpperCase().padStart(4, "0")}`,
    );
  }
}

mkdirSync("/output", { recursive: true });
writeFileSync("/output/entry.txt", JOKE, "utf8");

// Fail-fast read-back: confirm what landed on disk is byte-for-byte the
// joke we gated above. Catches a truncated/partial write or a path
// collision (e.g. /output/entry.txt replaced by another entry's file)
// instead of shipping a silently corrupted entry.
const written = readFileSync("/output/entry.txt", "utf8");
if (written !== JOKE) {
  throw new Error(
    `Read-back mismatch: wrote ${JOKE.length} chars, read back ${written.length} chars`,
  );
}
