import { describe, it, expect } from 'vitest';
import { shuffleArray, formatTime } from '../js/utils.js';

describe('utils', () => {
  it('shuffleArray returns array of same length', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(arr);
    expect(shuffled.length).toBe(arr.length);
  });

  it('shuffleArray contains same elements', () => {
    const arr = [1, 2, 3];
    const shuffled = shuffleArray(arr);
    expect(shuffled.sort()).toEqual([1, 2, 3].sort());
  });

  it('shuffleArray doesn\'t modify original', () => {
    const arr = [1, 2, 3];
    shuffleArray(arr);
    expect(arr).toEqual([1, 2, 3]);
  });

  it('formatTime(0) -> 00:00', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('formatTime(65) -> 01:05', () => {
    expect(formatTime(65)).toBe('01:05');
  });

  it('formatTime(3600) -> 60:00', () => {
    expect(formatTime(3600)).toBe('60:00');
  });
});
