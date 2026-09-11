/* GAMBIT app — play vs bots, puzzles, rush, battle, drills, vision, learn, archive, insights */
"use strict";

/* ================= persistence ================= */
const TODAY = () => new Date().toISOString().slice(0, 10);
const THIS_MONTH = () => new Date().toISOString().slice(0, 7);

const DEFAULTS = {
  tier: "basic",
  ratings: { bullet: 800, blitz: 800, rapid: 800 },
  puzzleRating: 800, battleRating: 800,
  rushBest: 0, batBest: 0, seasonPts: 0, seasonMonth: THIS_MONTH(), winStreak: 0,
  streak: { last: null, count: 0 },
  dailyDone: null,
  limits: { date: null, puzzles: 0, rush: 0, battle: 0, review: 0 },
  coach: { month: null, used: 0 },
  firstDay: null,
  puzzlesSolved: 0, usedPuzzles: [],
  drillsDone: [], games: [],
  ratingHist: { bullet: [], blitz: [], rapid: [] },
  puzzleHist: [], visBest: 0, themesProg: {}
};
let S;
try { S = Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem("gambit_v1") || "{}")); }
catch (e) { S = { ...DEFAULTS }; }
S.limits = Object.assign({}, DEFAULTS.limits, S.limits);
S.ratings = Object.assign({}, DEFAULTS.ratings, S.ratings);
S.ratingHist = Object.assign({}, DEFAULTS.ratingHist, S.ratingHist);
S.settings = Object.assign({ pieces: "cburnett", board: "green" }, S.settings || {});
if (!S.firstDay) S.firstDay = TODAY();
function save() { localStorage.setItem("gambit_v1", JSON.stringify(S)); }

function resetDaily() {
  if (S.limits.date !== TODAY()) {
    S.limits = { date: TODAY(), puzzles: 0, rush: 0, battle: 0, review: 0 };
  }
  if (S.coach.month !== THIS_MONTH()) S.coach = { month: THIS_MONTH(), used: 0 };
  if (S.seasonMonth !== THIS_MONTH()) { S.seasonMonth = THIS_MONTH(); S.seasonPts = 0; S.winStreak = 0; }
  save();
}
resetDaily();

/* everything is free — no tiers, no daily limits */

function elo(mine, opp, score, K) {
  const exp = 1 / (1 + Math.pow(10, (opp - mine) / 400));
  return Math.round(K * (score - exp));
}

/* ================= tiny ui helpers ================= */
const $ = id => document.getElementById(id);
const GLYPH = { K:"♔",Q:"♕",R:"♖",B:"♗",N:"♘",P:"♙",k:"♚",q:"♛",r:"♜",b:"♝",n:"♞",p:"♟" };

let toastTimer = null;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("on"), 2600);
}
function openModal(id) { $(id).classList.add("on"); }
function closeModal(id) { $(id).classList.remove("on"); }

function uci(m) { return sqName(m.f) + sqName(m.t) + (m.pr || ""); }

/* ---- piece rendering & board themes ---- */
const ALL_BOARDS = [];
const PIECE_SETS = [
  { id: "cburnett", name: "Classic" },
  { id: "merida", name: "Merida" },
  { id: "glyph", name: "Minimal" }
];
const BOARD_THEMES = [
  { id: "green", name: "Tournament", l: "#e8dfc5", d: "#4e6b45" },
  { id: "walnut", name: "Walnut", l: "#f0d9b5", d: "#b58863" },
  { id: "ocean", name: "Ocean", l: "#dee3e6", d: "#8ca2ad" },
  { id: "charcoal", name: "Charcoal", l: "#d6d3ca", d: "#5c5c54" },
  { id: "rose", name: "Rosé", l: "#f2dede", d: "#b07c8b" }
];
function pieceNode(pc) {
  if (S.settings.pieces === "glyph") {
    const s = document.createElement("span");
    s.className = "pc " + (pc >= "A" && pc <= "Z" ? "w" : "b");
    s.textContent = GLYPH[pc];
    return s;
  }
  const img = document.createElement("img");
  img.className = "pcimg";
  img.draggable = false;
  img.alt = GLYPH[pc];
  const code = (pc >= "A" && pc <= "Z") ? "w" + pc : "b" + pc.toUpperCase();
  img.src = "pieces/" + S.settings.pieces + "/" + code + ".svg";
  return img;
}
function applyBoardTheme() {
  const t = BOARD_THEMES.find(x => x.id === S.settings.board) || BOARD_THEMES[0];
  document.documentElement.style.setProperty("--sq-light", t.l);
  document.documentElement.style.setProperty("--sq-dark", t.d);
}
function applyVisuals() {
  applyBoardTheme();
  ALL_BOARDS.forEach(b => { try { b.render(); } catch (e) {} });
}

/* promotion chooser */
let promoCb = null;
function choosePromo(side, cb) {
  promoCb = cb;
  const row = $("promo-row");
  row.innerHTML = "";
  for (const p of ["q","r","n","b"]) {
    const b = document.createElement("button");
    b.appendChild(pieceNode(side === "w" ? p.toUpperCase() : p));
    b.onclick = () => { closeModal("modal-promo"); const cb2 = promoCb; promoCb = null; cb2(p); };
    row.appendChild(b);
  }
  openModal("modal-promo");
}

/* ================= board widget ================= */
function Board(elId, opts) {
  opts = opts || {};
  const root = typeof elId === "string" ? $(elId) : elId;
  root.innerHTML = "";
  const el = document.createElement("div");
  el.className = "gboard";
  root.appendChild(el);
  const squares = [];
  for (let d = 0; d < 64; d++) {
    const sq = document.createElement("div");
    sq.dataset.d = d;
    el.appendChild(sq);
    squares.push(sq);
  }
  const B = {
    flipped: false, game: null, sel: -1, targets: [],
    movesProvider: null, onUserMove: null, rawClick: null, locked: true,
    last: null, extra: {}
  };
  function idxOf(d) { return B.flipped ? 63 - d : d; }
  function dOf(i) { return B.flipped ? 63 - i : i; }

  function render() {
    const g = B.game;
    let checkSq = -1;
    if (g && opts.showCheck !== false && g.inCheck(g.turn)) checkSq = g.kingSq(g.turn);
    for (let d = 0; d < 64; d++) {
      const i = idxOf(d), sq = squares[d];
      const f = i & 7, r = i >> 3;
      sq.className = "sq " + (((f + r) % 2 === 0) ? "l" : "d");
      sq.innerHTML = "";
      // coords on edges (display-relative)
      if (d >= 56) { const c = document.createElement("span"); c.className = "coord f"; c.textContent = "abcdefgh"[i & 7]; sq.appendChild(c); }
      if (d % 8 === 0) { const c = document.createElement("span"); c.className = "coord r"; c.textContent = 8 - (i >> 3); sq.appendChild(c); }
      const pc = g ? g.board[i] : null;
      if (pc && !opts.blank) sq.appendChild(pieceNode(pc));
      if (B.last && (B.last[0] === i || B.last[1] === i)) sq.classList.add("last");
      if (i === checkSq) sq.classList.add("chk");
      if (B.sel === i) sq.classList.add("sel");
      if (B.targets.some(m => m.t === i)) {
        const dot = document.createElement("span");
        dot.className = (g && g.board[i]) ? "ring" : "dot";
        sq.appendChild(dot);
      }
      if (B.extra[i]) sq.classList.add(B.extra[i]);
    }
  }

  el.addEventListener("click", e => {
    const sqEl = e.target.closest("[data-d]");
    if (!sqEl) return;
    const i = idxOf(+sqEl.dataset.d);
    if (B.rawClick) { B.rawClick(i); return; }
    if (B.locked || !B.game) return;
    const g = B.game;
    if (B.sel >= 0) {
      const cands = B.targets.filter(m => m.t === i);
      if (cands.length) {
        B.sel = -1; B.targets = [];
        if (cands.length > 1 && cands[0].pr) {
          choosePromo(g.turn, p => {
            const m = cands.find(c => c.pr === p);
            if (m && B.onUserMove) B.onUserMove(m);
          });
        } else if (B.onUserMove) B.onUserMove(cands[0]);
        render();
        return;
      }
      B.sel = -1; B.targets = [];
    }
    const pc = g.board[i];
    if (pc && g.sideOf(pc) === g.turn) {
      const all = B.movesProvider ? B.movesProvider() : [];
      const mine = all.filter(m => m.f === i);
      if (mine.length) { B.sel = i; B.targets = mine; }
    }
    render();
  });

  const api = {
    set(game, last) { B.game = game; B.last = last || null; B.sel = -1; B.targets = []; render(); },
    interactive(movesProvider, onUserMove) { B.movesProvider = movesProvider; B.onUserMove = onUserMove; B.locked = false; },
    lock() { B.locked = true; B.sel = -1; B.targets = []; render(); },
    unlock() { B.locked = false; },
    flip(v) { B.flipped = v; render(); },
    isFlipped() { return B.flipped; },
    mark(i, cls) { B.extra[i] = cls; render(); },
    clearMarks() { B.extra = {}; render(); },
    setRawClick(fn) { B.rawClick = fn; },
    render
  };
  ALL_BOARDS.push(api);
  return api;
}

