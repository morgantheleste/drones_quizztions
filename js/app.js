import { $, $$, delay, createElement, shuffleArray } from './utils.js';
import { Timer } from './timer.js';
import { addEntry, getTopN, getRankEmoji, getLeaderboard } from './leaderboard.js';
import { QuizEngine } from './quiz.js';
import { getDifficultyLabel, getDifficultyColor } from './scoring.js';

let quiz;
let timer;
let username = '';

// ─── Screen Management ───────────────────────────────────────────

function showScreen(screenId) {
  $$('.screen').forEach((el) => {
    el.classList.remove('active');
    el.classList.remove('fade-in');
  });
  const screen = $(`#screen-${screenId}`);
  if (screen) {
    screen.classList.add('active', 'fade-in');
  }
}

// ─── Leaderboard Preview (Welcome Screen) ─────────────────────

function renderLeaderboardPreview() {
  const container = $('#leaderboard-preview');
  if (!container) return;

  const top3 = getTopN(3);
  if (top3.length === 0) {
    container.innerHTML = '<p class="text-muted" style="text-align:center; margin-top:1rem; color:var(--text-muted);">No scores yet — be the first!</p>';
    return;
  }

  let html = '<h3 style="text-align:center; margin-bottom:0.5rem; font-size:1rem; color:var(--text-muted);">🏆 Top Scores</h3>';
  html += '<div class="leaderboard">';
  top3.forEach((entry, idx) => {
    const rankClass = idx < 3 ? `rank-${idx + 1}` : '';
    html += `
      <div class="leaderboard-item">
        <span class="rank ${rankClass}">${getRankEmoji(idx + 1)}</span>
        <span class="player-name arcade-name">${escapeHtml(entry.name).toUpperCase()}</span>
        <span class="player-score">${entry.score}</span>
      </div>`;
  });
  html += '</div>';
  container.innerHTML = html;
}

// ─── Quiz Rendering ──────────────────────────────────────────────

