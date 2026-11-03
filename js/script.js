/* =========================================================
   1. DOM 요소 선택 (DOM Element Selection)
   ========================================================= */
const form = document.querySelector('.todo-form');     // 할 일 입력 Form 태그
const input = document.querySelector('.todo-input');   // 할 일 텍스트 입력창 (input)
const list = document.querySelector('.todo-list');     // <li> 항목들이 삽입될 <ul> 태그
const emptyMsg = document.querySelector('.empty-msg'); // 안내 메시지 요소
const countText = document.querySelector('.todo-count'); // "남은 할 일 N개" 요소
const clearBtn = document.querySelector('.clear-btn');   // 완료 항목 삭제 버튼
const nowTime = document.querySelector('.now-time');   // 현재 시간 표시 요소
const dueInput = document.querySelector('.todo-due-input');


/* 
  상수생성
*/
const STORAGE_KEY = 'todo-list-v2';
const HOUR = 60 * 60 * 1000;
const SAFE_HOURS = 24;
const UPGRADE_HOUR = 5;

/* 
  상수에 저장 및 호출
*/
function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function loadTodos() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === null) {
    return [];  // 처음 실행 : 빈목록으로 시작
  }

  try{
    const data = JSON.parse(saved);
    return Array.isArray(data) ? data : [];
  } 
  catch (error) 
  {
    return [];
  }
}

/* =========================================================
   2. 데이터 관리 (State Management)
   ========================================================= */
// let todos = [
//   { text: 'HTML 복습하기', done: true },
//   { text: '자바스크립트 배열 공부하기', done: false },
//   { text: 'To-do List 직접 만들어 보기', done: false }
// ];

let todos = loadTodos();

/* =========================================================
   3. 화면 렌더링 함수 (Render Function)
   ========================================================= */
function render() {
  list.innerHTML = '';

  todos.forEach((todo, index) => { 
    const li = document.createElement('li');
    li.classList.add('todo-item');
    
    if(todo.done) {
      li.classList.add('done');
    }

    //남은 시간에 따라 li에 safe, urgent, overdue 클래스를 붙인다.
    const status = getStatus(todo);
    if (status !== 'none') {
      li.classList.add(status);
    }

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = todo.done;
    
    check.addEventListener('change', () => {
      todos[index].done = check.checked;
      render();
      saveTodos();
    });

    const span = document.createElement('span');
    span.classList.add('todo-text');
    span.textContent = todo.text;

    //추가 글자와 마감 정보를 세로로 묶을 상자
    const body = document.createElement('div');
    body.classList.add('todo-body');
    body.appendChild(span);

    // 추가 완료 일시가 있는 항목에만 마감 안내 줄을 만든다.
    if (todo.due) {
      const dueLine = document.createElement('span');
      dueLine.classList.add('todo-due');

      //완료된 항목은 남은 시간을 보여 줄 필요가 없다.
      let info = forematDue(todo.due);

      if (!todo.done) {
        const remaining = getRemaining(todo);
        info += ' . ' + (remaining < 0 ? '기한이 지났습니다.' : fotmatRemaining(remaining));
      }

      const infoText = document.createElement('span');
      infoText.textContent = info;
      dueLine.appendChild(infoText);

      // 5시간 이내 일떄만 깜빡이는 아이콘 추가
      if (status === 'urgent') {
      const icon = document.createElement('span');
      icon.classList.add('blink-icon');
      icon.textContent = '🔴';
      dueLine.prepend(icon);
      }

      body.appendChild(dueLine);
    }

    //삭제버튼
    const delBtn = document.createElement('button');
    delBtn.classList.add('del-btn');
    delBtn.type = 'button';
    delBtn.textContent = '삭제';
    
    delBtn.addEventListener('click', () => {
      todos.splice(index, 1);
      render();
      saveTodos();
    });

    li.appendChild(check);
    li.appendChild(body);
    li.appendChild(delBtn);
    
    list.appendChild(li);
  });

  const remaining = todos.filter((todo) => todo.done === false).length;
  countText.textContent = '남은 할 일 ' + remaining + ' 개';

  if(todos.length === 0) {
    emptyMsg.classList.add('show');
  } else {
    emptyMsg.classList.remove('show');
  }
}

/* =========================================================
   4. 새로운 할 일 추가
   ========================================================= */
form.addEventListener('submit', (event) => {
  event.preventDefault(); 
  const text = input.value.trim();

  if(text === '') {
    input.focus();
    return;
  }

  const dueVal = dueInput ? dueInput.value : '';

  todos.push({ text: text, done: false, due: dueVal });
  input.value = '';
  if (dueInput) dueInput.value = ''; // 날짜 시간 입력창 비우기
  input.focus();

  saveTodos();
  render();
});

/* 
  날짜추가
*/
function forematDue(due) {
  const d = new Date(due);
  if (isNaN(d.getTime())) return '';
  const month = d.getMonth() + 1;
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return month + '/' + d.getDate() + ' ' + hours + ' : ' + minutes;
}

//현재 시간부터 완요 일시까지 남은 시간 계산(밀리초)
// 이미 지났으면 음수로 나ㅇ옴
function getRemaining(todo) {
  return new Date(todo.due).getTime() - Date.now();
}

//남은 밀리초 계산
function fotmatRemaining(remaining) {
  const totalMinutes = Math.floor(remaining/ 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return days + '일' + hours + '시간 남음';
  }
  if (hours > 0) {
    return hours + '시간' + minutes + '분 남음';
  }
  return minutes + '분 남음';
}

// 할 일의 남은 시간에 따라 글자 색 지정
function getStatus(todo) {
  if (todo.done || !todo.due) {
    return 'none';
  }

  const remaining = getRemaining(todo);
  if (remaining < 0) {
    return 'overdue';
  }
  if (remaining <= UPGRADE_HOUR * HOUR) {
    return 'urgent';
  }
  if (remaining <= SAFE_HOURS * HOUR) {
    return 'safe';
  }
  return 'none';
}

/* =========================================================
   5. 완료된 항목 일괄 삭제
   ========================================================= */
clearBtn.addEventListener('click', () => {
  todos = todos.filter((todo) => todo.done === false);
  saveTodos();
  render();
});

/* =========================================================
   6. 현재 시간 표시
   ========================================================= */
const days = ['일', '월', '화', '수', '목', '금', '토'];

function showNow() {
    const now = new Date();
    
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const day = days[now.getDay()];
    
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    
    if (nowTime) {
        nowTime.innerHTML = year + '년 ' + month + '월 ' + date + '일 (' + day + ') ' + 
        '<span class="clock">' + h + ":" + m + ":" + s + '</span>';
    }

    setInterval(showNow, 1000);
}

setInterval(render, 60 * 1000);

/* =========================================================
   7. 앱 초기 실행 및 1초 주기 시계 설정
   ========================================================= */
render();
showNow();
setInterval(showNow, 1000);