/* ================= panels navigation ================= */
const PANELS = ["play","puzzles","rush","battle","drills","vision","learn","archive","insights","settings"];
function gotoPanel(p) {
  for (const id of PANELS) {
    $("panel-" + id).classList.toggle("on", id === p);
  }
  document.querySelectorAll(".snav").forEach(b => b.classList.toggle("on", b.dataset.p === p));
  if (p === "archive") renderArchive();
  if (p === "insights") renderInsights();
  if (p === "settings") renderSettings();
  if (p === "puzzles") refreshPuzzleStats();
  if (p === "battle") refreshBattleStats();
  if (p === "drills") renderDrills();
}
document.querySelectorAll(".snav").forEach(b => b.onclick = () => gotoPanel(b.dataset.p));

function refreshTopbar() {
  $("top-blitz").textContent = S.ratings.blitz;
  $("top-puzzle").textContent = S.puzzleRating;
}

/* ================= PLAY VS BOTS ================= */
const BOTS = [
  { id:"martin", name:"Martin", face:"♙", desc:"friendly beginner", elo:350, depth:1, jitter:400, rnd:.5 },
  { id:"anna", name:"Anna", face:"♗", desc:"casual player", elo:600, depth:1, jitter:150 },
  { id:"noor", name:"Noor", face:"♘", desc:"solid improver", elo:850, depth:1, qs:true, jitter:90 },
  { id:"coach", name:"Coach", face:"♕", desc:"explains its moves", elo:1000, depth:2, jitter:60, coach:true },
  { id:"isla", name:"Isla", face:"♖", desc:"positional grinder", elo:1150, depth:2, jitter:60 },
  { id:"viktor", name:"Viktor", face:"♞", desc:"attacking maniac", elo:1450, depth:2, qs:true, jitter:35, persona:"attack" },
  { id:"sofia", name:"Sofia", face:"♛", desc:"tournament regular", elo:1750, depth:3, jitter:20 },
  { id:"maximus", name:"Maximus", face:"♚", desc:"no mercy given", elo:2100, depth:3, qs:true, jitter:0 },
  { id:"nova", name:"GM Nova", face:"★", desc:"celebrity bot", elo:2350, depth:3, qs:true, jitter:0 },
  { id:"pixel", name:"Pixel", face:"☻", desc:"streamer bot", elo:1300, depth:2, jitter:80, persona:"attack" }
];
const TCS = [
  { label:"1|0", base:60, inc:0 }, { label:"2|1", base:120, inc:1 },
  { label:"3|0", base:180, inc:0 }, { label:"5|0", base:300, inc:0 },
  { label:"5|3", base:300, inc:3 }, { label:"10|0", base:600, inc:0 },
  { label:"15|10", base:900, inc:10 }, { label:"Casual", base:0, inc:0 }
];
function tcClass(tc) {
  if (!tc.base) return "casual";
  if (tc.base < 180) return "bullet";
  if (tc.base <= 600) return "blitz";
  return "rapid";
}

const setup = { bot: BOTS[3], tc: TCS[4], color: "w", variant: "standard" };

function renderBotGrid() {
  const grid = $("bots-grid");
  grid.innerHTML = "";
  for (const b of BOTS) {
    const card = document.createElement("div");
    card.className = "bot-card" + (setup.bot.id === b.id ? " sel" : "");
    card.innerHTML = `<div class="face">${b.face}</div><b>${b.name}</b><small>${b.elo} · ${b.desc}</small>`;
    card.onclick = () => {
      setup.bot = b;
      renderBotGrid();
      updateSetupNote();
    };
    grid.appendChild(card);
  }
}
function updateSetupNote() {
  let n = "";
  if (setup.bot.coach) n = "Coach explains every move it plays.";
  if (setup.variant === "960") n += " Chess960: castling is disabled in this demo mode.";
  $("setup-note").textContent = n;
}
function optRow(rowId, items, get, set) {
  const row = $(rowId);
  row.innerHTML = "";
  for (const it of items) {
    const b = document.createElement("button");
    b.className = "opt" + (get() === it.v ? " sel" : "");
    b.textContent = it.label;
    b.onclick = () => { set(it.v); optRow(rowId, items, get, set); updateSetupNote(); };
    row.appendChild(b);
  }
}
optRow("tc-row", TCS.map(t => ({ v: t, label: t.label })), () => setup.tc, v => setup.tc = v);
document.querySelectorAll("#color-row .opt").forEach(b => b.onclick = () => {
  document.querySelectorAll("#color-row .opt").forEach(x => x.classList.remove("sel"));
  b.classList.add("sel"); setup.color = b.dataset.v;
});
document.querySelectorAll("#var-row .opt").forEach(b => b.onclick = () => {
  document.querySelectorAll("#var-row .opt").forEach(x => x.classList.remove("sel"));
  b.classList.add("sel"); setup.variant = b.dataset.v; updateSetupNote();
});
renderBotGrid();

/* --- live game state --- */
const boardPlay = Board("board-play");
let G = null; // current game session
let clockInterval = null;

function stopClock() { if (clockInterval) { clearInterval(clockInterval); clockInterval = null; } }
function fmtClock(ms) {
  ms = Math.max(0, ms);
  const s = Math.ceil(ms / 1000);
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}
function renderClocks() {
  if (!G || !G.tc.base) return;
  for (const side of ["w", "b"]) {
    const el = G.clockEls[side];
    if (!el) continue;
    el.textContent = fmtClock(G.clock[side]);
    el.classList.toggle("on", !G.over && G.game.turn === side);
    el.classList.toggle("low", G.clock[side] < 15000);
  }
}
function startClock() {
  if (!G.tc.base) return;
  stopClock();
  G.lastT = Date.now();
  clockInterval = setInterval(() => {
    if (!G || G.over) { stopClock(); return; }
    const now = Date.now(), dt = now - G.lastT; G.lastT = now;
    if (G.moves.length >= 2) {
      G.clock[G.game.turn] -= dt;
      if (G.clock[G.game.turn] <= 0) {
        G.clock[G.game.turn] = 0;
        endGame(G.game.turn === G.mySide ? "l" : "w", "timeout");
        return;
      }
    }
    renderClocks();
  }, 120);
}

