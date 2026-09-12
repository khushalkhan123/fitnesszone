/* =========================================================================
   FitZone Gym — Management System Demo
   All data lives in localStorage. No backend. Vanilla JS only.
   ========================================================================= */

/* -------------------------------------------------------------------------
   1. CONSTANTS
   ---------------------------------------------------------------------- */
const STORAGE_KEYS = {
  members: 'fz_members',
  payments: 'fz_payments',
  expenses: 'fz_expenses',
  seeded: 'fz_seeded_v2'
};

const PLANS = {
  'Monthly':           { fee: 3500,  days: 30  },
  '3 Months':          { fee: 9500,  days: 90  },
  '6 Months':          { fee: 18000, days: 180 },
  'Annual':            { fee: 32000, days: 365 },
  'Personal Training': { fee: 8000,  days: 30  }
};

const EXPENSE_CATEGORIES = [
  'Electricity', 'Water', 'Rent', 'Equipment', 'Maintenance',
  'Cleaning', 'Salaries', 'Internet', 'Marketing', 'Other'
];

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'JazzCash', 'Easypaisa', 'Card'];

const MALE_FIRST = ['Ahmed','Ali','Bilal','Usman','Hamza','Fahad','Zeeshan','Waqas','Adeel','Kamran',
  'Umer','Shahzaib','Faizan','Danish','Salman','Asad','Rizwan','Tariq','Junaid','Imran',
  'Naveed','Saad','Talha','Owais','Haris','Yasir','Sohaib','Rehan','Arsalan','Zain'];
const FEMALE_FIRST = ['Ayesha','Sana','Mahnoor','Hina','Sara','Zainab','Amna','Rabia','Iqra','Nida',
  'Mariam','Fatima','Sadia','Komal','Anum','Warda','Sidra','Laiba','Noor','Areeba'];
const LAST_NAMES = ['Khan','Ahmed','Malik','Butt','Sheikh','Qureshi','Raza','Hussain','Iqbal','Chaudhry',
  'Baig','Farooq','Siddiqui','Abbasi','Awan','Javed','Mahmood','Riaz','Saleem','Nawaz',
  'Aslam','Yousaf','Anwar','Latif','Hashmi'];

const CITIES_AREAS = ['DHA Phase 5','Gulberg','Bahria Town','Model Town','Johar Town','Clifton',
  'North Nazimabad','Faisal Town','Wapda Town','Cantt'];

/* -------------------------------------------------------------------------
   2. UTILITIES
   ---------------------------------------------------------------------- */
function pkr(amount) {
  const n = Math.round(Number(amount) || 0);
  return 'Rs. ' + n.toLocaleString('en-PK');
}

function fmtDate(d) {
  const date = (d instanceof Date) ? d : new Date(d);
  if (isNaN(date)) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function isoDate(d) {
  const date = (d instanceof Date) ? d : new Date(d);
  return date.toISOString().slice(0, 10);
}

function todayISO() { return isoDate(new Date()); }

function daysBetween(a, b) {
  const MS = 1000 * 60 * 60 * 24;
  return Math.round((new Date(b) - new Date(a)) / MS);
}

function addDays(d, days) {
  const date = new Date(d);
  date.setDate(date.getDate() + days);
  return date;
}

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }
function uid(prefix) { return prefix + '-' + Math.random().toString(36).slice(2, 9); }

function randomPhone() {
  const prefixes = ['300','301','302','303','304','305','310','311','312','320','321','333','345'];
  const p = pick(prefixes);
  const rest = String(randInt(1000000, 9999999));
  return `03${p.slice(1)}-${rest}`;
}

