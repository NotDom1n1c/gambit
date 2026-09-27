/* GAMBIT landing — bot ladder, playable puzzle (real engine), themes, piece cycle */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  /* ---------------- hero piece cycle ----------------
     piece3d.js draws the 3D piece and listens for "gambit:piece".
     If WebGL is unavailable the 2D fallback image is used instead. */
  const PIECES = [
    { code: "P", name: "Pawn",   move: "One square forward, two on its first move. Captures diagonally." },
    { code: "N", name: "Knight", move: "Jumps in an L: two squares one way, one square to the side." },
    { code: "B", name: "Bishop", move: "Any number of squares diagonally. Stays on its colour for life." },
    { code: "R", name: "Rook",   move: "Any number of squares along a rank or a file." },
    { code: "Q", name: "Queen",  move: "Any number of squares, in any direction." },
    { code: "K", name: "King",   move: "One square in any direction. Protect it at all costs." }
  ];
  let cur = 4, timer = null;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dots = $("plate-dots");
  PIECES.forEach((p, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.setAttribute("role", "tab"); b.setAttribute("aria-label", p.name);
    b.innerHTML = `<img src="pieces/cburnett/w${p.code}.svg" alt="">`;
    b.onclick = () => { show(i); restart(); };
    dots.appendChild(b);
  });
  function show(i) {
    cur = (i + PIECES.length) % PIECES.length;
    const p = PIECES[cur], plate = $("plate");
    plate.classList.add("swap");
    setTimeout(() => {
      $("plate-idx").textContent = String(cur + 1).padStart(2, "0") + " / 06";
      $("plate-name").textContent = p.name;
      $("plate-move").textContent = p.move;
      plate.classList.remove("swap");
    }, 260);
    [...dots.children].forEach((b, k) => { b.classList.toggle("on", k === cur); b.setAttribute("aria-selected", k === cur); });
    const fb = $("stage-fallback");
    fb.src = `pieces/cburnett/${cur % 2 ? "b" : "w"}${p.code}.svg`;
    window.dispatchEvent(new CustomEvent("gambit:piece", { detail: { index: cur, code: p.code } }));
  }
  function restart() { clearInterval(timer); if (!reduce) timer = setInterval(() => show(cur + 1), 4800); }
  $("stage").addEventListener("click", () => { show(cur + 1); restart(); });
  window.GAMBIT_PIECE = () => cur;
  show(cur); restart();
  // no WebGL after a moment -> 2D fallback
  setTimeout(() => { if (!window.__piece3dOK) $("stage-fallback").hidden = false; }, 6000);

  /* ---------------- bot ladder ---------------- */
  const BOTS = [
    ["♙", "Martin", "friendly beginner", 350], ["♗", "Anna", "casual player", 600], ["♘", "Noor", "solid improver", 850],
    ["♕", "Coach", "explains its moves", 1000], ["♖", "Isla", "positional grinder", 1150], ["☻", "Pixel", "streamer bot", 1300],
    ["♞", "Viktor", "attacking maniac", 1450], ["♛", "Sofia", "tournament regular", 1750], ["♚", "Maximus", "no mercy given", 2100],
    ["★", "GM Nova", "celebrity bot", 2350]
  ];
  const ladder = $("ladder");
  BOTS.forEach(([face, name, desc, elo], i) => {
    const li = document.createElement("li");
    if (elo >= 2000) li.classList.add("hot");
    li.innerHTML = `<span class="face">${face}</span><span class="who"><b>${name}</b><span>${desc}</span></span>` +
      `<span class="bar"><i style="width:${(elo / 2400 * 100).toFixed(1)}%;transition-delay:${i * 60}ms"></i></span><span class="elo">${elo}</span>`;
    ladder.appendChild(li);
  });

  /* ---------------- board themes ---------------- */
  const THEMES = [
    ["Tournament", "#e8dfc5", "#4e6b45"], ["Walnut", "#f0d9b5", "#b58863"], ["Ocean", "#dee3e6", "#8ca2ad"],
    ["Charcoal", "#d6d3ca", "#5c5c54"], ["Rosé", "#f2dede", "#b07c8b"]
  ];
  const SETS = ["cburnett", "merida", "cburnett", "merida", "cburnett"];
  const MINI = ["bR", "bK", "", "", "", "wN", "", "", "", "", "wQ", "", "wP", "", "", "wK"];
  $("themes").innerHTML = THEMES.map(([name, l, d], t) => `
    <figure class="theme rv">
      <div class="mini">${MINI.map((pc, i) => `<div style="background:${((i >> 2) + i) % 2 ? d : l}">${pc ? `<img src="pieces/${SETS[t]}/${pc}.svg" alt="">` : ""}</div>`).join("")}</div>
      <p>${name}</p><small>${SETS[t] === "merida" ? "Merida" : "Classic"} pieces</small>
    </figure>`).join("");

  /* ---------------- vision trainer teaser ---------------- */
  const vis = $("vision-sq");
  if (!reduce) setInterval(() => {
    vis.classList.add("out");
    setTimeout(() => { vis.textContent = "abcdefgh"[Math.random() * 8 | 0] + (1 + (Math.random() * 8 | 0)); vis.classList.remove("out"); }, 300);
  }, 1600);

  /* ---------------- playable puzzle (validated with the real engine) ----------------
     Morphy vs Duke Karl & Count Isouard, Paris 1858: 17.Rd8# is the only mate in one. */
  const FEN = "1n2kb1r/p4ppp/4q3/4p1B1/4P3/8/PPP2PPP/2KR4 w k - 0 17";
  const boardEl = $("pz-board"), statusEl = $("pz-status");
  let game, legal, sel = null, done = false, drag = null;

  function reset() {
    game = new Game(FEN); legal = game.legalMoves(); sel = null; done = false;
    statusEl.className = "pz-status";
    statusEl.innerHTML = "Click a white piece, then its target square. Or drag it.";
    render();
  }
  function pieceAt(i) { return game.board[i]; }
  function render(lastMove, mateSq) {
    boardEl.innerHTML = "";
    const targets = sel == null ? [] : legal.filter(m => m.f === sel);
    for (let i = 0; i < 64; i++) {
      const sq = document.createElement("div");
      const dark = ((i >> 3) + (i & 7)) % 2 === 1;
      sq.className = "pz-sq" + (dark ? " d" : "");
      sq.dataset.i = i;
      const p = pieceAt(i);
      if (p && p !== ".") {
        const img = document.createElement("img");
        img.src = `pieces/cburnett/${p === p.toUpperCase() ? "w" : "b"}${p.toUpperCase()}.svg`;
        img.alt = "";
        sq.appendChild(img);
        if (!done && p === p.toUpperCase()) sq.classList.add("mine");
      }
      if (sel === i) sq.classList.add("sel");
      const t = targets.find(m => m.t === i);
      if (t) { sq.classList.add("target"); if (p && p !== ".") sq.classList.add("cap"); }
      if (lastMove && (lastMove.f === i || lastMove.t === i)) sq.classList.add("last");
      if (mateSq === i) sq.classList.add("mate");
      boardEl.appendChild(sq);
    }
  }
  function tryMove(from, to) {
    const m = legal.find(x => x.f === from && x.t === to);
    if (!m) return false;
    const san = game.san(m, legal);
    game.make(m);
    const st = game.status({ variant: "standard", checks: { w: 0, b: 0 } });
    if (st.over && st.reason === "checkmate") {
      done = true; sel = null;
      render(m, game.kingSq("b"));
      statusEl.className = "pz-status win";
      statusEl.innerHTML = `<b>17. ${san}</b> Checkmate. The bishop on g5 guards the rook and covers e7, so the king has nowhere to go. Morphy, 1858.`;
    } else {
      render(m);
      statusEl.innerHTML = `<b>${san}</b> is legal, but not mate. Black escapes. Try again.`;
      boardEl.classList.remove("shake"); void boardEl.offsetWidth; boardEl.classList.add("shake");
      setTimeout(() => { game.unmake(); legal = game.legalMoves(); render(); }, 900);
    }
    return true;
  }
  function sqFromPoint(x, y) {
    const el = document.elementFromPoint(x, y);
    const sq = el && el.closest(".pz-sq");
    return sq ? +sq.dataset.i : null;
  }
  boardEl.addEventListener("pointerdown", e => {
    if (done) return;
    const i = sqFromPoint(e.clientX, e.clientY);
    if (i == null) return;
    const p = pieceAt(i);
    if (sel != null && sel !== i && legal.some(m => m.f === sel && m.t === i)) { tryMove(sel, i); sel = null; return; }
    if (p && p !== "." && p === p.toUpperCase()) {
      sel = i; render();
      const img = document.createElement("img");
      img.src = `pieces/cburnett/w${p}.svg`; img.className = "pz-drag";
      img.style.left = e.clientX + "px"; img.style.top = e.clientY + "px";
      img.style.width = img.style.height = boardEl.clientWidth / 8 + "px";
      document.body.appendChild(img);
      drag = { from: i, img, moved: false };
      boardEl.setPointerCapture(e.pointerId);
    } else { sel = null; render(); }
  });
  boardEl.addEventListener("pointermove", e => {
    if (!drag) return;
    drag.moved = true;
    drag.img.style.left = e.clientX + "px"; drag.img.style.top = e.clientY + "px";
  });
  boardEl.addEventListener("pointerup", e => {
    if (!drag) return;
    const d = drag; drag = null; d.img.remove();
    const to = sqFromPoint(e.clientX, e.clientY);
    if (d.moved && to != null && to !== d.from) { if (!tryMove(d.from, to)) { sel = null; render(); } else sel = null; }
  });
  $("pz-reset").onclick = reset;
  $("pz-hint").onclick = () => {
    if (done) return;
    const rook = legal.find(m => pieceAt(m.f) === "R");
    sel = null; render();
    const sq = boardEl.children[rook.f];
    sq.classList.add("hint");
    statusEl.innerHTML = "The rook has an open file. Where can it give check that the king can't escape?";
  };
  reset();

  /* ---------------- scroll reveals ---------------- */
  document.querySelectorAll(".sec-head, .panel, .mode, .puzzle, .review-cols > div, .hood-list li").forEach(el => el.classList.add("rv"));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in", "seen");
    io.unobserve(e.target);
  }), { threshold: 0.15 });
  document.querySelectorAll(".rv, .ladder, .eval").forEach(el => io.observe(el));
})();
