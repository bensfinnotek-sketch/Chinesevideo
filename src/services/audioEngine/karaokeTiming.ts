import { AudioSegment, KaraokeToken } from './types';

const PUNCTUATION = /[，。！？、；：,.!?;:\s]+/g;
const CJK = /[\u3400-\u9fff\u3040-\u30ff]/;

function normalize(value: string): string {
  return value.replace(PUNCTUATION, '').trim();
}

function buildPhraseUnits(text: string, preferredPhrases: string[] = []): string[] {
  const source = text.trim();
  if (!source) return [];

  const preferred = preferredPhrases
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  const units: string[] = [];
  let cursor = 0;

  while (cursor < source.length) {
    const rest = source.slice(cursor);
    const match = preferred.find(phrase => rest.startsWith(phrase));
    if (match) {
      units.push(match);
      cursor += match.length;
      continue;
    }

    const char = source[cursor];
    if (CJK.test(char)) {
      const next = source[cursor + 1];
      if (next && CJK.test(next)) {
        units.push(source.slice(cursor, cursor + 2));
        cursor += 2;
      } else {
        units.push(char);
        cursor += 1;
      }
    } else {
      let end = cursor + 1;
      while (end < source.length && !CJK.test(source[end])) end += 1;
      units.push(source.slice(cursor, end));
      cursor = end;
    }
  }

  return units.filter(unit => normalize(unit).length > 0);
}

export function buildKaraokeTokens(
  segments: AudioSegment[],
  preferredPhrases: string[] = []
): KaraokeToken[] {
  const tokens: KaraokeToken[] = [];
  let globalIndex = 0;

  segments.forEach((segment, segmentIndex) => {
    if (segment.type !== 'chinese_dialogue' || segment.end <= segment.start) return;

    const units = buildPhraseUnits(segment.text, preferredPhrases);
    if (!units.length) return;

    const weights = units.map(unit => Math.max(1, normalize(unit).length));
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const duration = Math.max(0.05, segment.end - segment.start);

    let cursor = segment.start;
    units.forEach((unit, index) => {
      const share = duration * (weights[index] / totalWeight);
      const end = index === units.length - 1 ? segment.end : Math.min(segment.end, cursor + share);
      tokens.push({
        text: unit,
        start: cursor,
        end,
        index: globalIndex++,
        sourceSegmentIndex: segmentIndex,
      });
      cursor = end;
    });
  });

  return tokens;
}
