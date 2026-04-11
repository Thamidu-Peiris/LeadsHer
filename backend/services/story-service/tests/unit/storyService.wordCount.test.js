/**
 * Unit tests — exported pure helpers (no DB, no HTTP).
 */
const { wordCount } = require('../../src/services/storyService');

describe('storyService.wordCount', () => {
  it('counts plain text words', () => {
    expect(wordCount('one two three')).toBe(3);
  });

  it('strips HTML tags before counting', () => {
    expect(wordCount('<p>hello</p> <strong>world</strong>')).toBe(2);
  });

  it('normalizes whitespace', () => {
    expect(wordCount('  a   b  c  ')).toBe(3);
  });

  it('returns 0 for empty or tag-only content', () => {
    expect(wordCount('')).toBe(0);
    expect(wordCount('   ')).toBe(0);
    expect(wordCount('<div></div>')).toBe(0);
  });

  it('treats 100+ words as publishable-length content', () => {
    const words = Array.from({ length: 100 }, (_, i) => `w${i}`).join(' ');
    expect(wordCount(words)).toBe(100);
  });
});