function renderQuestion() {
  const q = quiz.getCurrentQuestion();
  if (!q) return;

  // Question counter
  const counterEl = $('#question-counter');
  if (counterEl) counterEl.textContent = `Question ${quiz.getQuestionNumber()} / ${quiz.getTotalQuestions()}`;

  // Progress bar
  const progressFill = $('#progress-fill');
  if (progressFill) {
    const pct = ((quiz.getQuestionNumber() - 1) / quiz.getTotalQuestions()) * 100;
    progressFill.style.width = `${pct}%`;
  }

  // Score
  const scoreDisplay = $('#score-display');
  if (scoreDisplay) scoreDisplay.textContent = `Score: ${quiz.getResults().totalScore}`;

  // Difficulty badge (neumorphic: colour conveyed via data-level, not a solid fill)
  const badge = $('#difficulty-badge');
  if (badge) {
    const level = q.difficulty || 1;
    badge.textContent = getDifficultyLabel(level);
    badge.dataset.level = level;
    badge.style.display = 'inline-flex';
  }

  // Image
  const imgContainer = $('#question-image-container');
  const imgEl = $('#question-image');
  if (imgContainer && imgEl) {
    if (q.image) {
      imgEl.src = q.image;
      imgEl.alt = 'Question image';
      imgContainer.style.display = 'block';
      imgContainer.classList.remove('hidden');
    } else {
      imgContainer.style.display = 'none';
    }
  }

  // Question text
  const textEl = $('#question-text');
  if (textEl) textEl.textContent = q.question;

  // Answers
  const answersContainer = $('#answers-container');
  if (answersContainer) {
    answersContainer.innerHTML = '';

    if (q.type === 'multiple_choice') {
      answersContainer.className = 'answers-container answers-grid';
      
      let optionsWithIndex = q.options.map((text, idx) => ({ text, idx }));
      optionsWithIndex = shuffleArray(optionsWithIndex);

      optionsWithIndex.forEach((opt) => {
        const btn = createElement('button', 'btn btn-answer', opt.text);
        btn.dataset.index = opt.idx;
        btn.addEventListener('click', () => handleAnswer(opt.idx, btn));
        answersContainer.appendChild(btn);
      });
    } else if (q.type === 'true_false') {
      answersContainer.className = 'answers-container answers-grid tf-mode';
      const btnTrue = createElement('button', 'btn btn-answer btn-true', 'True');
      btnTrue.addEventListener('click', () => handleAnswer(true, btnTrue));
      answersContainer.appendChild(btnTrue);

      const btnFalse = createElement('button', 'btn btn-answer btn-false', 'False');
      btnFalse.addEventListener('click', () => handleAnswer(false, btnFalse));
      answersContainer.appendChild(btnFalse);
    }
  }

  // Reset display for answers and explanation
  const explanationContainer = $('#explanation-container');
  if (answersContainer) {
    answersContainer.style.display = '';
  }
  if (explanationContainer) {
    explanationContainer.classList.add('hidden');
    explanationContainer.style.display = 'none';
  }

  // Hide feedback overlay
  const feedback = $('#feedback-overlay');
  if (feedback) {
    feedback.style.display = 'none';
    feedback.classList.add('hidden');
  }

  // Start timer
  const timeLimit = q.timeLimit || 30;
  const circumference = 2 * Math.PI * 54; // r=54

  // Hide streak on first render or keep it if streak persists
  const streakEl = $('#streak-display');
  if (streakEl && quiz.currentIndex === 0) {
    streakEl.classList.remove('active');
    streakEl.classList.add('hidden');
  }

  const timerFill = $('#timer-fill');
  if (timerFill) {
    timerFill.style.strokeDasharray = circumference;
    timerFill.style.strokeDashoffset = 0;
  }

  timer = new Timer(
    timeLimit,
    (remaining, progress) => {
      // Update timer text
      const timerText = $('#timer-text');
      if (timerText) timerText.textContent = Math.ceil(remaining);

      // Update SVG ring
      if (timerFill) {
        timerFill.style.strokeDashoffset = circumference * progress;

        // Color changes based on time
        if (progress > 0.75) {
          timerFill.style.stroke = 'var(--danger)';
        } else if (progress > 0.5) {
          timerFill.style.stroke = 'var(--warning)';
        } else {
          timerFill.style.stroke = 'var(--accent-cyan)';
        }
      }
    },
    () => {
      // Timer expired — auto-submit as wrong
      handleAnswer(null, null, true);
    }
  );
  timer.start();
}

// ─── Answer Handling ─────────────────────────────────────────────

let isHandlingAnswer = false;

