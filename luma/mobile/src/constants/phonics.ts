// ═══════════════════════════════════════════════════════════════════════════
// PHONICS PRONUNCIATION DATA
// ═══════════════════════════════════════════════════════════════════════════

export interface PhonicsPronunciation {
  letter: string;
  sound: string;
}

export const PHONICS_PRONUNCIATIONS: PhonicsPronunciation[] = [
  { letter: 'A', sound: 'aa' },
  { letter: 'B', sound: 'buh' },
  { letter: 'C', sound: 'kaa' },
  { letter: 'D', sound: 'duh' },
  { letter: 'E', sound: 'eh' },
  { letter: 'F', sound: 'fa' },
  { letter: 'G', sound: 'guh' },
  { letter: 'H', sound: 'huh' },
  { letter: 'I', sound: 'ih' },
  { letter: 'J', sound: 'juh' },
  { letter: 'K', sound: 'kuh' },
  { letter: 'L', sound: 'la' },
  { letter: 'M', sound: 'ma' },
  { letter: 'N', sound: 'nnn' },
  { letter: 'O', sound: 'oh' },
  { letter: 'P', sound: 'puh' },
  { letter: 'Q', sound: 'kwuh' },
  { letter: 'R', sound: 'rrr' },
  { letter: 'S', sound: 'sss' },
  { letter: 'T', sound: 'tuh' },
  { letter: 'U', sound: 'uh' },
  { letter: 'V', sound: 'vvv' },
  { letter: 'W', sound: 'wuh' },
  { letter: 'X', sound: 'ks' },
  { letter: 'Y', sound: 'yuh' },
  { letter: 'Z', sound: 'zzz' },
];

// Helper function to get pronunciation for a letter
export const getPronunciation = (letter: string): string => {
  const pronunciation = PHONICS_PRONUNCIATIONS.find(p => p.letter === letter.toUpperCase());
  return pronunciation?.sound || '';
};