function randomCNIC() {
  return `${randInt(10000,99999)}-${randInt(1000000,9999999)}-${randInt(0,9)}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}

/* -------------------------------------------------------------------------
   3. DATA STORE
   ---------------------------------------------------------------------- */
const Store = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch (e) { return []; }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  members()  { return this.get(STORAGE_KEYS.members); },
  payments() { return this.get(STORAGE_KEYS.payments); },
  expenses() { return this.get(STORAGE_KEYS.expenses); },
  saveMembers(v)  { this.set(STORAGE_KEYS.members, v); },
  savePayments(v) { this.set(STORAGE_KEYS.payments, v); },
  saveExpenses(v) { this.set(STORAGE_KEYS.expenses, v); }
};

/* -------------------------------------------------------------------------
   4. SEEDING DEMO DATA (runs once)
   ---------------------------------------------------------------------- */
function seedDataIfNeeded() {
  if (localStorage.getItem(STORAGE_KEYS.seeded)) return;

  const members = [];
  const payments = [];
  const usedNames = new Set();
  const planNames = Object.keys(PLANS);
  const today = new Date();

  const MEMBER_COUNT = 68;

  for (let i = 0; i < MEMBER_COUNT; i++) {
    const isMale = Math.random() > 0.38;
    const first = isMale ? pick(MALE_FIRST) : pick(FEMALE_FIRST);
    const last = pick(LAST_NAMES);
    let fullName = `${first} ${last}`;
    let tries = 0;
    while (usedNames.has(fullName) && tries < 5) {
      fullName = `${first} ${last} ${randInt(2,9)}`;
      tries++;
    }
    usedNames.add(fullName);

    const planName = planNames[Math.floor(Math.pow(Math.random(), 1.3) * planNames.length)] || planNames[0];
    const plan = PLANS[planName];
    const joinDaysAgo = randInt(10, 420);
    const joinDate = addDays(today, -joinDaysAgo);

    // Decide payment situation
    const roll = Math.random();
    let statusBucket; // 'paid' | 'pending' | 'overdue'
    if (roll < 0.62) statusBucket = 'paid';
    else if (roll < 0.85) statusBucket = 'pending';
    else statusBucket = 'overdue';

    let nextPayment;
    if (statusBucket === 'paid') {
      nextPayment = addDays(today, randInt(8, plan.days > 60 ? 60 : plan.days - 2 || 10));
    } else if (statusBucket === 'pending') {
      nextPayment = addDays(today, randInt(0, 5));
    } else {
      nextPayment = addDays(today, -randInt(1, 25));
    }
    let lastPayment = addDays(nextPayment, -plan.days);
    if (lastPayment < joinDate) lastPayment = new Date(joinDate);

    // Active/inactive: mostly active, some inactive (long overdue or explicitly churned)
    const isActive = statusBucket === 'overdue' ? Math.random() > 0.4 : Math.random() > 0.07;

    const member = {
      id: uid('MEM'),
      name: fullName,
      fatherName: `${pick(LAST_NAMES)} ${pick(MALE_FIRST)}`,
      cnic: randomCNIC(),
      phone: randomPhone(),
      emergencyContact: randomPhone(),
      gender: isMale ? 'Male' : 'Female',
      dob: isoDate(addDays(today, -randInt(18*365, 45*365))),
      plan: planName,
      fee: plan.fee,
      joinDate: isoDate(joinDate),
      nextPayment: isoDate(nextPayment),
      status: isActive ? 'Active' : 'Inactive',
      paymentStatus: statusBucket === 'paid' ? 'Paid' : (statusBucket === 'pending' ? 'Pending' : 'Overdue'),
      notes: Math.random() > 0.85 ? pick([
        'Prefers evening slots.', 'Recovering from knee injury, avoid heavy squats.',
        'Interested in upgrading to Personal Training.', 'Referred by another member.',
        'Requested locker on ground floor.'
      ]) : '',
      area: pick(CITIES_AREAS)
    };
    members.push(member);

    // Build a short payment history walking backward from lastPayment
    let cursor = new Date(lastPayment);
    let cyclesLeft = randInt(1, 4);
    while (cursor >= joinDate && cyclesLeft > 0) {
      payments.push({
        id: uid('PAY'),
        memberId: member.id,
        memberName: member.name,
        amount: plan.fee,
        date: isoDate(cursor),
        method: pick(PAYMENT_METHODS),
        forPlan: planName
      });
      cursor = addDays(cursor, -plan.days);
      cyclesLeft--;
    }
  }

  Store.saveMembers(members);
  Store.savePayments(payments);

  // ---- Expenses ----
  const expenses = [];
  const addedByPool = ['Admin', 'Front Desk', 'Manager - Bilal', 'Owner'];
  const recurring = [
    { cat: 'Rent',        base: 75000, variance: 0 },
    { cat: 'Electricity', base: 22000, variance: 8000 },
    { cat: 'Water',       base: 4500,  variance: 1500 },
    { cat: 'Salaries',    base: 135000, variance: 10000 },
    { cat: 'Internet',    base: 4500,  variance: 500 }
  ];

  for (let m = 0; m < 5; m++) {
    const monthDate = addDays(today, -m * 30 - randInt(0, 3));
    recurring.forEach(r => {
      expenses.push({
        id: uid('EXP'),
        date: isoDate(addDays(monthDate, -randInt(0, 5))),
        description: r.cat === 'Salaries' ? 'Staff salaries for the month'
                    : r.cat === 'Rent' ? 'Gym floor monthly rent'
                    : `${r.cat} bill payment`,
        category: r.cat,
        amount: r.base + randInt(-r.variance, r.variance),
        method: r.cat === 'Salaries' ? 'Bank Transfer' : pick(['Cash','Bank Transfer','Easypaisa']),
        addedBy: pick(addedByPool)
      });
    });
  }

  const oneOffDescriptions = {
    'Equipment':   ['New dumbbell set (5-25kg)', 'Treadmill belt replacement', 'Repaired leg press machine', 'New yoga mats x20'],
    'Maintenance': ['AC servicing', 'Plumbing repair', 'Generator servicing', 'Flooring repair near squat rack'],
    'Cleaning':    ['Cleaning supplies restock', 'Deep cleaning service', 'Locker room sanitization'],
    'Marketing':   ['Instagram ad campaign', 'Banner printing for opening offer', 'Flyers distribution', 'Local FM radio ad'],
    'Other':       ['Water dispenser refill', 'Office stationery', 'Tea/refreshments for staff', 'Signboard repair']
  };
  for (let i = 0; i < 22; i++) {
    const cat = pick(Object.keys(oneOffDescriptions));
    expenses.push({
      id: uid('EXP'),
      date: isoDate(addDays(today, -randInt(0, 150))),
      description: pick(oneOffDescriptions[cat]),
      category: cat,
      amount: randInt(1500, cat === 'Equipment' ? 45000 : 18000),
      method: pick(PAYMENT_METHODS.filter(m => m !== 'Card')),
      addedBy: pick(addedByPool)
    });
  }

  Store.saveExpenses(expenses);
  localStorage.setItem(STORAGE_KEYS.seeded, '1');
}

/* -------------------------------------------------------------------------
   5. DERIVED / COMPUTED HELPERS
   ---------------------------------------------------------------------- */
function refreshMemberPaymentStatus(member) {
  const days = daysBetween(todayISO(), member.nextPayment);
  if (days < 0) member.paymentStatus = 'Overdue';
  else if (days <= 5) member.paymentStatus = 'Pending';
  else member.paymentStatus = 'Paid';
  return member;
}

function recomputeAllStatuses() {
  const members = Store.members().map(refreshMemberPaymentStatus);
  Store.saveMembers(members);
}

function monthKey(d) {
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
}

function getStats() {
  const members = Store.members();
  const payments = Store.payments();
  const expenses = Store.expenses();
  const now = new Date();
  const curKey = monthKey(now);

  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === 'Active').length;
  const inactiveMembers = totalMembers - activeMembers;

  const monthlyRevenue = payments
    .filter(p => monthKey(p.date) === curKey)
    .reduce((s, p) => s + Number(p.amount), 0);

  const monthlyExpenses = expenses
    .filter(e => monthKey(e.date) === curKey)
    .reduce((s, e) => s + Number(e.amount), 0);

  const netProfit = monthlyRevenue - monthlyExpenses;

  return { totalMembers, activeMembers, inactiveMembers, monthlyRevenue, monthlyExpenses, netProfit };
}

function last6MonthsLabelsAndData(items, dateField, amountField) {
  const now = new Date();
  const labels = [];
  const keys = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleString('en-US', { month: 'short' }));
    keys.push(monthKey(d));
  }
  const totals = keys.map(k => items.filter(it => monthKey(it[dateField]) === k)
    .reduce((s, it) => s + Number(it[amountField]), 0));
  return { labels, totals };
}

/* -------------------------------------------------------------------------
   6. TOASTS
   ---------------------------------------------------------------------- */
function toast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' };
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${escapeHtml(message)}</span>`;
  container.appendChild(el);
  requestAnimationFrame(() => el.classList.add('toast--show'));
  setTimeout(() => {
    el.classList.remove('toast--show');
    setTimeout(() => el.remove(), 250);
  }, 3200);
}