async function handleAnswer(answer, btnEl, isTimeout = false) {
  if (isHandlingAnswer) return;
  isHandlingAnswer = true;

  if (timer) timer.stop();

  const q = quiz.getCurrentQuestion();

  // Disable all answer buttons
  $$('.btn-answer').forEach((btn) => (btn.disabled = true));

  const result = quiz.submitAnswer(answer);

  // Show feedback on clicked button
  if (btnEl) {
    if (result.correct) {
      btnEl.classList.add('correct');
    } else {
      btnEl.classList.add('incorrect');
    }
  }

  // Highlight the correct answer
  if (!result.correct) {
    if (q.type === 'multiple_choice') {
      const btns = $$('.btn-answer');
      btns.forEach((b) => {
        if (parseInt(b.dataset.index) === result.correctAnswer) {
          b.classList.add('correct');
        }
      });
    } else {
      $$('.btn-answer').forEach((b) => {
        if ((result.correctAnswer === true && b.classList.contains('btn-true')) ||
            (result.correctAnswer === false && b.classList.contains('btn-false'))) {
          b.classList.add('correct');
        }
      });
    }
  }

  // Show feedback overlay
  const feedbackOverlay = $('#feedback-overlay');
  const feedbackIcon = $('#feedback-icon');
  const feedbackText = $('#feedback-text');
  if (feedbackOverlay && feedbackIcon && feedbackText) {
    feedbackOverlay.style.display = 'flex';
    feedbackOverlay.classList.remove('hidden');
    if (isTimeout) {
      feedbackIcon.textContent = 'Time';
      feedbackText.textContent = 'Time\'s up!';
      feedbackOverlay.className = 'feedback-overlay feedback-timeout';
    } else if (result.correct) {
      feedbackIcon.textContent = 'Correct';
      const comboText = result.multiplier > 1 ? ` (Combo ${result.multiplier}x!)` : '';
      feedbackText.textContent = `+${result.pointsEarned} pts${comboText}`;
      feedbackOverlay.className = 'feedback-overlay feedback-correct';
    } else {
      feedbackIcon.textContent = 'Wrong';
      feedbackText.textContent = 'Wrong answer!';
      feedbackOverlay.className = 'feedback-overlay feedback-incorrect';
    }
  }

  // Update streak display
  const streakEl = $('#streak-display');
  if (streakEl) {
    if (result.streak > 1) {
      streakEl.textContent = `Combo: ${result.multiplier}x`;
      streakEl.classList.remove('hidden');
      streakEl.classList.add('active');
    } else {
      streakEl.classList.remove('active');
      streakEl.classList.add('hidden');
    }
  }

  // Update live score
  const scoreDisplay = $('#score-display');
  if (scoreDisplay) scoreDisplay.textContent = `Score: ${quiz.getResults().totalScore}`;

  await delay(1200);

  // Hide feedback overlay
  if (feedbackOverlay) {
    feedbackOverlay.classList.add('hidden');
    setTimeout(() => { feedbackOverlay.style.display = 'none'; }, 300);
  }

  // Show explanation
  const explanationContainer = $('#explanation-container');
  const explanationText = $('#explanation-text');
  const answersContainer = $('#answers-container');
  
  if (answersContainer) answersContainer.style.display = 'none';
  if (explanationContainer) {
    explanationText.textContent = q.explanation || "No explanation provided.";
    explanationContainer.style.display = 'block';
    // tiny delay for CSS transition
    setTimeout(() => explanationContainer.classList.remove('hidden'), 10);
  }
}

// ─── Results Screen ──────────────────────────────────────────────

function showResults() {
  showScreen('results');
  const results = quiz.getResults();

  // Animated score counter
  const scoreEl = $('#final-score');
  if (scoreEl) {
    let currentScore = 0;
    const targetScore = results.totalScore;
    const inc = Math.max(1, Math.floor(targetScore / 60));

    const animateScore = () => {
      currentScore += inc;
      if (currentScore >= targetScore) {
        scoreEl.textContent = targetScore;
      } else {
        scoreEl.textContent = currentScore;
        requestAnimationFrame(animateScore);
      }
    };
    requestAnimationFrame(animateScore);
  }

  // Stats
  const statCorrect = $('#stat-correct');
  if (statCorrect) statCorrect.textContent = `${results.correctCount} / ${results.totalQuestions}`;

  const statAccuracy = $('#stat-accuracy');
  if (statAccuracy) statAccuracy.textContent = `${results.percentage}%`;

  const statAvgTime = $('#stat-avg-time');
  if (statAvgTime) statAvgTime.textContent = `${results.avgTime}s`;

  // Update progress to 100%
  const progressFill = $('#progress-fill');
  if (progressFill) progressFill.style.width = '100%';

  // Save to leaderboard
  addEntry(username, results.totalScore, results.totalQuestions);

  // Render full leaderboard
  renderFullLeaderboard();
}

