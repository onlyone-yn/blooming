// WORDS: [day, 영어, 한글 뜻] 목록 (words.js)
const $ = (id) => document.getElementById(id);
const DAYS = [...new Set(WORDS.map((w) => w[0]))].sort((a, b) => a - b);
const dayLabel = (d) => 'Day ' + String(d).padStart(2, '0');

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function show(id) {
  ['home', 'quiz', 'result', 'sheet'].forEach((s) => $(s).classList.toggle('hidden', s !== id));
  window.scrollTo(0, 0);
}

/* ---------- 시작 화면 ---------- */
function fillDays() {
  for (const sel of [$('dayFrom'), $('dayTo')]) {
    sel.innerHTML = DAYS.map((d) => `<option value="${d}">${dayLabel(d)}</option>`).join('');
  }
  $('dayFrom').value = DAYS[0];
  $('dayTo').value = DAYS[0];
}

function range() {
  let a = +$('dayFrom').value, b = +$('dayTo').value;
  if (a > b) [a, b] = [b, a];
  return [a, b];
}
function pool() {
  const [a, b] = range();
  return WORDS.filter((w) => w[0] >= a && w[0] <= b);
}
function rangeText() {
  const [a, b] = range();
  return a === b ? dayLabel(a) : `${dayLabel(a)} ~ ${dayLabel(b)}`;
}

function updateCount() {
  const n = pool().length;
  $('poolCount').textContent = n;
  $('count').max = n;
  const c = +$('count').value;
  $('countWarn').textContent = c > n ? `범위 안의 단어가 ${n}개라서 ${n}개만 출제돼요.` : '';
}

function wantedCount() {
  const n = pool().length;
  const c = Math.floor(+$('count').value) || 0;
  return Math.max(1, Math.min(c, n));
}

$('dayFrom').addEventListener('change', () => {
  if (+$('dayTo').value < +$('dayFrom').value) $('dayTo').value = $('dayFrom').value;
  updateCount();
});
$('dayTo').addEventListener('change', () => {
  if (+$('dayFrom').value > +$('dayTo').value) $('dayFrom').value = $('dayTo').value;
  updateCount();
});
$('count').addEventListener('input', updateCount);
document.querySelectorAll('.chip[data-n]').forEach((b) =>
  b.addEventListener('click', () => { $('count').value = b.dataset.n; updateCount(); })
);
$('allBtn').addEventListener('click', () => { $('count').value = pool().length; updateCount(); });

/* ---------- 바로 테스트 (객관식) ---------- */
let quiz = null;

function makeQuestion(word, distractorPool) {
  const answer = word[2];
  const others = shuffle(distractorPool.filter((w) => w[2] !== answer && w[1] !== word[1]));
  const choices = [];
  for (const w of others) {
    if (!choices.includes(w[2])) choices.push(w[2]);
    if (choices.length === 3) break;
  }
  return { word, options: shuffle([answer, ...choices]) };
}

function startQuiz(words) {
  // 오답 보기는 선택한 범위에서 고르고, 범위가 너무 작으면 전체 단어에서 고른다
  const p = pool();
  const distractors = p.length >= 8 ? p : WORDS;
  quiz = {
    questions: words.map((w) => makeQuestion(w, distractors)),
    i: 0,
    wrong: [],
    answered: false,
  };
  show('quiz');
  renderQuestion();
}

function renderQuestion() {
  const q = quiz.questions[quiz.i];
  const total = quiz.questions.length;
  quiz.answered = false;
  $('progressText').textContent = `${quiz.i + 1} / ${total}`;
  $('progressBar').style.width = (quiz.i / total) * 100 + '%';
  $('qWord').textContent = q.word[1];
  $('options').innerHTML = '';
  q.options.forEach((opt, k) => {
    const b = document.createElement('button');
    b.className = 'opt';
    b.innerHTML = `<span class="num">${k + 1}</span>`;
    b.append(opt);
    b.addEventListener('click', () => choose(k));
    $('options').append(b);
  });
  $('nextBtn').classList.add('hidden');
}

function choose(k) {
  if (quiz.answered) return;
  quiz.answered = true;
  const q = quiz.questions[quiz.i];
  const btns = [...$('options').children];
  const correctIdx = q.options.indexOf(q.word[2]);
  btns.forEach((b) => (b.disabled = true));
  btns[correctIdx].classList.add('correct');
  if (k !== correctIdx) {
    btns[k].classList.add('wrong');
    quiz.wrong.push({ word: q.word, picked: q.options[k] });
  }
  const last = quiz.i === quiz.questions.length - 1;
  $('nextBtn').textContent = last ? '결과 보기' : '다음 →';
  $('nextBtn').classList.remove('hidden');
  $('nextBtn').focus();
}

