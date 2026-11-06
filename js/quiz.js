import { shuffleArray } from './utils.js';
import { calculateScore } from './scoring.js';

export class QuizEngine {
  constructor(questions = [], options = {}) {
    this.options = { shuffle: true, maxQuestions: null, ...options };
    this.allQuestions = [];
    this.questions = [];
    this.currentIndex = 0;
    this.totalScore = 0;
    this.streak = 0;
    this.questionResults = [];
    this.questionStartTime = null;
    this._answered = false;

    if (questions.length > 0) {
      this.loadQuestions(questions);
    }
  }

  loadQuestions(questionsArray) {
    // Validate questions
    this.allQuestions = questionsArray.map((q) => {
      if (!q.type || !q.question) {
        throw new Error(`Invalid question: missing type or question text (id: ${q.id})`);
      }
      if (q.type === 'multiple_choice' && (!Array.isArray(q.options) || q.options.length < 2)) {
        throw new Error(`Invalid MC question: options missing (id: ${q.id})`);
      }
      return { ...q };
    });
  }

  start() {
    let qList = [...this.allQuestions];
    if (this.options.shuffle) {
      qList = shuffleArray(qList);
    }
    if (this.options.maxQuestions && this.options.maxQuestions < qList.length) {
      qList = qList.slice(0, this.options.maxQuestions);
    }
    this.questions = qList;
    this.currentIndex = 0;
    this.totalScore = 0;
    this.streak = 0;
    this.questionResults = [];
    this._answered = false;
    this.questionStartTime = Date.now();
  }

  getCurrentQuestion() {
    if (this.currentIndex >= this.questions.length) return null;
    return this.questions[this.currentIndex];
  }

  getQuestionNumber() {
    return this.currentIndex + 1;
  }

  getTotalQuestions() {
    return this.questions.length > 0 ? this.questions.length : this.allQuestions.length;
  }

  submitAnswer(answer) {
    const q = this.getCurrentQuestion();
    if (!q) return { correct: false, correctAnswer: null, pointsEarned: 0 };

    const elapsed = (Date.now() - this.questionStartTime) / 1000;
    const timeLimit = q.timeLimit || 30;
    let isCorrect = false;
    let correctAnswer = q.correctAnswer;

    if (q.type === 'multiple_choice') {
      isCorrect = answer === correctAnswer;
    } else if (q.type === 'true_false') {
      isCorrect = answer === correctAnswer;
    }

    if (isCorrect) {
      this.streak++;
    } else {
      this.streak = 0;
    }

    const difficulty = q.difficulty || 1;
    let pointsEarned = calculateScore(difficulty, timeLimit, Math.min(elapsed, timeLimit), isCorrect);
    
    // Apply streak multiplier
    const multiplier = this.streak > 1 ? this.streak : 1;
    pointsEarned = pointsEarned * multiplier;
    
    this.totalScore += pointsEarned;
    this._answered = true;

    this.questionResults.push({
      question: q,
      userAnswer: answer,
      correctAnswer,
      isCorrect,
      pointsEarned,
      elapsed,
      streak: this.streak
    });

    return { correct: isCorrect, correctAnswer, pointsEarned, streak: this.streak, multiplier: this.streak > 1 ? this.streak : 1 };
  }

  nextQuestion() {
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
      this.questionStartTime = Date.now();
      this._answered = false;
      return true;
    }
    return false;
  }

  isComplete() {
    return this.questionResults.length >= this.questions.length;
  }

  getResults() {
    const correctCount = this.questionResults.filter((r) => r.isCorrect).length;
    let maxPossibleScore = 0;
    this.questions.forEach((q) => {
      const diff = q.difficulty || 1;
      maxPossibleScore += diff * 100;
    });
    const percentage = this.questions.length
      ? Math.round((correctCount / this.questions.length) * 100)
      : 0;
    const totalElapsed = this.questionResults.reduce((sum, r) => sum + r.elapsed, 0);
    const avgTime = this.questionResults.length
      ? Math.round(totalElapsed / this.questionResults.length * 10) / 10
      : 0;

    return {
      totalScore: this.totalScore,
      maxPossibleScore,
      percentage,
      correctCount,
      totalQuestions: this.questions.length,
      avgTime,
      questionResults: this.questionResults
    };
  }
}