function renderFullLeaderboard() {
  const tbody = $('#leaderboard-full tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  const entries = getTopN(15);
  entries.forEach((entry, idx) => {
    const row = createElement('tr', '');
    const rankClass = idx < 3 ? `rank-${idx + 1}` : '';
    const dateObj = entry.date ? new Date(entry.date) : new Date();
    const dateStr = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')} - ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
    
    row.innerHTML = `
      <td><span class="rank ${rankClass}">${getRankEmoji(idx + 1)}</span></td>
      <td class="player-name arcade-name">${escapeHtml(entry.name).toUpperCase()}</td>
      <td class="arcade-date">${dateStr}</td>
      <td class="player-score" style="text-align: right;">${entry.score}</td>
    `;
    tbody.appendChild(row);
  });
}

// ─── Utility ─────────────────────────────────────────────────────

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─── Init ────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  showScreen('welcome');
  renderLeaderboardPreview();

  // Rules Modal
  const rulesBtn = $('#btn-rules');
  const rulesModal = $('#rules-modal');
  const rulesCloseBtn = $('#btn-close-rules');
  if (rulesBtn && rulesModal && rulesCloseBtn) {
    rulesBtn.addEventListener('click', () => {
      rulesModal.style.display = 'flex';
      // tiny delay to allow CSS transition
      setTimeout(() => rulesModal.classList.remove('hidden'), 10);
    });
    rulesCloseBtn.addEventListener('click', () => {
      rulesModal.classList.add('hidden');
      setTimeout(() => {
        rulesModal.style.display = 'none';
      }, 300); // match CSS transition duration
    });
  }

  // Next question button
  const nextBtn = $('#btn-next-question');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      isHandlingAnswer = false;
      if (quiz.nextQuestion()) {
        renderQuestion();
      } else {
        showResults();
      }
    });
  }

  // Start button
  const startBtn = $('#btn-start');
  if (startBtn) {
    startBtn.addEventListener('click', async () => {
      const inputEl = $('#input-username');
      if (inputEl) username = inputEl.value.trim();

      if (!username) {
        inputEl.style.borderColor = 'var(--danger)';
        inputEl.placeholder = 'Please enter your name!';
        inputEl.focus();
        return;
      }

      startBtn.disabled = true;
      startBtn.textContent = 'Loading...';

      try {
        const res = await fetch('/data/questions.json');
        const data = await res.json();
        let questions = data.questions || data;

        // Shuffle first, then sort by difficulty (Crescendo effect)
        questions = shuffleArray(questions);
        questions.sort((a, b) => (a.difficulty || 1) - (b.difficulty || 1));

        quiz = new QuizEngine(questions, { shuffle: false });
        quiz.start();
        showScreen('quiz');
        renderQuestion();
      } catch (e) {
        console.error('Failed to load questions:', e);
        alert('Failed to load questions. Please ensure /data/questions.json exists.');
      } finally {
        startBtn.disabled = false;
        startBtn.textContent = 'Start Quiz';
      }
    });
  }

  // Play again button
  const playAgainBtn = $('#btn-play-again');
  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', () => {
      showScreen('welcome');
      const inputEl = $('#input-username');
      if (inputEl) inputEl.value = '';
      renderLeaderboardPreview();
    });
  }

  // Share button
  const shareBtn = $('#btn-share');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const results = quiz ? quiz.getResults() : null;
      if (!results) return;

      const text = `QuizMaster — I scored ${results.totalScore} points! (${results.percentage}% accuracy)\nCan you beat my score?`;

      if (navigator.share) {
        try {
          await navigator.share({ title: 'QuizMaster Results', text, url: window.location.origin });
        } catch (e) {
          // User cancelled share
        }
      } else {
        await navigator.clipboard.writeText(text);
        shareBtn.textContent = 'Copied!';
        setTimeout(() => { shareBtn.textContent = 'Share Results'; }, 2000);
      }
    });
  }

  // Enter key on username input
  const inputEl = $('#input-username');
  if (inputEl) {
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const startBtn = $('#btn-start');
        if (startBtn) startBtn.click();
      }
    });
    inputEl.addEventListener('input', () => {
      inputEl.style.borderColor = '';
    });
  }
});