function startGame() {
  const mySide = setup.color === "r" ? (Math.random() < .5 ? "w" : "b") : setup.color;
  const startFen = setup.variant === "960" ? fen960() : START_FEN;
  const game = new Game(startFen);
  G = {
    game, bot: setup.bot, mySide, tc: setup.tc, variant: setup.variant,
    startFen, moves: [], over: false,
    checks: { w: 0, b: 0 },
    repMap: new Map([[game.key(), 1]]),
    clock: { w: setup.tc.base * 1000, b: setup.tc.base * 1000 },
    clockEls: {}
  };
  // player bars
  const botBar = `<div class="face">${G.bot.face}</div><div><b>${G.bot.name}</b><small>${G.bot.elo} · bot</small></div>`;
  const meBar = `<div class="face">☺</div><div><b>You</b><small>${G.tc.base ? S.ratings[tcClass(G.tc)] + " · " + tcClass(G.tc) : "casual"}</small></div>`;
  $("bar-top").innerHTML = botBar;
  $("bar-bottom").innerHTML = meBar;
  if (G.tc.base) {
    for (const [barId, side] of [["bar-top", mySide === "w" ? "b" : "w"], ["bar-bottom", mySide]]) {
      const c = document.createElement("div");
      c.className = "clock";
      $(barId).appendChild(c);
      G.clockEls[side] = c;
    }
  }
  $("checks-ui").style.display = G.variant === "3check" ? "" : "none";
  $("coach-bubble").style.display = "none";
  $("postgame").style.display = "none";
  $("game-status").textContent = "";
  $("play-setup").style.display = "none";
  $("play-game").style.display = "";
  boardPlay.flip(mySide === "b");
  boardPlay.set(game);
  boardPlay.interactive(
    () => (!G.over && G.game.turn === G.mySide) ? G.game.legalMoves() : [],
    m => playerMove(m)
  );
  renderMovelist();
  renderClocks();
  startClock();
  if (game.turn !== mySide) setTimeout(botMove, 500);
  if (G.bot.coach) coachSay(`Hi! I'm your Coach. I'll explain my moves as we play. You're ${mySide === "w" ? "White" : "Black"} — good luck!`);
}
$("btn-start-game").onclick = startGame;

function applyMove(m) {
  const g = G.game;
  const mover = g.turn;
  /* charge any time consumed since the last clock tick (sync engine search
     blocks the interval) to the side that was actually thinking */
  if (G.tc.base && G.moves.length >= 2) {
    const now = Date.now();
    G.clock[mover] -= now - G.lastT;
    G.lastT = now;
    if (G.clock[mover] <= 0) {
      G.clock[mover] = 0;
      endGame(mover === G.mySide ? "l" : "w", "timeout");
      return true;
    }
  } else if (G.tc.base) {
    G.lastT = Date.now();
  }
  const san = g.san(m);
  g.make(m);
  if (G.tc.inc && G.moves.length >= 1) G.clock[mover] += G.tc.inc * 1000;
  G.moves.push({ uci: uci(m), san });
  G.repMap.set(g.key(), (G.repMap.get(g.key()) || 0) + 1);
  if (g.inCheck(g.turn)) G.checks[mover]++;
  boardPlay.set(g, [m.f, m.t]);
  renderMovelist();
  renderChecks();
  renderClocks();
  const st = g.status({ variant: G.variant, checks: G.checks, repMap: G.repMap });
  if (st.over) {
    const res = st.result === "1/2-1/2" ? "d" : (st.result === "1-0") === (G.mySide === "w") ? "w" : "l";
    endGame(res, st.reason);
    return true;
  }
  return false;
}

function playerMove(m) {
  if (G.over || G.game.turn !== G.mySide) return;
  boardPlay.clearMarks();
  const over = applyMove(m);
  if (!over) {
    $("game-status").textContent = G.bot.name + " is thinking…";
    setTimeout(botMove, 260 + Math.random() * 500);
  }
}

function botMove() {
  if (!G || G.over || G.game.turn === G.mySide) return;
  const b = G.bot;
  let res = null;
  try {
    if (b.rnd && Math.random() < b.rnd) {
      const legal = G.game.legalMoves();
      // even weak bots take a free mate-in-1 sometimes, else random
      const mates = AI.matingMoves(G.game);
      const m = mates.length && Math.random() < .5 ? mates[0] : legal[Math.floor(Math.random() * legal.length)];
      res = { move: m };
    } else {
      AI.maxNodes = 45000;
      res = AI.bestMove(G.game, { depth: b.depth, qs: b.qs, jitter: b.jitter, persona: b.persona, repMap: G.repMap });
    }
  } catch (e) { console.error(e); }
  if (!res || !res.move) return;
  const explain = b.coach ? explainMove(G.game, res.move) : null;
  const over = applyMove(res.move);
  $("game-status").textContent = over ? "" : "Your move.";
  if (explain) coachSay(explain);
}

function coachSay(txt) {
  const el = $("coach-bubble");
  el.style.display = "";
  el.innerHTML = `<b>Coach:</b> ${txt}`;
}

function explainMove(g, m) {
  // called BEFORE the move is made
  const piece = g.board[m.f], t = piece.toLowerCase();
  const names = { p:"pawn", n:"knight", b:"bishop", r:"rook", q:"queen", k:"king" };
  const parts = [];
  const san = g.san(m);
  const victim = m.fl === "e" ? "p" : (g.board[m.t] ? g.board[m.t].toLowerCase() : null);
  g.make(m);
  const givesCheck = g.inCheck(g.turn);
  const isMate = givesCheck && g.legalMoves().length === 0;
  g.unmake();
  if (isMate) return `<b>${san}</b> — checkmate! Always look for forcing moves first.`;
  if (m.fl === "c") parts.push("I castled to tuck my king away safely and connect my rooks");
  else if (victim) parts.push(`I captured your ${names[victim]} — material matters`);
  else if (m.pr) parts.push("Promotion! A new queen usually decides the game");
  else if (givesCheck) parts.push("A check forces you to respond — forcing moves limit your options");
  else if ((t === "n" || t === "b") && (m.f >> 3 === 0 || m.f >> 3 === 7)) parts.push(`I developed my ${names[t]} toward the center — pieces need active squares`);
  else if (t === "p" && [27,28,35,36].includes(m.t)) parts.push("Central pawns stake a claim in the middle of the board");
  else if (t === "k") parts.push("King safety first — I'm improving my king's position");
  else parts.push(`I improved my ${names[t]}'s position — when nothing is forced, improve your worst piece`);
  return `<b>${san}</b> — ${parts[0]}.`;
}

function renderMovelist() {
  const el = $("movelist");
  el.innerHTML = "";
  for (let i = 0; i < G.moves.length; i += 2) {
    const no = document.createElement("span");
    no.className = "no"; no.textContent = (i / 2 + 1) + ".";
    el.appendChild(no);
    for (const j of [i, i + 1]) {
      const s = document.createElement("span");
      if (G.moves[j]) {
        s.textContent = G.moves[j].san;
        if (j === G.moves.length - 1) s.className = "cur";
      }
      el.appendChild(s);
    }
  }
  el.scrollTop = el.scrollHeight;
}
function renderChecks() {
  if (G.variant !== "3check") return;
  for (const [elId, side] of [["chk-me", G.mySide], ["chk-bot", G.mySide === "w" ? "b" : "w"]]) {
    const el = $(elId);
    el.innerHTML = "";
    for (let i = 0; i < 3; i++) {
      const s = document.createElement("span");
      if (i < G.checks[side]) s.className = "hit";
      el.appendChild(s);
    }
  }
}