/* -------------------------------------------------------------------------
   7. CONFIRM DIALOG
   ---------------------------------------------------------------------- */
function confirmAction({ title, message, confirmText = 'Delete', danger = true }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay modal-overlay--show';
    overlay.innerHTML = `
      <div class="modal modal--small" role="dialog" aria-modal="true">
        <div class="modal__body modal__body--confirm">
          <div class="confirm-icon ${danger ? 'confirm-icon--danger' : ''}"><i class="fa-solid fa-triangle-exclamation"></i></div>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(message)}</p>
        </div>
        <div class="modal__footer">
          <button class="btn btn--ghost" data-act="cancel">Cancel</button>
          <button class="btn ${danger ? 'btn--danger' : 'btn--primary'}" data-act="confirm">${escapeHtml(confirmText)}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('[data-act="cancel"]').onclick = () => { overlay.remove(); resolve(false); };
    overlay.querySelector('[data-act="confirm"]').onclick = () => { overlay.remove(); resolve(true); };
    overlay.addEventListener('click', (e) => { if (e.target === overlay) { overlay.remove(); resolve(false); } });
  });
}

/* -------------------------------------------------------------------------
   8. MODAL HELPERS (generic open/close, forms are page-specific)
   ---------------------------------------------------------------------- */
function openModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.add('modal-overlay--show');
  document.body.classList.add('no-scroll');
}
function closeModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.remove('modal-overlay--show');
  document.body.classList.remove('no-scroll');
}
document.addEventListener('click', (e) => {
  if (e.target.classList && e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('modal-overlay--show');
    document.body.classList.remove('no-scroll');
  }
  if (e.target.closest('[data-close-modal]')) {
    const id = e.target.closest('[data-close-modal]').getAttribute('data-close-modal');
    closeModal(id);
  }
});

/* -------------------------------------------------------------------------
   9. SIDEBAR / SHELL BEHAVIOUR (shared across pages)
   ---------------------------------------------------------------------- */
function initShell() {
  // Mobile sidebar toggle
  const toggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const scrim = document.getElementById('sidebarScrim');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('sidebar--open');
      if (scrim) scrim.classList.toggle('scrim--show');
    });
  }
  if (scrim) {
    scrim.addEventListener('click', () => {
      sidebar.classList.remove('sidebar--open');
      scrim.classList.remove('scrim--show');
    });
  }

  // "Coming soon" nav items (Payments / Reports / Settings)
  document.querySelectorAll('[data-coming-soon]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      toast(`${link.getAttribute('data-coming-soon')} is coming soon in the full version.`, 'info');
    });
  });

  // Live clock / date
  const dateEl = document.getElementById('currentDate');
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
}

/* -------------------------------------------------------------------------
   10. TINY CANVAS CHART HELPERS (no external chart library)
   ---------------------------------------------------------------------- */
function drawBarChart(canvas, labelsA, seriesA, seriesB, colorA, colorB) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const W = rect.width, H = rect.height;
  ctx.clearRect(0, 0, W, H);

  const padL = 44, padB = 28, padT = 16, padR = 8;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const maxVal = Math.max(1, ...seriesA, ...(seriesB || []));
  const niceMax = Math.ceil(maxVal / 5000) * 5000 || maxVal;

  // grid lines
  ctx.strokeStyle = 'rgba(20,23,31,0.08)';
  ctx.fillStyle = 'rgba(20,23,31,0.45)';
  ctx.font = '11px Inter, sans-serif';
  ctx.lineWidth = 1;
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const y = padT + chartH - (chartH * i / steps);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(W - padR, y);
    ctx.stroke();
    const val = Math.round(niceMax * i / steps);
    ctx.fillText(val >= 1000 ? (val/1000) + 'k' : val, 4, y + 4);
  }

  const groups = labelsA.length;
  const groupW = chartW / groups;
  const barW = Math.min(18, groupW / (seriesB ? 3.2 : 2.2));

  labelsA.forEach((label, i) => {
    const cx = padL + groupW * i + groupW / 2;
    const hA = (seriesA[i] / niceMax) * chartH;
    ctx.fillStyle = colorA;
    roundRectPath(ctx, cx - (seriesB ? barW - 2 : barW/2), padT + chartH - hA, barW, hA, 3);
    ctx.fill();
    if (seriesB) {
      const hB = (seriesB[i] / niceMax) * chartH;
      ctx.fillStyle = colorB;
      roundRectPath(ctx, cx + 2, padT + chartH - hB, barW, hB, 3);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(20,23,31,0.55)';
    ctx.textAlign = 'center';
    ctx.fillText(label, cx, H - 8);
    ctx.textAlign = 'left';
  });
}

function drawLineChart(canvas, labels, series, color) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const W = rect.width, H = rect.height;
  ctx.clearRect(0, 0, W, H);

  const padL = 44, padB = 28, padT = 16, padR = 12;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const maxVal = Math.max(1, ...series);
  const niceMax = Math.ceil(maxVal / 5000) * 5000 || maxVal;

  ctx.strokeStyle = 'rgba(20,23,31,0.08)';
  ctx.fillStyle = 'rgba(20,23,31,0.45)';
  ctx.font = '11px Inter, sans-serif';
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const y = padT + chartH - (chartH * i / steps);
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    const val = Math.round(niceMax * i / steps);
    ctx.fillText(val >= 1000 ? (val/1000) + 'k' : val, 4, y + 4);
  }

  const stepX = chartW / (labels.length - 1 || 1);
  const points = series.map((v, i) => ({
    x: padL + stepX * i,
    y: padT + chartH - (v / niceMax) * chartH
  }));

  // area fill
  const grad = ctx.createLinearGradient(0, padT, 0, padT + chartH);
  grad.addColorStop(0, color + '33');
  grad.addColorStop(1, color + '02');
  ctx.beginPath();
  ctx.moveTo(points[0].x, padT + chartH);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length-1].x, padT + chartH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // line
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.stroke();

  // dots + labels
  ctx.fillStyle = color;
  points.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(20,23,31,0.55)';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i], p.x, H - 8);
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
  });
}

function roundRectPath(ctx, x, y, w, h, r) {
  if (h < 0) { y += h; h = Math.abs(h); }
  const rad = Math.min(r, w / 2, h / 2 || r);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

/* -------------------------------------------------------------------------
   11. STATUS BADGE HELPERS
   ---------------------------------------------------------------------- */
function statusBadge(status) {
  const map = {
    'Active': 'badge--success', 'Inactive': 'badge--danger',
    'Paid': 'badge--success', 'Pending': 'badge--warning', 'Overdue': 'badge--danger'
  };
  return `<span class="badge ${map[status] || ''}">${status}</span>`;
}

function initial(name) {
  return (name || '?').trim().split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase();
}

/* -------------------------------------------------------------------------
   12. BOOTSTRAP
   ---------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  seedDataIfNeeded();
  recomputeAllStatuses();
  initShell();

  const page = document.body.getAttribute('data-page');
  if (page === 'dashboard' && typeof initDashboard === 'function') initDashboard();
  if (page === 'members' && typeof initMembersPage === 'function') initMembersPage();
  if (page === 'expenses' && typeof initExpensesPage === 'function') initExpensesPage();
});

/* =========================================================================
   DASHBOARD PAGE
   ========================================================================= */
function initDashboard() {
  renderDashboardStats();
  renderDashboardCharts();
  renderRecentPayments();
  renderRecentExpenses();
  renderDueSoon();
  renderRecentMembers();
  renderReminders();
  bindQuickActions();
}

function renderDashboardStats() {
  const s = getStats();
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('statTotalMembers', s.totalMembers);
  set('statActiveMembers', s.activeMembers);
  set('statInactiveMembers', s.inactiveMembers);
  set('statMonthlyRevenue', pkr(s.monthlyRevenue));
  set('statMonthlyExpenses', pkr(s.monthlyExpenses));
  const profitEl = document.getElementById('statNetProfit');
  if (profitEl) {
    profitEl.textContent = pkr(s.netProfit);
    profitEl.classList.toggle('stat-negative', s.netProfit < 0);
  }
}

function renderDashboardCharts() {
  const payments = Store.payments();
  const expenses = Store.expenses();
  const rev = last6MonthsLabelsAndData(payments, 'date', 'amount');
  const exp = last6MonthsLabelsAndData(expenses, 'date', 'amount');
  drawBarChart(document.getElementById('chartRevenueExpenses'), rev.labels, rev.totals, exp.totals, '#FF7A1A', '#1C2129');
  drawLineChart(document.getElementById('chartMonthlyRevenue'), rev.labels, rev.totals, '#1F9D55');
}
window.addEventListener('resize', debounce(() => {
  if (document.body.getAttribute('data-page') === 'dashboard') renderDashboardCharts();
}, 200));

function debounce(fn, wait) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

function renderRecentPayments() {
  const el = document.getElementById('recentPaymentsList');
  if (!el) return;
  const payments = [...Store.payments()].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  if (!payments.length) {
    el.innerHTML = emptyState('fa-receipt', 'No payments yet', 'Recorded payments will show up here.');
    return;
  }
  el.innerHTML = payments.map(p => `
    <div class="list-row">
      <div class="list-row__avatar">${initial(p.memberName)}</div>
      <div class="list-row__main">
        <div class="list-row__title">${escapeHtml(p.memberName)}</div>
        <div class="list-row__sub">${escapeHtml(p.method)} · ${fmtDate(p.date)}</div>
      </div>
      <div class="list-row__value list-row__value--success">+${pkr(p.amount)}</div>
    </div>`).join('');
}

function renderRecentExpenses() {
  const el = document.getElementById('recentExpensesList');
  if (!el) return;
  const expenses = [...Store.expenses()].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  if (!expenses.length) {
    el.innerHTML = emptyState('fa-file-invoice-dollar', 'No expenses yet', 'Recorded expenses will show up here.');
    return;
  }
  el.innerHTML = expenses.map(e => `
    <div class="list-row">
      <div class="list-row__avatar list-row__avatar--muted"><i class="fa-solid ${categoryIcon(e.category)}"></i></div>
      <div class="list-row__main">
        <div class="list-row__title">${escapeHtml(e.description)}</div>
        <div class="list-row__sub">${escapeHtml(e.category)} · ${fmtDate(e.date)}</div>
      </div>
      <div class="list-row__value list-row__value--danger">-${pkr(e.amount)}</div>
    </div>`).join('');
}

function renderDueSoon() {
  const el = document.getElementById('dueSoonList');
  if (!el) return;
  const members = Store.members()
    .filter(m => m.status === 'Active' && daysBetween(todayISO(), m.nextPayment) <= 5)
    .sort((a,b) => new Date(a.nextPayment) - new Date(b.nextPayment))
    .slice(0, 6);
  if (!members.length) {
    el.innerHTML = emptyState('fa-circle-check', 'All caught up', 'No members have fees due in the next few days.');
    return;
  }
  el.innerHTML = members.map(m => {
    const days = daysBetween(todayISO(), m.nextPayment);
    const label = days < 0 ? `${Math.abs(days)}d overdue` : (days === 0 ? 'Due today' : `Due in ${days}d`);
    return `
    <div class="list-row">
      <div class="list-row__avatar">${initial(m.name)}</div>
      <div class="list-row__main">
        <div class="list-row__title">${escapeHtml(m.name)}</div>
        <div class="list-row__sub">${escapeHtml(m.plan)} · ${pkr(m.fee)}</div>
      </div>
      <div class="list-row__value ${days < 0 ? 'list-row__value--danger' : 'list-row__value--warning'}">${label}</div>
    </div>`;
  }).join('');
}

function renderRecentMembers() {
  const el = document.getElementById('recentMembersList');
  if (!el) return;
  const members = [...Store.members()].sort((a,b) => new Date(b.joinDate) - new Date(a.joinDate)).slice(0, 6);
  el.innerHTML = members.map(m => `
    <div class="list-row">
      <div class="list-row__avatar">${initial(m.name)}</div>
      <div class="list-row__main">
        <div class="list-row__title">${escapeHtml(m.name)}</div>
        <div class="list-row__sub">${escapeHtml(m.plan)} · joined ${fmtDate(m.joinDate)}</div>
      </div>
      ${statusBadge(m.status)}
    </div>`).join('');
}

function renderReminders() {
  const el = document.getElementById('remindersList');
  if (!el) return;
  const members = Store.members();
  const overdue = members.filter(m => m.paymentStatus === 'Overdue' && m.status === 'Active').length;
  const dueSoon = members.filter(m => m.paymentStatus === 'Pending' && m.status === 'Active').length;
  const items = [];
  if (overdue > 0) items.push({ icon: 'fa-triangle-exclamation', tone: 'danger', text: `${overdue} member${overdue>1?'s':''} ${overdue>1?'have':'has'} overdue payments.` });
  if (dueSoon > 0) items.push({ icon: 'fa-bell', tone: 'warning', text: `${dueSoon} member${dueSoon>1?'s':''} due for payment within 5 days.` });
  items.push({ icon: 'fa-circle-info', tone: 'info', text: 'Monthly expense report is ready to review in Reports (coming soon).' });
  el.innerHTML = items.map(i => `
    <div class="reminder reminder--${i.tone}">
      <i class="fa-solid ${i.icon}"></i><span>${i.text}</span>
    </div>`).join('');
}

function categoryIcon(cat) {
  const map = {
    Electricity: 'fa-bolt', Water: 'fa-faucet', Rent: 'fa-building',
    Equipment: 'fa-dumbbell', Maintenance: 'fa-screwdriver-wrench', Cleaning: 'fa-broom',
    Salaries: 'fa-money-check-dollar', Internet: 'fa-wifi', Marketing: 'fa-bullhorn', Other: 'fa-ellipsis'
  };
  return map[cat] || 'fa-ellipsis';
}

function emptyState(icon, title, sub) {
  return `<div class="empty-state">
    <div class="empty-state__icon"><i class="fa-solid ${icon}"></i></div>
    <div class="empty-state__title">${title}</div>
    <div class="empty-state__sub">${sub}</div>
  </div>`;
}

function bindQuickActions() {
  const addBtn = document.getElementById('qaAddMember');
  const payBtn = document.getElementById('qaRecordPayment');
  const expBtn = document.getElementById('qaAddExpense');
  if (addBtn) addBtn.addEventListener('click', () => { window.location.href = 'members.html?action=add'; });
  if (payBtn) payBtn.addEventListener('click', () => { window.location.href = 'members.html?action=pay'; });
  if (expBtn) expBtn.addEventListener('click', () => { window.location.href = 'expenses.html?action=add'; });
}

/* =========================================================================
   MEMBERS PAGE
   ========================================================================= */
let membersFilterState = { search: '', status: 'all', payment: 'all', plan: 'all' };

function initMembersPage() {
  populatePlanSelects();
  renderMembersStats();
  renderMembersTable();
  bindMemberFilters();
  bindMemberModalEvents();

  const params = new URLSearchParams(window.location.search);
  if (params.get('action') === 'add') openMemberModal();
  if (params.get('action') === 'pay') toast('Pick a member below and click "Record Payment".', 'info');
}

function renderMembersStats() {
  const members = Store.members();
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('mStatTotal', members.length);
  set('mStatActive', members.filter(m => m.status === 'Active').length);
  set('mStatOverdue', members.filter(m => m.paymentStatus === 'Overdue').length);
  set('mStatPending', members.filter(m => m.paymentStatus === 'Pending').length);
}

function populatePlanSelects() {
  const filterSelect = document.getElementById('filterPlan');
  const formSelect = document.getElementById('formPlan');
  [filterSelect, formSelect].forEach(sel => {
    if (!sel) return;
    const isFilter = sel.id === 'filterPlan';
    sel.innerHTML = (isFilter ? '<option value="all">All Plans</option>' : '') +
      Object.keys(PLANS).map(p => `<option value="${p}">${p} — ${pkr(PLANS[p].fee)}</option>`).join('');
  });
  if (formSelect) {
    formSelect.addEventListener('change', () => {
      const fee = PLANS[formSelect.value]?.fee || '';
      const feeInput = document.getElementById('formFee');
      if (feeInput) feeInput.value = fee;
      autoSetNextPayment();
    });
  }
  const joinInput = document.getElementById('formJoinDate');
  if (joinInput) joinInput.addEventListener('change', autoSetNextPayment);
}

function autoSetNextPayment() {
  const planSel = document.getElementById('formPlan');
  const joinInput = document.getElementById('formJoinDate');
  const nextInput = document.getElementById('formNextPayment');
  if (!planSel || !joinInput || !nextInput || !joinInput.value) return;
  if (nextInput.dataset.userEdited === '1') return;
  const days = PLANS[planSel.value]?.days || 30;
  nextInput.value = isoDate(addDays(joinInput.value, days));
}

function bindMemberFilters() {
  const search = document.getElementById('memberSearch');
  const statusSel = document.getElementById('filterStatus');
  const paymentSel = document.getElementById('filterPayment');
  const planSel = document.getElementById('filterPlan');
  if (search) search.addEventListener('input', () => { membersFilterState.search = search.value.trim().toLowerCase(); renderMembersTable(); });
  if (statusSel) statusSel.addEventListener('change', () => { membersFilterState.status = statusSel.value; renderMembersTable(); });
  if (paymentSel) paymentSel.addEventListener('change', () => { membersFilterState.payment = paymentSel.value; renderMembersTable(); });
  if (planSel) planSel.addEventListener('change', () => { membersFilterState.plan = planSel.value; renderMembersTable(); });

  const addBtn = document.getElementById('addMemberBtn');
  if (addBtn) addBtn.addEventListener('click', () => openMemberModal());
}

function getFilteredMembers() {
  const { search, status, payment, plan } = membersFilterState;
  return Store.members().filter(m => {
    if (search && !(`${m.name} ${m.phone} ${m.cnic}`.toLowerCase().includes(search))) return false;
    if (status !== 'all' && m.status !== status) return false;
    if (payment !== 'all' && m.paymentStatus !== payment) return false;
    if (plan !== 'all' && m.plan !== plan) return false;
    return true;
  }).sort((a,b) => new Date(b.joinDate) - new Date(a.joinDate));
}

function renderMembersTable() {
  const tbody = document.getElementById('membersTableBody');
  const emptyWrap = document.getElementById('membersEmptyState');
  const table = document.getElementById('membersTable');
  if (!tbody) return;
  const list = getFilteredMembers();
  const countEl = document.getElementById('membersResultCount');
  if (countEl) countEl.textContent = `${list.length} member${list.length !== 1 ? 's' : ''}`;

  if (!list.length) {
    table.style.display = 'none';
    emptyWrap.style.display = 'flex';
    emptyWrap.innerHTML = emptyState('fa-user-slash', 'No members match your filters', 'Try adjusting search or filters, or add a new member.');
    return;
  }
  table.style.display = '';
  emptyWrap.style.display = 'none';

  tbody.innerHTML = list.map(m => `
    <tr>
      <td><span class="mono">${m.id}</span></td>
      <td>
        <div class="cell-person">
          <div class="list-row__avatar">${initial(m.name)}</div>
          <div>
            <div class="cell-person__name">${escapeHtml(m.name)}</div>
            <div class="cell-person__sub">${escapeHtml(m.gender)} · ${escapeHtml(m.area)}</div>
          </div>
        </div>
      </td>
      <td>${escapeHtml(m.phone)}</td>
      <td>${escapeHtml(m.plan)}</td>
      <td>${pkr(m.fee)}</td>
      <td>${fmtDate(m.joinDate)}</td>
      <td>${fmtDate(m.nextPayment)}</td>
      <td>${statusBadge(m.paymentStatus)}</td>
      <td>${statusBadge(m.status)}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" title="View" data-view="${m.id}"><i class="fa-solid fa-eye"></i></button>
          <button class="icon-btn" title="Record Payment" data-pay="${m.id}"><i class="fa-solid fa-money-bill-wave"></i></button>
          <button class="icon-btn" title="Edit" data-edit="${m.id}"><i class="fa-solid fa-pen"></i></button>
          <button class="icon-btn icon-btn--danger" title="Delete" data-delete="${m.id}"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('');

  tbody.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => viewMember(b.dataset.view)));
  tbody.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openMemberModal(b.dataset.edit)));
  tbody.querySelectorAll('[data-pay]').forEach(b => b.addEventListener('click', () => openPaymentModal(b.dataset.pay)));
  tbody.querySelectorAll('[data-delete]').forEach(b => b.addEventListener('click', () => handleDeleteMember(b.dataset.delete)));
}

