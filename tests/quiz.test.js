import { describe, it, expect, beforeEach } from 'vitest';
import { QuizEngine } from '../js/quiz.js';

const sampleQuestions = [
  {
    id: 1,
    type: 'multiple_choice',
    difficulty: 1,
    question: 'What is 2+2?',
    options: ['3', '4', '5', '6'],
    correctAnswer: 1,
    timeLimit: 10
  },
  {
    id: 2,
    type: 'true_false',
    difficulty: 2,
    question: 'The sky is blue.',
    correctAnswer: true,
    timeLimit: 10
  },
  {
    id: 3,
    type: 'multiple_choice',
    difficulty: 1,
    question: 'Capital of France?',
    options: ['London', 'Paris', 'Berlin', 'Rome'],
    correctAnswer: 1,
    timeLimit: 10
  }
];

describe('QuizEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new QuizEngine(sampleQuestions, { shuffle: false });
  });

  it('constructor creates engine with questions', () => {
    expect(engine.getTotalQuestions()).toBe(3);
  });

  it('start() resets state', () => {
    engine.start();
    expect(engine.getQuestionNumber()).toBe(1);
    expect(engine.getResults().totalScore).toBe(0);
    expect(engine.getResults().questionResults.length).toBe(0);
  });

  it('getCurrentQuestion returns first question after start', () => {
    engine.start();
    const q = engine.getCurrentQuestion();
    expect(q.id).toBe(1);
    expect(q.question).toBe('What is 2+2?');
  });

  it('getQuestionNumber returns 1-based index', () => {
    engine.start();
    expect(engine.getQuestionNumber()).toBe(1);
    engine.nextQuestion();
    expect(engine.getQuestionNumber()).toBe(2);
  });

  it('getTotalQuestions returns correct count', () => {
    engine.start();
    expect(engine.getTotalQuestions()).toBe(3);
  });

  it('submitAnswer with correct MC answer returns correct: true', () => {
    engine.start();
    const result = engine.submitAnswer(1); // correctAnswer is 1
    expect(result.correct).toBe(true);
    expect(result.pointsEarned).toBeGreaterThan(0);
  });

  it('submitAnswer with incorrect MC answer returns correct: false', () => {
    engine.start();
    const result = engine.submitAnswer(0); // wrong answer
    expect(result.correct).toBe(false);
    expect(result.pointsEarned).toBe(0);
  });

  it('submitAnswer with correct TF answer returns correct: true', () => {
    engine.start();
    engine.submitAnswer(1); // answer Q1
    engine.nextQuestion();
    const result = engine.submitAnswer(true); // correctAnswer is true
    expect(result.correct).toBe(true);
  });

  it('submitAnswer with incorrect TF answer returns correct: false', () => {
    engine.start();
    engine.submitAnswer(1); // answer Q1
    engine.nextQuestion();
    const result = engine.submitAnswer(false); // wrong
    expect(result.correct).toBe(false);
  });

  it('nextQuestion advances index', () => {
    engine.start();
    engine.submitAnswer(1);
    expect(engine.nextQuestion()).toBe(true);
    expect(engine.getQuestionNumber()).toBe(2);
  });

  it('nextQuestion returns false at the end', () => {
    engine.start();
    engine.submitAnswer(1);
    engine.nextQuestion();
    engine.submitAnswer(true);
    engine.nextQuestion();
    engine.submitAnswer(1);
    expect(engine.nextQuestion()).toBe(false);
  });

  it('isComplete returns true after all questions answered', () => {
    engine.start();
    expect(engine.isComplete()).toBe(false);

    engine.submitAnswer(1);
    engine.nextQuestion();
    engine.submitAnswer(true);
    engine.nextQuestion();
    engine.submitAnswer(1);

    expect(engine.isComplete()).toBe(true);
  });

  it('getResults returns correct summary', () => {
    engine.start();
    engine.submitAnswer(1); // correct
    engine.nextQuestion();
    engine.submitAnswer(false); // incorrect
    engine.nextQuestion();
    engine.submitAnswer(1); // correct

    const results = engine.getResults();
    expect(results.correctCount).toBe(2);
    expect(results.totalQuestions).toBe(3);
    expect(results.percentage).toBe(67); // 2/3 = 66.67 rounds to 67
    expect(results.totalScore).toBeGreaterThan(0);
    expect(results.questionResults.length).toBe(3);
  });

  it('shuffle option randomizes order', () => {
    let diffCount = 0;
    for (let i = 0; i < 20; i++) {
      const e = new QuizEngine(sampleQuestions, { shuffle: true });
      e.start();
      if (e.getCurrentQuestion().id !== 1) diffCount++;
    }
    // With 3 questions and 20 tries, probability of always getting id=1 first is (1/3)^20 ≈ 0
    expect(diffCount).toBeGreaterThan(0);
  });

  it('maxQuestions limits the number of questions', () => {
    const e = new QuizEngine(sampleQuestions, { shuffle: false, maxQuestions: 2 });
    e.start();
    expect(e.getTotalQuestions()).toBe(2);
  });

  it('submitting null answer (timeout) counts as incorrect', () => {
    engine.start();
    const result = engine.submitAnswer(null);
    expect(result.correct).toBe(false);
    expect(result.pointsEarned).toBe(0);
  });
});