function endGame(res, reason) {
  if (G.over) return;
  G.over = true;
  stopClock();
  boardPlay.lock();
  const cls = tcClass(G.tc);
  let delta = 0;
  if (cls !== "casual" && G.variant === "standard" && G.moves.length >= 2) {
    delta = elo(S.ratings[cls], G.bot.elo, res === "w" ? 1 : res === "d" ? .5 : 0, 24);
    S.ratings[cls] = Math.max(100, S.ratings[cls] + delta);
    S.ratingHist[cls].push({ t: Date.now(), v: S.ratings[cls] });
  }
  const entry = {
    ts: Date.now(), bot: G.bot.name, botFace: G.bot.face, color: G.mySide,
    tcLabel: G.tc.label, tcClass: cls, variant: G.variant,
    result: res, reason, moves: G.moves.map(m => m.uci), sans: G.moves.map(m => m.san),
    startFen: G.startFen, delta
  };
  S.games.unshift(entry);
  if (S.games.length > 120) S.games.length = 120;
  save();
  refreshTopbar();
  const msg = res === "w" ? "You won" : res === "l" ? G.bot.name + " won" : "Draw";
  $("res-title").textContent = res === "w" ? "Victory! ♛" : res === "l" ? "Defeat" : "Draw";
  $("res-sub").textContent = `${msg} — ${reason}.`;
  $("res-rating").textContent = delta ? (delta > 0 ? "+" : "") + delta + " " + cls : "";
  $("res-rating").style.color = delta > 0 ? "var(--green)" : delta < 0 ? "var(--red)" : "var(--ivory-dim)";
  $("postgame-txt").textContent = `${msg} — ${reason}.` + (delta ? ` Rating ${delta > 0 ? "+" : ""}${delta}.` : "");
  $("postgame").style.display = "";
  $("game-status").textContent = "";
  openModal("modal-result");
  G.archived = entry;
}
$("res-close").onclick = () => closeModal("modal-result");
$("btn-resign").onclick = () => { if (G && !G.over) endGame("l", "resignation"); };
$("btn-abort").onclick = () => {
  if (G && !G.over && G.moves.length >= 2) { if (!confirm("Abandon this game? It will count as a resignation.")) return; endGame("l", "abandoned"); }
  stopClock(); G = null;
  $("play-game").style.display = "none";
  $("play-setup").style.display = "";
  renderBotGrid();
};
$("btn-rematch").onclick = () => { closeModal("modal-result"); startGame(); };
$("btn-flip").onclick = () => { if (G) boardPlay.flip(!boardPlay.isFlipped()); };
$("btn-hint").onclick = () => {
  if (!G || G.over || G.game.turn !== G.mySide) return;
  AI.maxNodes = 20000;
  const res = AI.bestMove(G.game, { depth: 2, qs: true });
  if (res) {
    boardPlay.clearMarks();
    boardPlay.mark(res.move.f, "sel");
    boardPlay.mark(res.move.t, "sel");
    toast("Hint: consider " + G.game.san(res.move));
  }
};

/* ================= GAME REVIEW ================= */
let reviewBusy = false;
function runReview(entry) {
  if (reviewBusy) return;
  reviewBusy = true;
  openModal("modal-review");
  $("rev-running").style.display = "";
  $("rev-done").style.display = "none";
  $("rev-bar").style.width = "0%";

  const g = new Game(entry.startFen);
  const plies = entry.moves.length;
  const rows = [];
  let scores = []; // best score at each position (mover perspective)
  let bestSans = [];
  let i = 0;

  function evalPos() {
    const legal = g.legalMoves();
    if (!legal.length) return { s: g.inCheck(g.turn) ? -99000 : 0, san: null };
    AI.maxNodes = 6000;
    const r = AI.bestMove(g, { depth: 2, qs: true });
    return { s: r.best.s, san: g.san(r.best.m, legal) };
  }

  function step() {
    if (i > plies) { finish(); return; }
    const ev = evalPos();
    scores.push(ev.s); bestSans.push(ev.san);
    if (i < plies) {
      const m = g.legalMoves().find(x => uci(x) === entry.moves[i]);
      if (!m) { finish(); return; }
      g.make(m);
    }
    i++;
    $("rev-bar").style.width = Math.round(i / (plies + 1) * 100) + "%";
    setTimeout(step, 4);
  }

  function finish() {
    const myColor = entry.color;
    let accs = { me: [], opp: [] };
    for (let p = 0; p < plies; p++) {
      const moverIsWhite = p % 2 === 0;
      const moverSide = moverIsWhite ? "w" : "b";
      const isMe = moverSide === myColor;
      const best = scores[p];
      const played = -(scores[p + 1] !== undefined ? scores[p + 1] : 0);
      let loss = Math.max(0, best - played);
      if (best > 90000) loss = played > 90000 ? 0 : 800; // missed forced mate
      let cls;
      if (loss <= 15) cls = "Best";
      else if (loss <= 40) cls = "Excellent";
      else if (loss <= 90) cls = "Good";
      else if (loss <= 180) cls = "Inaccuracy";
      else if (loss <= 450) cls = "Mistake";
      else cls = "Blunder";
      const acc = 100 * Math.exp(-loss / 350);
      accs[isMe ? "me" : "opp"].push(acc);
      rows.push({
        no: Math.floor(p / 2) + 1, w: moverIsWhite, san: entry.sans[p], cls, isMe,
        best: bestSans[p], loss
      });
    }
    const avg = a => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length * 10) / 10 : 0;
    $("rev-acc-me").textContent = avg(accs.me) + "%";
    $("rev-acc-opp").textContent = avg(accs.opp) + "%";
    const list = $("rev-list");
    list.innerHTML = "";
    for (const r of rows) {
      const div = document.createElement("div");
      div.className = "rev-row";
      let cmt = "";
      if (r.isMe) {
        if (r.cls === "Blunder") cmt = `This loses badly — the engine wanted ${r.best}.`;
        else if (r.cls === "Mistake") cmt = `A real slip. ${r.best} was much stronger.`;
        else if (r.cls === "Inaccuracy") cmt = `Playable, but ${r.best} keeps more of the advantage.`;
        else if (r.cls === "Best") cmt = "Engine's top choice — well spotted.";
      }
      div.innerHTML = `<span class="mv">${r.no}${r.w ? "." : "…"} ${r.san}${r.isMe ? "" : " ·"}</span>` +
        `<span class="cls c-${r.cls}">${r.cls}</span><span class="cmt">${cmt}</span>`;
      list.appendChild(div);
    }
    $("rev-coach-note").innerHTML = `<span style="color:var(--gold)">Coach:</span> commentary shown on every one of your moves.`;
    $("rev-running").style.display = "none";
    $("rev-done").style.display = "";
    reviewBusy = false;
    // store accuracy on the game entry
    const idx = S.games.findIndex(x => x.ts === entry.ts);
    if (idx >= 0) { S.games[idx].acc = avg(accs.me); save(); }
  }
  step();
}
$("btn-review").onclick = () => { if (G && G.archived) runReview(G.archived); };
$("res-review").onclick = () => { closeModal("modal-result"); if (G && G.archived) runReview(G.archived); };
$("rev-close").onclick = () => closeModal("modal-review");