/* ---- Add / Edit member modal ---- */
function openMemberModal(memberId) {
  const form = document.getElementById('memberForm');
  const title = document.getElementById('memberModalTitle');
  form.reset();
  document.getElementById('formNextPayment').dataset.userEdited = '0';
  if (memberId) {
    const m = Store.members().find(x => x.id === memberId);
    if (!m) return;
    title.textContent = 'Edit Member';
    form.dataset.editId = memberId;
    form.name.value = m.name;
    form.fatherName.value = m.fatherName;
    form.cnic.value = m.cnic;
    form.phone.value = m.phone;
    form.emergencyContact.value = m.emergencyContact;
    form.gender.value = m.gender;
    form.dob.value = m.dob;
    form.plan.value = m.plan;
    form.fee.value = m.fee;
    form.joinDate.value = m.joinDate;
    form.nextPayment.value = m.nextPayment;
    form.nextPayment.dataset.userEdited = '1';
    form.status.value = m.status;
    form.notes.value = m.notes || '';
  } else {
    title.textContent = 'Add New Member';
    delete form.dataset.editId;
    form.joinDate.value = todayISO();
    form.plan.value = 'Monthly';
    form.fee.value = PLANS['Monthly'].fee;
    form.status.value = 'Active';
    autoSetNextPayment();
  }
  openModal('memberModal');
}

