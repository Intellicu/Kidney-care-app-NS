// 60-Second Urine Dipstick Timer with Sound & Visual Ring
let timerInterval = null;
let timeLeft = 60;
let isTimerRunning = false;
const TOTAL_TIME = 60;
const CIRCUMFERENCE = 440; // 2 * PI * r (r=70)

function initTimer() {
  const circleProgress = document.getElementById('timerCircleProgress');
  const secondsDisplay = document.getElementById('timerSeconds');
  const startBtn = document.getElementById('timerStartBtn');
  const resetBtn = document.getElementById('timerResetBtn');

  if (!secondsDisplay) return;

  function setProgress(percent) {
    if (!circleProgress) return;
    const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;
    circleProgress.style.strokeDashoffset = offset;
    
    // Change color as it gets closer
    if (timeLeft <= 10) {
      circleProgress.style.stroke = '#ef4444'; // Red for final 10 sec
    } else if (timeLeft <= 25) {
      circleProgress.style.stroke = '#f59e0b'; // Amber
    } else {
      circleProgress.style.stroke = '#1b5e3c'; // Green
    }
  }

  function updateDisplay() {
    secondsDisplay.textContent = timeLeft;
    const percent = ((TOTAL_TIME - timeLeft) / TOTAL_TIME) * 100;
    setProgress(percent);
  }

  function playChime() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
      console.log('Audio chime not supported or muted:', e);
    }
  }

  window.toggleTimer = function() {
    if (isTimerRunning) {
      // Pause
      clearInterval(timerInterval);
      isTimerRunning = false;
      startBtn.innerHTML = '▶️ ' + (currentLang === 'hi' ? 'शुरू करें' : 'Start');
      startBtn.classList.remove('btn-danger');
      startBtn.classList.add('btn-primary');
    } else {
      // Start
      if (timeLeft <= 0) timeLeft = 60;
      isTimerRunning = true;
      startBtn.innerHTML = '⏸️ ' + (currentLang === 'hi' ? 'रोकें' : 'Pause');
      startBtn.classList.remove('btn-primary');
      startBtn.classList.add('btn-danger');

      timerInterval = setInterval(() => {
        timeLeft--;
        updateDisplay();

        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          isTimerRunning = false;
          playChime();
          startBtn.innerHTML = '▶️ ' + (currentLang === 'hi' ? 'पुनः शुरू करें' : 'Start Again');
          startBtn.classList.remove('btn-danger');
          startBtn.classList.add('btn-primary');

          // Highlight compare alert
          const resultAlert = document.getElementById('timerDoneAlert');
          if (resultAlert) {
            resultAlert.style.display = 'block';
            setTimeout(() => {
              resultAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
          }
        }
      }, 1000);
    }
  };

  window.resetTimer = function() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timeLeft = 60;
    updateDisplay();
    startBtn.innerHTML = '▶️ ' + (currentLang === 'hi' ? 'शुरू करें' : 'Start 60s');
    startBtn.classList.remove('btn-danger');
    startBtn.classList.add('btn-primary');
    const resultAlert = document.getElementById('timerDoneAlert');
    if (resultAlert) resultAlert.style.display = 'none';
  };

  updateDisplay();
}

document.addEventListener('DOMContentLoaded', initTimer);