/* ================= PUZZLE CORE ================= */
/* A puzzle session on a given board. type m1: find mate. m2: find forced mate in 2. */
function puzzleSession(board, puzzle, cb) {
  const g = new Game(puzzle.fen);
  const side = g.turn;
  const sess = { g, side, stage: 1, done: false };
  board.flip(side === "b");
  board.set(g);
  board.unlock();
  let sols = puzzle.type === "m1" ? AI.matingMoves(g) : AI.mate2Moves(g);
  const m1Now = AI.matingMoves(g);

  board.interactive(
    () => sess.done ? [] : g.legalMoves(),
    m => {
      if (sess.done) return;
      const isMate = (() => { g.make(m); const r = g.inCheck(g.turn) && g.legalMoves().length === 0; g.unmake(); return r; })();
      if (isMate) { g.make(m); board.set(g, [m.f, m.t]); sess.done = true; board.lock(); cb(true); return; }
      if (puzzle.type === "m2" && sess.stage === 1 && sols.some(s => s.f === m.f && s.t === m.t && s.pr === m.pr)) {
        g.make(m);
        board.set(g, [m.f, m.t]);
        // opponent defends (any legal reply — all lose to mate)
        const replies = g.legalMoves();
        const r = replies[Math.floor(Math.random() * replies.length)];
        setTimeout(() => {
          if (sess.done) return;
          g.make(r);
          board.set(g, [r.f, r.t]);
          sess.stage = 2;
        }, 350);
        return;
      }
      sess.done = true;
      board.lock();
      // flash the wrong move
      g.make(m); board.set(g, [m.f, m.t]);
      setTimeout(() => { g.unmake(); board.set(g); }, 500);
      cb(false, puzzle.type === "m1" ? m1Now[0] : sols[0]);
    }
  );
  return {
    reveal() {
      sess.done = true; board.lock();
      const sol = puzzle.type === "m1" ? m1Now[0] : sols[0];
      if (sol) { board.mark(sol.f, "sel"); board.mark(sol.t, "sel"); }
      return sol ? g.san(sol) : "?";
    },
    abort() { sess.done = true; board.lock(); },
    game: g, side
  };
}
function puzzleGoal(p) { return p.type === "m1" ? "Mate in 1" : "Mate in 2"; }

function pickPuzzle(near, exclude) {
  exclude = exclude || [];
  let cands = PUZZLES.filter(p => Math.abs(p.rating - near) <= 250 && !exclude.includes(p.id));
  if (!cands.length) cands = PUZZLES.filter(p => !exclude.includes(p.id));
  if (!cands.length) cands = PUZZLES;
  return cands[Math.floor(Math.random() * cands.length)];
}

/* ================= RATED / DAILY PUZZLES ================= */
const boardPuzzle = Board("board-puzzle");
let puzSess = null, puzCurrent = null, puzMode = null;

function refreshPuzzleStats() {
  $("puz-rating").textContent = S.puzzleRating;
  $("puz-solved").textContent = S.puzzlesSolved;
  $("streak-count").textContent = S.streak.count;
  $("daily-state").textContent = S.dailyDone === TODAY() ? "✓ solved" : "unsolved";
  $("daily-date").textContent = " — " + TODAY();
  refreshTopbar();
}
function puzFeedback(msg, good) {
  const el = $("puz-feedback");
  el.textContent = msg;
  el.className = "puz-feedback " + (good === true ? "good" : good === false ? "bad" : "");
}

function serveRated(practice) {
  if (puzSess) puzSess.abort();
  puzMode = practice ? "practice" : "rated";
  puzCurrent = pickPuzzle(S.puzzleRating, S.usedPuzzles.slice(-20));
  if (!practice) { S.usedPuzzles.push(puzCurrent.id); if (S.usedPuzzles.length > 60) S.usedPuzzles.shift(); save(); }
  $("puz-info").style.display = "";
  $("puz-desc").innerHTML = `<b>${puzzleGoal(puzCurrent)}</b> · ${puzCurrent.theme} · rated ${puzCurrent.rating}` +
    `<br>${new Game(puzCurrent.fen).turn === "w" ? "White" : "Black"} to move.`;
  puzFeedback(practice ? "Practice — no rating at stake." : "Find the mate. Your rating is on the line.");
  puzSess = puzzleSession(boardPuzzle, puzCurrent, (solved, sol) => {
    if (puzMode === "rated") {
      const d = elo(S.puzzleRating, puzCurrent.rating, solved ? 1 : 0, 20);
      S.puzzleRating = Math.max(100, S.puzzleRating + d);
      S.puzzleHist.push({ t: Date.now(), v: S.puzzleRating });
      if (solved) S.puzzlesSolved++;
      save();
      puzFeedback(solved ? `Solved! +${d} puzzle rating.` : `Not quite — the answer was ${sol ? new Game(puzCurrent.fen).san(sol) : "?"}. ${d} rating.`, solved);
    } else if (puzMode === "daily") {
      if (solved) {
        markDailySolved();
        puzFeedback(`Daily puzzle solved! Streak: ${S.streak.count} 🔥`, true);
      } else {
        puzFeedback(`Wrong — but the daily has no penalty. Try again tomorrow… or right now.`, false);
      }
    } else {
      if (solved) S.puzzlesSolved++;
      save();
      puzFeedback(solved ? "Solved! (practice)" : `Missed it — answer: ${sol ? new Game(puzCurrent.fen).san(sol) : "?"}.`, solved);
    }
    refreshPuzzleStats();
  });
  refreshPuzzleStats();
}
$("btn-rated").onclick = () => serveRated(false);
$("btn-practice").onclick = () => serveRated(true);
$("btn-puz-giveup").onclick = () => {
  if (!puzSess) return;
  const san = puzSess.reveal();
  if (puzMode === "rated") {
    const d = elo(S.puzzleRating, puzCurrent.rating, 0, 20);
    S.puzzleRating = Math.max(100, S.puzzleRating + d); save();
  }
  puzFeedback(`Solution: ${san}`, false);
  refreshPuzzleStats();
};

function dailyIndex() {
  const days = Math.floor(Date.now() / 86400000);
  return (days * 37) % PUZZLES.length;
}
function markDailySolved() {
  if (S.dailyDone === TODAY()) return;
  const last = S.streak.last;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const before = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
  if (last === yesterday || last === before) S.streak.count++; // 48h grace
  else if (last !== TODAY()) S.streak.count = 1;
  S.streak.last = TODAY();
  S.dailyDone = TODAY();
  save();
}
$("btn-daily").onclick = () => {
  if (puzSess) puzSess.abort();
  puzMode = "daily";
  puzCurrent = PUZZLES[dailyIndex()];
  $("puz-info").style.display = "";
  $("puz-desc").innerHTML = `<b>Daily Puzzle — ${puzzleGoal(puzCurrent)}</b> · ${puzCurrent.theme}` +
    `<br>${new Game(puzCurrent.fen).turn === "w" ? "White" : "Black"} to move. One per day, same for everyone.`;
  puzFeedback(S.dailyDone === TODAY() ? "Already solved today — but go ahead, flex." : "Solve it to keep your streak alive.");
  puzSess = puzzleSession(boardPuzzle, puzCurrent, (solved) => {
    if (solved) { markDailySolved(); puzFeedback(`Daily solved! Streak: ${S.streak.count} 🔥`, true); }
    else puzFeedback("Wrong — no penalty on the daily. Hit the button to retry.", false);
    refreshPuzzleStats();
  });
};

/* ================= PUZZLE RUSH ================= */
const boardRush = Board("board-rush");
const RUSH = { on: false, score: 0, strikes: 0, t: 300, order: [], idx: 0, sess: null, timer: null };

function rushOrder() {
  return [...PUZZLES].sort((a, b) => (a.rating + Math.random() * 120) - (b.rating + Math.random() * 120));
}
function rushHud() {
  $("rush-score").textContent = RUSH.score;
  const strikes = $("rush-strikes").children;
  for (let i = 0; i < 3; i++) strikes[i].classList.toggle("hit", i < RUSH.strikes);
  const m = Math.floor(RUSH.t / 60), s = RUSH.t % 60;
  const tEl = $("rush-timer");
  tEl.textContent = m + ":" + String(s).padStart(2, "0");
  tEl.classList.toggle("low", RUSH.t <= 30);
}
function rushNext() {
  if (!RUSH.on) return;
  const p = RUSH.order[RUSH.idx % RUSH.order.length];
  RUSH.idx++;
  $("rush-feedback").textContent = `${puzzleGoal(p)} · ${new Game(p.fen).turn === "w" ? "White" : "Black"} to move`;
  $("rush-feedback").className = "puz-feedback";
  RUSH.sess = puzzleSession(boardRush, p, solved => {
    if (!RUSH.on) return;
    if (solved) RUSH.score++;
    else RUSH.strikes++;
    rushHud();
    if (RUSH.strikes >= 3) { rushEnd("three strikes"); return; }
    setTimeout(rushNext, solved ? 350 : 650);
  });
}
function rushEnd(why) {
  RUSH.on = false;
  clearInterval(RUSH.timer);
  if (RUSH.sess) RUSH.sess.abort();
  const best = RUSH.score > S.rushBest;
  if (best) S.rushBest = RUSH.score;
  save();
  $("rush-best").textContent = S.rushBest;
  $("rush-feedback").innerHTML = `<b>Run over (${why}) — score ${RUSH.score}.</b> ${best ? "New personal best! ♛" : "Best: " + S.rushBest}`;
  $("rush-feedback").className = "puz-feedback " + (best ? "good" : "");
  $("btn-rush-start").disabled = false;
}
$("btn-rush-start").onclick = () => {
  Object.assign(RUSH, { on: true, score: 0, strikes: 0, t: 300, order: rushOrder(), idx: 0 });
  $("btn-rush-start").disabled = true;
  rushHud();
  RUSH.timer = setInterval(() => {
    RUSH.t--;
    rushHud();
    if (RUSH.t <= 0) rushEnd("time");
  }, 1000);
  rushNext();
};