function bindMemberModalEvents() {
  const form = document.getElementById('memberForm');
  if (!form) return;
  const nextInput = document.getElementById('formNextPayment');
  if (nextInput) nextInput.addEventListener('input', () => nextInput.dataset.userEdited = '1');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const editId = form.dataset.editId;
    let members = Store.members();

    if (editId) {
      members = members.map(m => m.id === editId ? { ...m, ...data, fee: Number(data.fee) } : m);
      toast('Member details updated.', 'success');
    } else {
      const newMember = {
        id: uid('MEM'), ...data, fee: Number(data.fee),
        paymentStatus: 'Pending', area: pick(CITIES_AREAS)
      };
      members.push(newMember);
      toast(`${data.name} added as a new member.`, 'success');
    }
    Store.saveMembers(members);
    recomputeAllStatuses();
    closeModal('memberModal');
    renderMembersStats();
    renderMembersTable();
  });

  const cancelBtn = document.getElementById('memberFormCancel');
  if (cancelBtn) cancelBtn.addEventListener('click', () => closeModal('memberModal'));
}

async function handleDeleteMember(id) {
  const m = Store.members().find(x => x.id === id);
  if (!m) return;
  const ok = await confirmAction({
    title: 'Delete this member?',
    message: `This will permanently remove ${m.name} and their payment history from the system.`,
    confirmText: 'Delete Member'
  });
  if (!ok) return;
  Store.saveMembers(Store.members().filter(x => x.id !== id));
  Store.savePayments(Store.payments().filter(p => p.memberId !== id));
  toast(`${m.name} was removed.`, 'success');
  renderMembersStats();
  renderMembersTable();
}

