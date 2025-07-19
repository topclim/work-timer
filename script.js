// تخزين البيانات
let sessions = [];
let isTracking = false;
let startTime = null;

// عناصر الواجهة
const toggleBtn = document.getElementById("toggle-button");
const liveTimer = document.getElementById("live-timer");
const totalTime = document.getElementById("total-time");
const logTableBody = document.getElementById("log-table-body");
const statusEl = document.getElementById("status");
const filterDateInput = document.getElementById("filter-date");

// مؤقت العرض المباشر
let liveInterval = null;

// تحميل البيانات السابقة
loadFromLocalStorage();
renderTable();
updateTotalTime();

const filterDateInput = document.getElementById("filter-date");

// تعيين تاريخ اليوم تلقائيًا عند التشغيل
const today = new Date().toISOString().split("T")[0];
filterDateInput.value = today;


// زر التشغيل/الإيقاف
toggleBtn.addEventListener("click", () => {
  if (!isTracking) {
    startTracking();
  } else {
    stopTracking();
  }
});

function startTracking() {
  startTime = new Date();
  isTracking = true;
  statusEl.textContent = "✅ جاري تسجيل الوقت...";
  toggleBtn.innerHTML = '<i class="fas fa-stop"></i> إيقاف العمل';
  startLiveTimer();
}

function stopTracking() {
  const endTime = new Date();
  if (!startTime) return;
  const duration = endTime - startTime;

  sessions.push({ start: startTime.toISOString(), end: endTime.toISOString(), duration });
  saveToLocalStorage();
  renderTable();
  updateTotalTime();

  isTracking = false;
  startTime = null;
  toggleBtn.innerHTML = '<i class="fas fa-play"></i> ابدأ العمل';
  statusEl.textContent = "🚦 توقفت عن العمل.";
  stopLiveTimer();
  liveTimer.textContent = "00:00:00";
}

function startLiveTimer() {
  liveInterval = setInterval(() => {
    if (startTime) {
      const now = new Date();
      const diff = now - startTime;
      liveTimer.textContent = formatDuration(diff);
    }
  }, 1000);
}

function stopLiveTimer() {
  clearInterval(liveInterval);
}

function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000);
  const hrs = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const mins = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const secs = String(totalSec % 60).padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
}

function updateTotalTime() {
  const total = sessions.reduce((acc, s) => acc + s.duration, 0);
  totalTime.textContent = formatDuration(total);
}

function renderTable() {
  logTableBody.innerHTML = "";

  // إذا فيه تاريخ محدد، فلتر السجلات حسبه
  const selectedDate = filterDateInput.value;
  const filteredSessions = selectedDate
    ? sessions.filter(s => {
        const date = new Date(s.start);
        return date.toISOString().split('T')[0] === selectedDate;
      })
    : sessions;

  filteredSessions.forEach(s => {
    const tr = document.createElement("tr");
    const tdStart = document.createElement("td");
    const tdEnd = document.createElement("td");
    const tdDuration = document.createElement("td");

    tdStart.textContent = new Date(s.start).toLocaleTimeString();
    tdEnd.textContent = new Date(s.end).toLocaleTimeString();
    tdDuration.textContent = formatDuration(s.duration);

    tr.append(tdStart, tdEnd, tdDuration);
    logTableBody.appendChild(tr);
  });

  // تحديث الوقت الإجمالي للنتائج المعروضة فقط
  const total = filteredSessions.reduce((acc, s) => acc + s.duration, 0);
  totalTime.textContent = formatDuration(total);
}


function saveToLocalStorage() {
  localStorage.setItem("work_sessions", JSON.stringify(sessions));
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem("work_sessions");
  if (saved) {
    sessions = JSON.parse(saved);
  }
}

// تصدير Excel
const exportBtn = document.getElementById("export-excel");
exportBtn.addEventListener("click", () => {
  const wb = XLSX.utils.book_new();
  const data = sessions.map(s => [
    new Date(s.start).toLocaleString(),
    new Date(s.end).toLocaleString(),
    formatDuration(s.duration)
  ]);

  const ws = XLSX.utils.aoa_to_sheet([
    ["وقت البدء", "وقت الانتهاء", "المدة"],
    ...data
  ]);
  XLSX.utils.book_append_sheet(wb, ws, "Work Log");
  XLSX.writeFile(wb, "work-log.xlsx");
});

// إرسال إلى Google Calendar عبر رابط مباشر
const sendCalBtn = document.getElementById("send-calendar");
sendCalBtn.addEventListener("click", () => {
  if (!sessions.length) {
    alert("لا يوجد أي جلسات مسجلة اليوم.");
    return;
  }

  const first = new Date(sessions[0].start);
  const last = new Date(sessions[sessions.length - 1].end);
  const total = sessions.reduce((acc, s) => acc + s.duration, 0);

  const startStr = first.toISOString().replace(/-|:|\.\d\d\d/g, "");
  const endStr = last.toISOString().replace(/-|:|\.\d\d\d/g, "");
  const summary = encodeURIComponent("ساعات العمل اليوم");
  const details = encodeURIComponent("المدة الكلية: " + formatDuration(total));

  const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${summary}&dates=${startStr}/${endStr}&details=${details}&ctz=Africa/Algiers`;

  window.open(url, "_blank");
});


filterDateInput.addEventListener("change", () => {
  renderTable(); // يعيد عرض الجدول حسب التاريخ المختار
});