/* ================= PUZZLE BATTLE ================= */
const boardBattle = Board("board-battle");
const BAT = { on: false, me: 0, opp: 0, strikes: 0, t: 180, order: [], idx: 0, sess: null, timer: null, oppTimer: null, oppStrikes: 0, oppRating: 800, oppName: "" };
const RIVALS = ["TactixFox","Rook_n_Rolla","QueenSideQuinn","EnPassantEnzo","BlunderBuster","KnightOwl_77","PinPointPia","ZugzwangZane"];

function refreshBattleStats() {
  $("bat-rating").textContent = S.battleRating;
  $("bat-pts").textContent = S.seasonPts;
}
function batHud() {
  $("bat-me").textContent = BAT.me;
  $("bat-opp").textContent = BAT.opp;
  const strikes = $("bat-strikes").children;
  for (let i = 0; i < 3; i++) strikes[i].classList.toggle("hit", i < BAT.strikes);
  const m = Math.floor(BAT.t / 60), s = BAT.t % 60;
  const tEl = $("bat-timer");
  tEl.textContent = m + ":" + String(s).padStart(2, "0");
  tEl.classList.toggle("low", BAT.t <= 20);
}
function batNext() {
  if (!BAT.on) return;
  const p = BAT.order[BAT.idx % BAT.order.length];
  BAT.idx++;
  $("bat-feedback").textContent = `${puzzleGoal(p)} · ${new Game(p.fen).turn === "w" ? "White" : "Black"} to move`;
  $("bat-feedback").className = "puz-feedback";
  BAT.sess = puzzleSession(boardBattle, p, solved => {
    if (!BAT.on) return;
    if (solved) BAT.me++;
    else BAT.strikes++;
    batHud();
    if (BAT.strikes >= 3) { batEnd("you struck out"); return; }
    setTimeout(batNext, solved ? 350 : 650);
  });
}
function oppTick() {
  if (!BAT.on || BAT.oppStrikes >= 3) return;
  if (Math.random() < .14) BAT.oppStrikes++;
  else BAT.opp++;
  batHud();
  BAT.oppTimer = setTimeout(oppTick, 5200 + Math.random() * 8500);
}
function batEnd(why) {
  BAT.on = false;
  clearInterval(BAT.timer);
  clearTimeout(BAT.oppTimer);
  if (BAT.sess) BAT.sess.abort();
  const res = BAT.me > BAT.opp ? 1 : BAT.me < BAT.opp ? 0 : .5;
  const d = elo(S.battleRating, BAT.oppRating, res, 24);
  S.battleRating = Math.max(100, S.battleRating + d);
  if (res === 1) { S.winStreak++; S.seasonPts += Math.round(100 * (1 + .25 * Math.min(S.winStreak - 1, 4))); }
  else if (res === 0) { S.winStreak = 0; S.seasonPts += 25; }
  else S.seasonPts += 50;
  if (BAT.me > S.batBest) S.batBest = BAT.me;
  save();
  const msg = res === 1 ? `You win ${BAT.me}–${BAT.opp}! ♛` : res === 0 ? `${BAT.oppName} wins ${BAT.opp}–${BAT.me}.` : `Tied ${BAT.me}–${BAT.opp}.`;
  $("bat-feedback").innerHTML = `<b>${msg}</b> (${why}) Battle rating ${d >= 0 ? "+" : ""}${d}${res === 1 && S.winStreak > 1 ? ` · ${S.winStreak}-win streak bonus!` : ""}`;
  $("bat-feedback").className = "puz-feedback " + (res === 1 ? "good" : res === 0 ? "bad" : "");
  $("btn-bat-start").disabled = false;
  refreshBattleStats();
}
$("btn-bat-start").onclick = () => {
  Object.assign(BAT, {
    on: true, me: 0, opp: 0, strikes: 0, oppStrikes: 0, t: 180,
    order: rushOrder(), idx: 0,
    oppRating: S.battleRating + Math.round(Math.random() * 160 - 80),
    oppName: RIVALS[Math.floor(Math.random() * RIVALS.length)]
  });
  $("bat-opp-name").textContent = BAT.oppName + " (" + BAT.oppRating + ")";
  $("btn-bat-start").disabled = true;
  batHud();
  BAT.timer = setInterval(() => {
    BAT.t--;
    batHud();
    if (BAT.t <= 0) batEnd("time");
  }, 1000);
  BAT.oppTimer = setTimeout(oppTick, 4000 + Math.random() * 5000);
  batNext();
};

/* ================= ENDGAME DRILLS ================= */
const DRILLS = [
  { id:"rr", name:"Two rooks", desc:"Ladder-mate the lone king.", fen:"8/8/8/4k3/8/8/8/RR2K3 w - - 0 1", free:true },
  { id:"q", name:"Queen mate", desc:"Box the king in, then deliver.", fen:"8/8/8/4k3/8/8/8/4K1Q1 w - - 0 1", free:true },
  { id:"r", name:"Rook mate", desc:"The classic technique. Careful with stalemate.", fen:"8/8/8/4k3/8/8/8/R3K3 w - - 0 1" },
  { id:"qb", name:"Queen vs bishop", desc:"Win the piece or mate around it.", fen:"8/8/8/3bk3/8/8/8/4K1Q1 w - - 0 1" },
  { id:"bb", name:"Two bishops", desc:"The hardest basic mate. Herd the king to a corner.", fen:"8/8/8/4k3/8/8/8/1BB1K3 w - - 0 1" },
  { id:"kp", name:"King & pawn", desc:"Escort the pawn home and promote.", fen:"8/8/4K3/4P3/8/8/8/6k1 w - - 0 1" }
];
const boardDrill = Board("board-drill");
let DR = null;