/* ---- View member modal ---- */
function viewMember(id) {
  const m = Store.members().find(x => x.id === id);
  if (!m) return;
  const body = document.getElementById('viewMemberBody');
  const history = Store.payments().filter(p => p.memberId === id).sort((a,b) => new Date(b.date)-new Date(a.date));
  body.innerHTML = `
    <div class="view-member">
      <div class="view-member__header">
        <div class="list-row__avatar list-row__avatar--lg">${initial(m.name)}</div>
        <div>
          <h3>${escapeHtml(m.name)}</h3>
          <div class="view-member__meta">${escapeHtml(m.plan)} · ${escapeHtml(m.phone)}</div>
        </div>
        <div class="view-member__badges">${statusBadge(m.status)} ${statusBadge(m.paymentStatus)}</div>
      </div>
      <div class="detail-grid">
        <div><span>Father / Guardian</span><strong>${escapeHtml(m.fatherName || '—')}</strong></div>
        <div><span>CNIC</span><strong>${escapeHtml(m.cnic || '—')}</strong></div>
        <div><span>Gender</span><strong>${escapeHtml(m.gender)}</strong></div>
        <div><span>Date of Birth</span><strong>${fmtDate(m.dob)}</strong></div>
        <div><span>Emergency Contact</span><strong>${escapeHtml(m.emergencyContact || '—')}</strong></div>
        <div><span>Monthly Fee</span><strong>${pkr(m.fee)}</strong></div>
        <div><span>Join Date</span><strong>${fmtDate(m.joinDate)}</strong></div>
        <div><span>Next Payment</span><strong>${fmtDate(m.nextPayment)}</strong></div>
      </div>
      ${m.notes ? `<div class="view-member__notes"><i class="fa-solid fa-note-sticky"></i> ${escapeHtml(m.notes)}</div>` : ''}
      <h4>Payment History</h4>
      <div class="mini-table-wrap">
        ${history.length ? `<table class="mini-table">
          <thead><tr><th>Date</th><th>Amount</th><th>Method</th></tr></thead>
          <tbody>${history.map(p => `<tr><td>${fmtDate(p.date)}</td><td>${pkr(p.amount)}</td><td>${escapeHtml(p.method)}</td></tr>`).join('')}</tbody>
        </table>` : `<p class="muted-note">No payment history recorded yet.</p>`}
      </div>
    </div>`;
  openModal('viewMemberModal');
}

