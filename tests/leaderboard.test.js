import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getLeaderboard, addEntry, clearLeaderboard, getTopN, getRankEmoji } from '../js/leaderboard.js';

describe('leaderboard', () => {
  beforeEach(() => {
    // Mock localStorage
    const store = {};
    vi.stubGlobal('localStorage', {
      getItem(key) { return store[key] || null; },
      setItem(key, value) { store[key] = value.toString(); },
      removeItem(key) { delete store[key]; },
      clear() { Object.keys(store).forEach(k => delete store[k]); }
    });
    clearLeaderboard();
  });

  it('returns empty leaderboard initially', () => {
    expect(getLeaderboard()).toEqual([]);
  });

  it('addEntry adds an entry correctly', () => {
    addEntry('Alice', 100, 10);
    const board = getLeaderboard();
    expect(board.length).toBe(1);
    expect(board[0].name).toBe('Alice');
    expect(board[0].score).toBe(100);
    expect(board[0].questionsAnswered).toBe(10);
    expect(board[0].date).toBeTruthy();
  });

  it('entries are sorted by score descending', () => {
    addEntry('Alice', 150, 10);
    addEntry('Bob', 300, 10);
    addEntry('Charlie', 200, 10);

    const board = getLeaderboard();
    expect(board[0].name).toBe('Bob');
    expect(board[1].name).toBe('Charlie');
    expect(board[2].name).toBe('Alice');
  });

  it('getTopN returns correct count', () => {
    addEntry('A', 10, 5);
    addEntry('B', 20, 5);
    addEntry('C', 30, 5);

    const top2 = getTopN(2);
    expect(top2.length).toBe(2);
    expect(top2[0].name).toBe('C');
    expect(top2[1].name).toBe('B');
  });

  it('getTopN with n > entries returns all entries', () => {
    addEntry('A', 10, 5);
    const top5 = getTopN(5);
    expect(top5.length).toBe(1);
  });

  it('getRankEmoji returns string ranks', () => {
    expect(getRankEmoji(1)).toBe('1');
    expect(getRankEmoji(2)).toBe('2');
    expect(getRankEmoji(3)).toBe('3');
  });

  it('getRankEmoji returns number string for rank 4+', () => {
    expect(getRankEmoji(4)).toBe('4');
    expect(getRankEmoji(10)).toBe('10');
  });

  it('clearLeaderboard empties the list', () => {
    addEntry('A', 10, 5);
    addEntry('B', 20, 5);
    clearLeaderboard();
    expect(getLeaderboard()).toEqual([]);
  });
});