function renderDrills() {
  const grid = $("drill-grid");
  grid.innerHTML = "";
  for (const d of DRILLS) {
    const done = S.drillsDone.includes(d.id);
    const card = document.createElement("div");
    card.className = "drill-card";
    card.innerHTML = `<h4>${d.name}</h4><p>${d.desc}</p>` +
      (done ? `<span class="done">✓</span>` : "");
    card.onclick = () => startDrill(d);
    grid.appendChild(card);
  }
}
function startDrill(d) {
  DR = { d, g: new Game(d.fen), over: false, repMap: new Map() };
  if (DR.g.inCheck("b")) { toast("Drill position error — please report this."); return; }
  DR.repMap.set(DR.g.key(), 1);
  $("drill-list").style.display = "none";
  $("drill-play").style.display = "";
  $("drill-title").textContent = d.name;
  $("drill-desc").textContent = d.desc + " You are White — checkmate the defending engine. Draws count as a fail.";
  $("drill-feedback").textContent = "";
  $("drill-feedback").className = "puz-feedback";
  boardDrill.flip(false);
  boardDrill.set(DR.g);
  boardDrill.unlock();
  boardDrill.interactive(
    () => (!DR.over && DR.g.turn === "w") ? DR.g.legalMoves() : [],
    m => {
      DR.g.make(m);
      DR.repMap.set(DR.g.key(), (DR.repMap.get(DR.g.key()) || 0) + 1);
      boardDrill.set(DR.g, [m.f, m.t]);
      if (drillStatus()) return;
      setTimeout(() => {
        if (DR.over) return;
        AI.maxNodes = 30000;
        const res = AI.bestMove(DR.g, { depth: 3, qs: false, repMap: DR.repMap });
        if (res) {
          DR.g.make(res.move);
          DR.repMap.set(DR.g.key(), (DR.repMap.get(DR.g.key()) || 0) + 1);
          boardDrill.set(DR.g, [res.move.f, res.move.t]);
          drillStatus();
        }
      }, 300);
    }
  );
}
function drillStatus() {
  const st = DR.g.status({ repMap: DR.repMap });
  if (!st.over) return false;
  DR.over = true;
  boardDrill.lock();
  const fb = $("drill-feedback");
  if (st.result === "1-0") {
    fb.textContent = "Drill complete — checkmate! ✓";
    fb.className = "puz-feedback good";
    if (!S.drillsDone.includes(DR.d.id)) { S.drillsDone.push(DR.d.id); save(); }
  } else {
    fb.textContent = `Failed — ${st.reason}. Restart and keep the win in hand.`;
    fb.className = "puz-feedback bad";
  }
  return true;
}
$("btn-drill-restart").onclick = () => DR && startDrill(DR.d);
$("btn-drill-back").onclick = () => { $("drill-play").style.display = "none"; $("drill-list").style.display = ""; renderDrills(); };

/* ================= VISION TRAINER ================= */
const boardVision = Board("board-vision", { blank: true, showCheck: false });
boardVision.set(new Game()); // squares only (blank hides pieces)
const VIS = { on: false, t: 30, score: 0, target: -1, timer: null, asBlack: false };
$("vis-side-w").onclick = () => { VIS.asBlack = false; $("vis-side-w").classList.add("sel"); $("vis-side-b").classList.remove("sel"); boardVision.flip(false); };
$("vis-side-b").onclick = () => { VIS.asBlack = true; $("vis-side-b").classList.add("sel"); $("vis-side-w").classList.remove("sel"); boardVision.flip(true); };

function visNext() {
  VIS.target = Math.floor(Math.random() * 64);
  $("vision-target").textContent = sqName(VIS.target);
}
boardVision.setRawClick(i => {
  if (!VIS.on) return;
  if (i === VIS.target) {
    VIS.score++;
    $("vis-score").textContent = VIS.score;
    $("vision-target").innerHTML = `<span class="good">${sqName(VIS.target)} ✓</span>`;
    setTimeout(visNext, 120);
  } else {
    $("vision-target").innerHTML = `<span class="bad">${sqName(VIS.target)}</span>`;
    setTimeout(() => { $("vision-target").textContent = sqName(VIS.target); }, 300);
  }
});
$("btn-vis-start").onclick = () => {
  if (VIS.on) return;
  Object.assign(VIS, { on: true, t: 30, score: 0 });
  $("vis-score").textContent = 0;
  $("vis-best").textContent = S.visBest;
  visNext();
  VIS.timer = setInterval(() => {
    VIS.t--;
    $("vis-time").textContent = VIS.t;
    if (VIS.t <= 0) {
      clearInterval(VIS.timer);
      VIS.on = false;
      if (VIS.score > S.visBest) { S.visBest = VIS.score; save(); toast("New vision best: " + VIS.score + "!"); }
      $("vis-best").textContent = S.visBest;
      $("vision-target").textContent = "Done — " + VIS.score;
      $("vis-time").textContent = 30;
    }
  }, 1000);
};

/* ================= LEARN ================= */
const LESSONS = [
  { icon:"♟", title:"How the pieces move", body:`<p><b>Pawns</b> move one square forward (two from their start), and capture one square diagonally forward. <b>Knights</b> jump in an L — two squares one way, one square sideways — and are the only piece that jumps over others. <b>Bishops</b> slide any distance diagonally, <b>rooks</b> any distance in straight lines, and the <b>queen</b> does both. The <b>king</b> moves one square in any direction.</p><p>Piece values as a rule of thumb: pawn 1, knight 3, bishop 3, rook 5, queen 9. The king is priceless — lose him and you lose.</p>` },
  { icon:"♚", title:"Check, checkmate & stalemate", body:`<p><b>Check</b> means your king is attacked — you must respond by moving the king, blocking, or capturing the attacker. <b>Checkmate</b> means there's no way out: game over. <b>Stalemate</b> is when a player has no legal move but is NOT in check — that's a draw, and the most common way winning positions slip away. Always give the enemy king an escape square unless you're mating.</p>` },
  { icon:"♜", title:"Castling", body:`<p>Once per game, your king may slide two squares toward a rook, and the rook hops to the other side. Conditions: neither piece has moved, no pieces between them, and the king may not castle out of, through, or into check. Castle early — a king in the center is a target.</p>` },
  { icon:"♙", title:"En passant & promotion", body:`<p><b>En passant:</b> if an enemy pawn advances two squares and lands beside your pawn, you may capture it as if it had moved one — but only immediately, on the very next move.</p><p><b>Promotion:</b> a pawn reaching the last rank becomes any piece you like (almost always a queen). Try it on the board — this app supports underpromotion too.</p>` },
  { icon:"◫", title:"Reading notation", body:`<p>Squares are named file + rank: <b>e4</b> is the e-file, 4th rank. Moves name the piece and destination: <b>Nf3</b> = knight to f3. <b>x</b> means capture (Bxe5), <b>+</b> is check, <b>#</b> is checkmate, <b>O-O</b> castles short. Time controls read base|increment: <b>5|3</b> = 5 minutes plus 3 seconds per move. Train square-recognition in the Vision trainer.</p>` },
  { icon:"⚑", title:"Three opening principles", body:`<p>1. <b>Control the center</b> — pawns to e4/d4 (or strike at them). 2. <b>Develop knights and bishops</b> before moving the same piece twice. 3. <b>Castle early.</b> Do these three things and you'll be better developed than most opponents at your level — then look for tactics. Practice against Coach, who explains what it's doing and why.</p>` }
];
function renderLessons() {
  const wrap = $("learn-lessons");
  wrap.innerHTML = "";
  LESSONS.forEach((l, i) => {
    const d = document.createElement("details");
    d.className = "lesson";
    if (i === 0) d.open = true;
    d.innerHTML = `<summary><span class="ic">${l.icon}</span>${l.title}</summary><div class="body">${l.body}</div>`;
    wrap.appendChild(d);
  });
}
renderLessons();

const THEME_SETS = [
  { id:"backrank", name:"Back-rank mates", free:true, match: p => /back-rank|fools|scholars/.test(p.theme) },
  { id:"queen", name:"Queen mates", match: p => p.theme === "queen mate" },
  { id:"rookminor", name:"Rook & minor mates", match: p => p.theme === "rook & minor mate" },
  { id:"patterns", name:"Classic patterns", match: p => /smothered|arabian|epaulette|ladder|rook mate/.test(p.theme) },
  { id:"m2", name:"Mate in two", match: p => p.type === "m2" }
];
const boardLearn = Board("board-learn");
let LRN = null;