/* ---- Record payment modal ---- */
function openPaymentModal(id) {
  const m = Store.members().find(x => x.id === id);
  if (!m) return;
  const form = document.getElementById('paymentForm');
  form.reset();
  form.dataset.memberId = id;
  document.getElementById('paymentMemberName').textContent = m.name;
  document.getElementById('paymentMemberPlan').textContent = `${m.plan} · Fee ${pkr(m.fee)}`;
  form.amount.value = m.fee;
  form.date.value = todayISO();
  openModal('paymentModal');
}

function bindPaymentFormOnce() {
  const form = document.getElementById('paymentForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = form.dataset.memberId;
    const members = Store.members();
    const m = members.find(x => x.id === id);
    if (!m) return;
    const data = Object.fromEntries(new FormData(form).entries());
    const payments = Store.payments();
    payments.push({
      id: uid('PAY'), memberId: id, memberName: m.name,
      amount: Number(data.amount), date: data.date, method: data.method, forPlan: m.plan
    });
    Store.savePayments(payments);

    const days = PLANS[m.plan]?.days || 30;
    m.nextPayment = isoDate(addDays(data.date, days));
    refreshMemberPaymentStatus(m);
    Store.saveMembers(members);

    closeModal('paymentModal');
    toast(`Payment of ${pkr(data.amount)} recorded for ${m.name}.`, 'success');
    renderMembersStats();
    renderMembersTable();
  });
  const cancelBtn = document.getElementById('paymentFormCancel');
  if (cancelBtn) cancelBtn.addEventListener('click', () => closeModal('paymentModal'));
}
document.addEventListener('DOMContentLoaded', bindPaymentFormOnce);

/* =========================================================================
   EXPENSES PAGE
   ========================================================================= */
let expensesFilterState = { search: '', category: 'all', method: 'all' };

function initExpensesPage() {
  populateExpenseCategorySelects();
  renderExpenseStats();
  renderExpensesTable();
  bindExpenseFilters();
  bindExpenseModalEvents();

  const params = new URLSearchParams(window.location.search);
  if (params.get('action') === 'add') openExpenseModal();
}

function populateExpenseCategorySelects() {
  const filterSel = document.getElementById('filterExpenseCategory');
  const formSel = document.getElementById('formExpenseCategory');
  if (filterSel) filterSel.innerHTML = '<option value="all">All Categories</option>' +
    EXPENSE_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
  if (formSel) formSel.innerHTML = EXPENSE_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
}

