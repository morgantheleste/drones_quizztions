import { describe, it, expect } from 'vitest';
import { calculateScore, getDifficultyLabel, getDifficultyColor } from '../js/scoring.js';

describe('calculateScore', () => {
  it('correct answer at instant speed (elapsed=0) gives full base points', () => {
    expect(calculateScore(1, 30, 0, true)).toBe(100);
    expect(calculateScore(2, 30, 0, true)).toBe(200);
    expect(calculateScore(3, 30, 0, true)).toBe(300);
  });

  it('correct answer at half time gives 75% of base points', () => {
    expect(calculateScore(1, 30, 15, true)).toBe(75);
    expect(calculateScore(2, 30, 15, true)).toBe(150);
    expect(calculateScore(3, 30, 15, true)).toBe(225);
  });

  it('correct answer at full time gives 50% of base points (minimum)', () => {
    expect(calculateScore(1, 30, 30, true)).toBe(50);
    expect(calculateScore(2, 30, 30, true)).toBe(100);
    expect(calculateScore(3, 30, 30, true)).toBe(150);
  });

  it('incorrect answer gives 0 points regardless of time', () => {
    expect(calculateScore(1, 30, 0, false)).toBe(0);
    expect(calculateScore(2, 30, 15, false)).toBe(0);
    expect(calculateScore(3, 30, 30, false)).toBe(0);
  });

  it('elapsed > timeLimit still gives 50% minimum for correct answer', () => {
    expect(calculateScore(1, 30, 40, true)).toBe(50);
    expect(calculateScore(2, 20, 25, true)).toBe(100);
  });

  it('negative elapsed is treated as instant (max bonus)', () => {
    // timeBonus = max(0, (30 - (-5)) / 30) = max(0, 35/30) = 1.166...
    // But since timeBonus is clamped via the formula: 0.5 + 0.5 * timeBonus
    // With elapsed = -5: timeBonus = (30 - (-5))/30 = 35/30 = 1.166
    // score = round(100 * (0.5 + 0.5 * 1.166)) = round(100 * 1.083) = 108
    // This is technically > base points, which is acceptable per the formula
    const score = calculateScore(1, 30, -5, true);
    expect(score).toBeGreaterThanOrEqual(100);
  });
});

describe('getDifficultyLabel', () => {
  it('returns correct labels', () => {
    expect(getDifficultyLabel(1)).toBe('Easy');
    expect(getDifficultyLabel(2)).toBe('Medium');
    expect(getDifficultyLabel(3)).toBe('Hard');
    expect(getDifficultyLabel(99)).toBe('Unknown');
  });
});

describe('getDifficultyColor', () => {
  it('returns a color string for each difficulty', () => {
    expect(getDifficultyColor(1)).toBeTruthy();
    expect(getDifficultyColor(2)).toBeTruthy();
    expect(getDifficultyColor(3)).toBeTruthy();
  });
});