function renderThemes() {
  const grid = $("theme-grid");
  grid.innerHTML = "";
  for (const t of THEME_SETS) {
    const puzzles = PUZZLES.filter(t.match);
    const prog = S.themesProg[t.id] || 0;
    const card = document.createElement("div");
    card.className = "drill-card";
    card.innerHTML = `<h4>${t.name}</h4><p>${puzzles.length} puzzles · progress ${Math.min(prog, puzzles.length)}/${puzzles.length}</p>`;
    card.onclick = () => startTheme(t, puzzles);
    grid.appendChild(card);
  }
}
function startTheme(t, puzzles) {
  LRN = { t, puzzles, i: (S.themesProg[t.id] || 0) % puzzles.length };
  $("learn-play").style.display = "";
  $("learn-title").textContent = t.name;
  themeNext();
  $("learn-play").scrollIntoView({ behavior: "smooth", block: "center" });
}
function themeNext() {
  const p = LRN.puzzles[LRN.i % LRN.puzzles.length];
  $("learn-prog").textContent = ((S.themesProg[LRN.t.id] || 0)) + "/" + LRN.puzzles.length;
  $("learn-feedback").textContent = `${puzzleGoal(p)} · ${new Game(p.fen).turn === "w" ? "White" : "Black"} to move`;
  $("learn-feedback").className = "puz-feedback";
  puzzleSession(boardLearn, p, solved => {
    const fb = $("learn-feedback");
    if (solved) {
      LRN.i++;
      S.themesProg[LRN.t.id] = (S.themesProg[LRN.t.id] || 0) + 1;
      save();
      fb.textContent = "Solved! Next one coming up…";
      fb.className = "puz-feedback good";
      setTimeout(themeNext, 700);
    } else {
      fb.textContent = "Not this one — same puzzle, try again.";
      fb.className = "puz-feedback bad";
      setTimeout(themeNext, 900);
    }
  });
  renderThemes();
}
$("btn-learn-back").onclick = () => { $("learn-play").style.display = "none"; renderThemes(); };
renderThemes();

/* ================= ARCHIVE ================= */
function renderArchive() {
  const body = $("arch-body");
  body.innerHTML = "";
  $("arch-empty").style.display = S.games.length ? "none" : "";
  for (const g of S.games) {
    const tr = document.createElement("tr");
    tr.className = "g";
    const d = new Date(g.ts);
    const res = g.result === "w" ? `<span class="res-w">Won</span>` : g.result === "l" ? `<span class="res-l">Lost</span>` : `<span class="res-d">Draw</span>`;
    tr.innerHTML = `<td>${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>` +
      `<td>${g.botFace || "♟"} ${g.bot}</td><td>${g.color === "w" ? "White" : "Black"}</td>` +
      `<td>${g.tcLabel}</td><td>${g.variant}</td><td>${res} <small style="color:var(--ivory-faint)">${g.reason}</small></td>` +
      `<td>${Math.ceil(g.moves.length / 2)}</td>`;
    tr.onclick = () => openReplay(g);
    body.appendChild(tr);
  }
}

const boardReplay = Board("board-replay");
let RP = null;
function openReplay(entry) {
  RP = { entry, idx: entry.moves.length };
  $("rp-title").textContent = `You vs ${entry.bot} — ${entry.tcLabel} ${entry.variant}`;
  boardReplay.flip(entry.color === "b");
  rpRender();
  openModal("modal-replay");
}
function rpRender() {
  const g = new Game(RP.entry.startFen);
  let last = null;
  for (let i = 0; i < RP.idx; i++) {
    const m = g.legalMoves().find(x => uci(x) === RP.entry.moves[i]);
    if (!m) break;
    g.make(m);
    last = [m.f, m.t];
  }
  boardReplay.set(g, last);
  boardReplay.lock();
  $("rp-pos").textContent = RP.idx + " / " + RP.entry.moves.length;
}
$("rp-start").onclick = () => { RP.idx = 0; rpRender(); };
$("rp-prev").onclick = () => { RP.idx = Math.max(0, RP.idx - 1); rpRender(); };
$("rp-next").onclick = () => { RP.idx = Math.min(RP.entry.moves.length, RP.idx + 1); rpRender(); };
$("rp-end").onclick = () => { RP.idx = RP.entry.moves.length; rpRender(); };
$("rp-close").onclick = () => closeModal("modal-replay");

/* ================= INSIGHTS ================= */
function drawChart(canvasId, points, color) {
  const cv = $(canvasId), ctx = cv.getContext("2d");
  ctx.clearRect(0, 0, cv.width, cv.height);
  if (points.length < 2) {
    ctx.fillStyle = "rgba(237,229,207,.35)";
    ctx.font = "13px sans-serif";
    ctx.fillText("Play more games to build this chart.", 14, cv.height / 2);
    return;
  }
  const vs = points.map(p => p.v);
  const min = Math.min(...vs) - 20, max = Math.max(...vs) + 20;
  const X = i => 8 + (i / (points.length - 1)) * (cv.width - 16);
  const Y = v => cv.height - 10 - ((v - min) / (max - min)) * (cv.height - 20);
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
  points.forEach((p, i) => i ? ctx.lineTo(X(i), Y(p.v)) : ctx.moveTo(X(i), Y(p.v)));
  ctx.stroke();
  ctx.fillStyle = color;
  points.forEach((p, i) => { ctx.beginPath(); ctx.arc(X(i), Y(p.v), 2.5, 0, 7); ctx.fill(); });
}
function renderInsights() {
  const gs = S.games;
  $("ins-games").textContent = gs.length;
  $("ins-wins").textContent = gs.filter(g => g.result === "w").length;
  $("ins-draws").textContent = gs.filter(g => g.result === "d").length;
  $("ins-losses").textContent = gs.filter(g => g.result === "l").length;
  const accs = gs.filter(g => g.acc != null).map(g => g.acc);
  $("ins-acc").textContent = accs.length ? Math.round(accs.reduce((a, b) => a + b, 0) / accs.length) + "%" : "—";
  const byBot = {};
  gs.forEach(g => byBot[g.bot] = (byBot[g.bot] || 0) + 1);
  const fav = Object.entries(byBot).sort((a, b) => b[1] - a[1])[0];
  $("ins-fav").textContent = fav ? fav[0] : "—";
  drawChart("ch-blitz", S.ratingHist.blitz.slice(-40), "#d2a24c");
  drawChart("ch-puzzle", S.puzzleHist.slice(-40), "#8ecfe0");
}

/* ================= SETTINGS ================= */
function renderSettings() {
  const row = $("pieceset-row");
  row.innerHTML = "";
  for (const ps of PIECE_SETS) {
    const c = document.createElement("div");
    c.className = "pieceset-card" + (S.settings.pieces === ps.id ? " sel" : "");
    c.innerHTML = (ps.id === "glyph"
      ? `<div class="prev"><span>♔</span><span>♞</span></div>`
      : `<div class="prev"><img src="pieces/${ps.id}/wK.svg" alt=""><img src="pieces/${ps.id}/bN.svg" alt=""></div>`) +
      `<b>${ps.name}</b>`;
    c.onclick = () => { S.settings.pieces = ps.id; save(); applyVisuals(); renderSettings(); };
    row.appendChild(c);
  }
  const sw = $("swatch-row");
  sw.innerHTML = "";
  for (const t of BOARD_THEMES) {
    const s = document.createElement("div");
    s.className = "swatch" + (S.settings.board === t.id ? " sel" : "");
    s.innerHTML = `<div class="grid" style="--sw-l:${t.l};--sw-d:${t.d}"></div><span>${t.name}</span>`;
    s.onclick = () => { S.settings.board = t.id; save(); applyVisuals(); renderSettings(); };
    sw.appendChild(s);
  }
}
$("btn-reset-all").onclick = () => {
  if (!confirm("Really wipe all progress? Ratings, games, streaks and settings will be gone.")) return;
  localStorage.removeItem("gambit_v1");
  location.reload();
};

/* ================= init ================= */
applyBoardTheme();
refreshTopbar();
refreshPuzzleStats();
$("rush-best").textContent = S.rushBest;
$("vis-best").textContent = S.visBest;
refreshBattleStats();