function renderExpenseStats() {
  const expenses = Store.expenses();
  const now = new Date();
  const curKey = monthKey(now);
  const todayStr = todayISO();
  const total = expenses.reduce((s,e) => s + Number(e.amount), 0);
  const thisMonth = expenses.filter(e => monthKey(e.date) === curKey).reduce((s,e) => s + Number(e.amount), 0);
  const today = expenses.filter(e => e.date === todayStr).reduce((s,e) => s + Number(e.amount), 0);
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('expTotal', pkr(total));
  set('expThisMonth', pkr(thisMonth));
  set('expToday', pkr(today));

  const byCat = {};
  EXPENSE_CATEGORIES.forEach(c => byCat[c] = 0);
  expenses.forEach(e => byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount));
  const catWrap = document.getElementById('expenseCategoryBreakdown');
  if (catWrap) {
    const maxCat = Math.max(1, ...Object.values(byCat));
    catWrap.innerHTML = Object.entries(byCat)
      .sort((a,b) => b[1]-a[1])
      .map(([cat, amt]) => `
        <div class="cat-bar-row">
          <div class="cat-bar-row__label"><i class="fa-solid ${categoryIcon(cat)}"></i>${cat}</div>
          <div class="cat-bar-row__track"><div class="cat-bar-row__fill" style="width:${(amt/maxCat*100).toFixed(1)}%"></div></div>
          <div class="cat-bar-row__value">${pkr(amt)}</div>
        </div>`).join('');
  }
}

function bindExpenseFilters() {
  const search = document.getElementById('expenseSearch');
  const catSel = document.getElementById('filterExpenseCategory');
  const methodSel = document.getElementById('filterExpenseMethod');
  if (search) search.addEventListener('input', () => { expensesFilterState.search = search.value.trim().toLowerCase(); renderExpensesTable(); });
  if (catSel) catSel.addEventListener('change', () => { expensesFilterState.category = catSel.value; renderExpensesTable(); });
  if (methodSel) methodSel.addEventListener('change', () => { expensesFilterState.method = methodSel.value; renderExpensesTable(); });

  const addBtn = document.getElementById('addExpenseBtn');
  if (addBtn) addBtn.addEventListener('click', () => openExpenseModal());
}

function getFilteredExpenses() {
  const { search, category, method } = expensesFilterState;
  return Store.expenses().filter(e => {
    if (search && !(`${e.description} ${e.addedBy}`.toLowerCase().includes(search))) return false;
    if (category !== 'all' && e.category !== category) return false;
    if (method !== 'all' && e.method !== method) return false;
    return true;
  }).sort((a,b) => new Date(b.date) - new Date(a.date));
}

function renderExpensesTable() {
  const tbody = document.getElementById('expensesTableBody');
  const emptyWrap = document.getElementById('expensesEmptyState');
  const table = document.getElementById('expensesTable');
  if (!tbody) return;
  const list = getFilteredExpenses();
  const countEl = document.getElementById('expensesResultCount');
  if (countEl) countEl.textContent = `${list.length} expense${list.length !== 1 ? 's' : ''}`;

  if (!list.length) {
    table.style.display = 'none';
    emptyWrap.style.display = 'flex';
    emptyWrap.innerHTML = emptyState('fa-file-invoice', 'No expenses found', 'Try adjusting filters, or add a new expense record.');
    return;
  }
  table.style.display = '';
  emptyWrap.style.display = 'none';

  tbody.innerHTML = list.map(e => `
    <tr>
      <td>${fmtDate(e.date)}</td>
      <td>
        <div class="cell-person">
          <div class="list-row__avatar list-row__avatar--muted"><i class="fa-solid ${categoryIcon(e.category)}"></i></div>
          <div class="cell-person__name">${escapeHtml(e.description)}</div>
        </div>
      </td>
      <td><span class="badge badge--neutral">${escapeHtml(e.category)}</span></td>
      <td class="amount-cell">${pkr(e.amount)}</td>
      <td>${escapeHtml(e.method)}</td>
      <td>${escapeHtml(e.addedBy)}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" title="Edit" data-edit-exp="${e.id}"><i class="fa-solid fa-pen"></i></button>
          <button class="icon-btn icon-btn--danger" title="Delete" data-delete-exp="${e.id}"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('');

  tbody.querySelectorAll('[data-edit-exp]').forEach(b => b.addEventListener('click', () => openExpenseModal(b.dataset.editExp)));
  tbody.querySelectorAll('[data-delete-exp]').forEach(b => b.addEventListener('click', () => handleDeleteExpense(b.dataset.deleteExp)));
}

function openExpenseModal(expenseId) {
  const form = document.getElementById('expenseForm');
  const title = document.getElementById('expenseModalTitle');
  form.reset();
  if (expenseId) {
    const e = Store.expenses().find(x => x.id === expenseId);
    if (!e) return;
    title.textContent = 'Edit Expense';
    form.dataset.editId = expenseId;
    form.date.value = e.date;
    form.description.value = e.description;
    form.category.value = e.category;
    form.amount.value = e.amount;
    form.method.value = e.method;
    form.addedBy.value = e.addedBy;
  } else {
    title.textContent = 'Add New Expense';
    delete form.dataset.editId;
    form.date.value = todayISO();
    form.addedBy.value = 'Admin';
  }
  openModal('expenseModal');
}

function bindExpenseModalEvents() {
  const form = document.getElementById('expenseForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const editId = form.dataset.editId;
    let expenses = Store.expenses();
    if (editId) {
      expenses = expenses.map(x => x.id === editId ? { ...x, ...data, amount: Number(data.amount) } : x);
      toast('Expense updated.', 'success');
    } else {
      expenses.push({ id: uid('EXP'), ...data, amount: Number(data.amount) });
      toast('New expense recorded.', 'success');
    }
    Store.saveExpenses(expenses);
    closeModal('expenseModal');
    renderExpenseStats();
    renderExpensesTable();
  });
  const cancelBtn = document.getElementById('expenseFormCancel');
  if (cancelBtn) cancelBtn.addEventListener('click', () => closeModal('expenseModal'));
}

async function handleDeleteExpense(id) {
  const e = Store.expenses().find(x => x.id === id);
  if (!e) return;
  const ok = await confirmAction({
    title: 'Delete this expense?',
    message: `This will permanently remove "${e.description}" (${pkr(e.amount)}) from your records.`,
    confirmText: 'Delete Expense'
  });
  if (!ok) return;
  Store.saveExpenses(Store.expenses().filter(x => x.id !== id));
  toast('Expense removed.', 'success');
  renderExpenseStats();
  renderExpensesTable();
}