function next() {
  if (!quiz.answered) return;
  quiz.i++;
  if (quiz.i >= quiz.questions.length) showResult();
  else renderQuestion();
}
$('nextBtn').addEventListener('click', next);

document.addEventListener('keydown', (e) => {
  if ($('quiz').classList.contains('hidden')) return;
  if (['1', '2', '3', '4'].includes(e.key)) choose(+e.key - 1);
  else if (e.key === 'Enter' && quiz.answered) { e.preventDefault(); next(); }
});

$('quitQuiz').addEventListener('click', () => {
  if (confirm('테스트를 그만할까요?')) show('home');
});

function showResult() {
  const total = quiz.questions.length;
  const right = total - quiz.wrong.length;
  $('scoreBig').textContent = `${right} / ${total}`;
  $('scoreSub').textContent =
    `정답률 ${Math.round((right / total) * 100)}%` + (quiz.wrong.length ? '' : ' · 모두 맞혔어요! 🎉');
  $('wrongWrap').classList.toggle('hidden', quiz.wrong.length === 0);
  $('retryWrong').classList.toggle('hidden', quiz.wrong.length === 0);
  $('wrongList').innerHTML = '';
  for (const w of quiz.wrong) {
    const tr = document.createElement('tr');
    for (const t of [w.word[1], w.word[2], w.picked]) {
      const td = document.createElement('td');
      td.textContent = t;
      tr.append(td);
    }
    $('wrongList').append(tr);
  }
  show('result');
}

$('startTest').addEventListener('click', () => startQuiz(shuffle(pool()).slice(0, wantedCount())));
$('retryWrong').addEventListener('click', () => startQuiz(shuffle(quiz.wrong.map((w) => w.word))));
$('goHome').addEventListener('click', () => show('home'));

/* ---------- 시험지 만들기 ---------- */
const TEST_PER_PAGE = 50;   // 2단 x 25줄
const ANSWER_PER_PAGE = 60; // 2단 x 30줄

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function pageHead(kind, total, pageNo, pageCount) {
  const info = kind === 'test'
    ? `<span>이름 <span class="blank"></span></span><span>점수 <span class="blank"></span> / ${total}</span>`
    : `<span>${esc(rangeText())} · ${total}문항</span>`;
  return `
    <div class="page-head">
      <div class="title-row">
        <h3>Blooming VOCA Test</h3>
        <span class="tag">${kind === 'test' ? '시험지' : '답안지'}</span>
      </div>
      <div class="info-row">
        ${kind === 'test' ? `<span>${esc(rangeText())} · ${total}문항</span>` : ''}
        ${info}
      </div>
    </div>`;
}

function buildPages(words, kind) {
  const per = kind === 'test' ? TEST_PER_PAGE : ANSWER_PER_PAGE;
  const pages = chunk(words.map((w, i) => [i + 1, w]), per);
  return pages.map((items, p) => {
    const half = Math.ceil(per / 2);
    const cols = [items.slice(0, half), items.slice(half)];
    const colHtml = cols.map((c) => `<div class="col">${c.map(([n, w]) =>
      kind === 'test'
        ? `<div class="item"><span class="n">${n}.</span><span class="en">${esc(w[1])}</span></div>`
        : `<div class="ans-item"><span class="n">${n}.</span><span class="en">${esc(w[1])}</span><span class="ko">${esc(w[2])}</span></div>`
    ).join('')}</div>`).join('');
    return `<div class="page">
      ${pageHead(kind, words.length, p + 1, pages.length)}
      <div class="page-cols">${colHtml}</div>
      <div class="page-foot">${kind === 'test' ? '시험지' : '답안지'} ${p + 1} / ${pages.length}</div>
    </div>`;
  }).join('');
}

function makeSheet() {
  const words = shuffle(pool()).slice(0, wantedCount());
  $('pages').innerHTML = buildPages(words, 'test') + buildPages(words, 'answer');
  show('sheet');
}

$('makeSheet').addEventListener('click', makeSheet);
$('reshuffle').addEventListener('click', makeSheet);
$('printBtn').addEventListener('click', () => window.print());
$('sheetBack').addEventListener('click', () => show('home'));

fillDays();
updateCount();
