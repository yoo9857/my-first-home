// script.js: door.html의 움직임과 반응을 담당하는 JavaScript

// 사용자가 "움직임 줄이기"를 켰는지 확인
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const strength = 12; // 마우스 쪽으로 끌려가는 최대 거리(px)

// ===== 미니 MP3 플레이어 =====
const bgm = document.getElementById("bgm");
const player = document.getElementById("player");
const playBtn = document.getElementById("playBtn");
const stopBtn = document.getElementById("stopBtn");
const restartBtn = document.getElementById("restartBtn");
const muteBtn = document.getElementById("muteBtn");
const seek = document.getElementById("seek");
const curTime = document.getElementById("curTime");
const durTime = document.getElementById("durTime");
bgm.volume = 0.4; // 소리 크기 (0 ~ 1)

// 초(110.5) → "1:50" 모양으로 바꾸기
function formatTime(sec) {
  if (!isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ":" + String(s).padStart(2, "0");
}

// 재생/일시정지 버튼 모양을 지금 상태에 맞게
function updatePlayBtn() {
  const playing = !bgm.paused;
  playBtn.textContent = playing ? "⏸" : "▶";
  playBtn.setAttribute("aria-label", playing ? "일시정지" : "재생");
  player.classList.toggle("is-playing", playing); // 이퀄라이저 움직이기
}
bgm.addEventListener("play", updatePlayBtn);
bgm.addEventListener("pause", updatePlayBtn);

// 곡 길이를 알게 되면 표시
bgm.addEventListener("loadedmetadata", () => {
  durTime.textContent = formatTime(bgm.duration);
});
// 재생되는 동안 시간과 진행 막대 움직이기
bgm.addEventListener("timeupdate", () => {
  curTime.textContent = formatTime(bgm.currentTime);
  if (bgm.duration) seek.value = (bgm.currentTime / bgm.duration) * 100;
});
// 진행 막대를 끌면 그 위치로 이동
seek.addEventListener("input", () => {
  if (bgm.duration) bgm.currentTime = (seek.value / 100) * bgm.duration;
});

// ▶ / ⏸ 재생·일시정지
playBtn.addEventListener("click", () => {
  stopWaitingForTouch(); // 직접 조작했으니 "첫 터치 때 자동 시작"은 취소
  if (bgm.paused) bgm.play();
  else bgm.pause();
});
// ⏹ 정지 (멈추고 처음으로)
stopBtn.addEventListener("click", () => {
  stopWaitingForTouch();
  bgm.pause();
  bgm.currentTime = 0;
});
// ⏮ 처음부터
restartBtn.addEventListener("click", () => {
  stopWaitingForTouch();
  bgm.currentTime = 0;
});
// 🔊 / 🔇 음소거
muteBtn.addEventListener("click", () => {
  bgm.muted = !bgm.muted;
  muteBtn.textContent = bgm.muted ? "🔇" : "🔊";
  muteBtn.setAttribute("aria-label", bgm.muted ? "음소거 해제" : "음소거");
  muteBtn.setAttribute("aria-pressed", String(bgm.muted));
});

// 브라우저는 소리 자동재생을 막아요.
// 그래서 먼저 재생을 시도하고, 막히면 사용자가 화면을 처음 누를 때 시작해요.
function startOnFirstTouch(event) {
  if (player.contains(event.target)) return; // 플레이어 버튼은 위에서 따로 처리
  bgm.play().catch(() => {});
  stopWaitingForTouch();
}
function stopWaitingForTouch() {
  document.removeEventListener("pointerdown", startOnFirstTouch);
  document.removeEventListener("keydown", startOnFirstTouch);
}
bgm.play().catch(() => {
  document.addEventListener("pointerdown", startOnFirstTouch);
  document.addEventListener("keydown", startOnFirstTouch);
});

// ===== 홀로그램 프로필 사진 =====
const holo = document.getElementById("holo");
const pointer = { x: 0, y: 0, active: false };

// 마우스 위치를 사진 중심 기준 -1 ~ 1 로 바꾸기
holo.addEventListener("pointermove", (event) => {
  const box = holo.getBoundingClientRect(); // 기울지 않는 바깥 틀 기준이라 떨림이 없어요
  const clamp = (v) => Math.max(-1, Math.min(1, v));
  pointer.x = clamp((event.clientX - box.left - box.width / 2) / (box.width / 2));
  pointer.y = clamp((event.clientY - box.top - box.height / 2) / (box.height / 2));
  pointer.active = true;
});
holo.addEventListener("pointerleave", () => {
  pointer.active = false;
});

// 스프링: 목표 쪽으로 끌려가다 살짝 지나쳤다 돌아오는 자연스러운 움직임
function spring(s, target) {
  s.speed = (s.speed + (target - s.value) * 0.08) * 0.8;
  s.value += s.speed;
}

// "움직임 줄이기"를 켠 사용자는 기울기 없이 그대로 둬요
if (!reduceMotion) {
  const tiltX = { value: 0, speed: 0 };
  const tiltY = { value: 0, speed: 0 };
  let last = performance.now();
  let elapsed = 0;

  function loop(now) {
    const delta = Math.min(48, now - last);
    last = now;
    elapsed += delta;
    const t = elapsed / 1000;

    // 마우스가 없을 때는 천천히 흔들리며 반짝여요
    const targetX = pointer.active ? pointer.x : Math.sin(t * 0.9) * 0.6;
    const targetY = pointer.active ? pointer.y : Math.cos(t * 0.65) * 0.38;

    for (let i = 0; i < Math.max(1, Math.round(delta / 16.7)); i++) {
      spring(tiltX, targetX);
      spring(tiltY, targetY);
    }

    holo.style.setProperty("--tx", tiltX.value.toFixed(4));
    holo.style.setProperty("--ty", tiltY.value.toFixed(4));
    holo.style.setProperty("--hyp", Math.min(1, Math.hypot(tiltX.value, tiltY.value)).toFixed(4));
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

document.querySelectorAll(".glow-btn").forEach((btn) => {
  // 마우스가 버튼 위에서 움직일 때
  btn.addEventListener("pointermove", (event) => {
    const box = btn.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width; // 0(왼쪽) ~ 1(오른쪽)
    const y = (event.clientY - box.top) / box.height; // 0(위) ~ 1(아래)

    // 하이라이트를 마우스 위치로
    btn.style.setProperty("--mx", x * 100 + "%");
    btn.style.setProperty("--my", y * 100 + "%");

    // 버튼을 마우스 쪽으로 살짝 끌어오기
    if (!reduceMotion) {
      btn.style.transform = `translate(${(x - 0.5) * strength}px, ${(y - 0.5) * strength}px)`;
    }
  });

  // 마우스가 버튼을 떠나면 제자리로
  btn.addEventListener("pointerleave", () => {
    btn.style.transform = "";
  });

  // 클릭한 자리에서 물결 퍼지기
  btn.addEventListener("click", (event) => {
    if (reduceMotion) return;
    const inner = btn.querySelector(".glow-inner");
    const box = inner.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "glow-ripple";
    ripple.setAttribute("aria-hidden", "true");
    ripple.style.left = event.clientX - box.left + "px";
    ripple.style.top = event.clientY - box.top + "px";
    inner.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  });
});
