// 할 일은 이 기기의 브라우저(localStorage)에 날짜별로 저장됩니다.
const STORAGE_KEY = 'daily-todos-v1';

const $ = (id) => document.getElementById(id);
const titleEl = $('date-title');
const todayBtn = $('go-today');
const form = $('add-form');
const input = $('new-todo');
const list = $('todo-list');
const progress = $('progress');
const empty = $('empty');

let data = load();
let current = startOfDay(new Date());

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // 저장 공간이 없거나 막혀 있어도 앱은 계속 동작합니다.
  }
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dateKey(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function dateLabel(d) {
  const diff = Math.round((d - startOfDay(new Date())) / 86400000);
  const base = d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
  if (diff === 0) return `오늘 · ${base}`;
  if (diff === -1) return `어제 · ${base}`;
  if (diff === 1) return `내일 · ${base}`;
  return base;
}

function todos() {
  return data[dateKey(current)] || [];
}

function setTodos(items) {
  const key = dateKey(current);
  if (items.length) data[key] = items;
  else delete data[key];
  save();
  render();
}

function render() {
  const items = todos();
  titleEl.textContent = dateLabel(current);
  todayBtn.hidden = dateKey(current) === dateKey(new Date());

  list.innerHTML = '';
  items.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'todo' + (item.done ? ' done' : '');

    const check = document.createElement('button');
    check.className = 'check';
    check.textContent = item.done ? '✓' : '';
    check.setAttribute('aria-label', item.done ? '완료 취소' : '완료');
    check.addEventListener('click', () => {
      setTodos(todos().map((t) => (t.id === item.id ? { ...t, done: !t.done } : t)));
    });

    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = item.text;

    const del = document.createElement('button');
    del.className = 'delete';
    del.textContent = '✕';
    del.setAttribute('aria-label', '삭제');
    del.addEventListener('click', () => {
      if (confirm(`"${item.text}"을(를) 지울까요?`)) {
        setTodos(todos().filter((t) => t.id !== item.id));
      }
    });

    li.append(check, text, del);
    list.append(li);
  });

  const doneCount = items.filter((t) => t.done).length;
  empty.hidden = items.length > 0;
  progress.hidden = items.length === 0;
  progress.textContent = doneCount === items.length
    ? `🎉 ${items.length}개 모두 끝냈어요!`
    : `${items.length}개 중 ${doneCount}개 완료`;
}

function moveDay(offset) {
  current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + offset);
  render();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  setTodos([...todos(), { id: Date.now().toString(36), text, done: false }]);
  input.value = '';
  input.focus();
});

$('prev-day').addEventListener('click', () => moveDay(-1));
$('next-day').addEventListener('click', () => moveDay(1));
todayBtn.addEventListener('click', () => {
  current = startOfDay(new Date());
  render();
});

render();

// 오프라인에서도 열리도록 서비스 워커를 등록합니다.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
