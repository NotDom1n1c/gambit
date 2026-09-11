/* GAMBIT chess engine — move generation, rules, search AI. Vanilla JS, no deps. */
"use strict";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const FILES = "abcdefgh";

function sqName(i){ return FILES[i & 7] + (8 - (i >> 3)); }
function nameSq(s){ return (8 - parseInt(s[1], 10)) * 8 + FILES.indexOf(s[0]); }

const KNIGHT_D = [[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]];
const KING_D   = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
const ROOK_D   = [[1,0],[-1,0],[0,1],[0,-1]];
const BISH_D   = [[1,1],[1,-1],[-1,1],[-1,-1]];

class Game {
  constructor(fen){ this.load(fen || START_FEN); }

  load(fen){
    const p = fen.trim().split(/\s+/);
    this.board = new Array(64).fill(null);
    let i = 0;
    for (const ch of p[0]){
      if (ch === "/") continue;
      if (/\d/.test(ch)) i += +ch;
      else this.board[i++] = ch;
    }
    this.turn = p[1] || "w";
    const c = p[2] || "-";
    this.cast = { K: c.includes("K"), Q: c.includes("Q"), k: c.includes("k"), q: c.includes("q") };
    this.ep = (p[3] && p[3] !== "-") ? nameSq(p[3]) : -1;
    this.half = +(p[4] || 0);
    this.full = +(p[5] || 1);
    this.hist = [];
  }

  fen(){
    let rows = [];
    for (let r = 0; r < 8; r++){
      let row = "", empty = 0;
      for (let f = 0; f < 8; f++){
        const pc = this.board[r*8+f];
        if (!pc) empty++;
        else { if (empty){ row += empty; empty = 0; } row += pc; }
      }
      if (empty) row += empty;
      rows.push(row);
    }
    let c = (this.cast.K?"K":"")+(this.cast.Q?"Q":"")+(this.cast.k?"k":"")+(this.cast.q?"q":"");
    return rows.join("/") + " " + this.turn + " " + (c||"-") + " " +
           (this.ep >= 0 ? sqName(this.ep) : "-") + " " + this.half + " " + this.full;
  }

  key(){ return this.fen().split(" ").slice(0,4).join(" "); } // repetition key

  isW(p){ return p >= "A" && p <= "Z"; }
  sideOf(p){ return this.isW(p) ? "w" : "b"; }

  kingSq(side){
    const k = side === "w" ? "K" : "k";
    for (let i = 0; i < 64; i++) if (this.board[i] === k) return i;
    return -1;
  }

  attacked(sq, by){ // is square `sq` attacked by side `by`
    const f = sq & 7, r = sq >> 3, B = this.board;
    // pawns
    if (by === "w"){
      if (r+1 < 8 && f-1 >= 0 && B[(r+1)*8+f-1] === "P") return true;
      if (r+1 < 8 && f+1 <  8 && B[(r+1)*8+f+1] === "P") return true;
    } else {
      if (r-1 >= 0 && f-1 >= 0 && B[(r-1)*8+f-1] === "p") return true;
      if (r-1 >= 0 && f+1 <  8 && B[(r-1)*8+f+1] === "p") return true;
    }
    // knights
    const N = by === "w" ? "N" : "n";
    for (const [df,dr] of KNIGHT_D){
      const nf = f+df, nr = r+dr;
      if (nf>=0 && nf<8 && nr>=0 && nr<8 && B[nr*8+nf] === N) return true;
    }
    // king
    const K = by === "w" ? "K" : "k";
    for (const [df,dr] of KING_D){
      const nf = f+df, nr = r+dr;
      if (nf>=0 && nf<8 && nr>=0 && nr<8 && B[nr*8+nf] === K) return true;
    }
    // sliders
    const R = by==="w"?"R":"r", Q = by==="w"?"Q":"q", Bp = by==="w"?"B":"b";
    for (const [df,dr] of ROOK_D){
      let nf = f+df, nr = r+dr;
      while (nf>=0 && nf<8 && nr>=0 && nr<8){
        const pc = B[nr*8+nf];
        if (pc){ if (pc === R || pc === Q) return true; break; }
        nf += df; nr += dr;
      }
    }
    for (const [df,dr] of BISH_D){
      let nf = f+df, nr = r+dr;
      while (nf>=0 && nf<8 && nr>=0 && nr<8){
        const pc = B[nr*8+nf];
        if (pc){ if (pc === Bp || pc === Q) return true; break; }
        nf += df; nr += dr;
      }
    }
    return false;
  }

  inCheck(side){
    side = side || this.turn;
    const k = this.kingSq(side);
    return k >= 0 && this.attacked(k, side === "w" ? "b" : "w");
  }

  genPseudo(side){
    side = side || this.turn;
    const B = this.board, moves = [], white = side === "w";
    const dir = white ? -1 : 1, startR = white ? 6 : 1, promoR = white ? 0 : 7;
    for (let i = 0; i < 64; i++){
      const pc = B[i];
      if (!pc || this.sideOf(pc) !== side) continue;
      const f = i & 7, r = i >> 3, t = pc.toLowerCase();
      if (t === "p"){
        const r1 = r + dir;
        if (r1 >= 0 && r1 < 8 && !B[r1*8+f]){
          if (r1 === promoR) for (const pr of ["q","r","b","n"]) moves.push({f:i, t:r1*8+f, pr});
          else moves.push({f:i, t:r1*8+f});
          if (r === startR && !B[(r+2*dir)*8+f]) moves.push({f:i, t:(r+2*dir)*8+f, fl:"2"});
        }
        for (const dfc of [-1,1]){
          const nf = f+dfc;
          if (nf < 0 || nf > 7 || r1 < 0 || r1 > 7) continue;
          const tsq = r1*8+nf, tp = B[tsq];
          if (tp && this.sideOf(tp) !== side){
            if (r1 === promoR) for (const pr of ["q","r","b","n"]) moves.push({f:i, t:tsq, pr});
            else moves.push({f:i, t:tsq});
          } else if (tsq === this.ep){
            moves.push({f:i, t:tsq, fl:"e"});
          }
        }
      } else if (t === "n"){
        for (const [df,dr] of KNIGHT_D){
          const nf = f+df, nr = r+dr;
          if (nf<0||nf>7||nr<0||nr>7) continue;
          const tp = B[nr*8+nf];
          if (!tp || this.sideOf(tp) !== side) moves.push({f:i, t:nr*8+nf});
        }
      } else if (t === "k"){
        for (const [df,dr] of KING_D){
          const nf = f+df, nr = r+dr;
          if (nf<0||nf>7||nr<0||nr>7) continue;
          const tp = B[nr*8+nf];
          if (!tp || this.sideOf(tp) !== side) moves.push({f:i, t:nr*8+nf});
        }
        // castling (standard positions only)
        const opp = white ? "b" : "w";
        if (white && i === 60){
          if (this.cast.K && !B[61] && !B[62] && B[63] === "R" &&
              !this.attacked(60,opp) && !this.attacked(61,opp) && !this.attacked(62,opp))
            moves.push({f:60, t:62, fl:"c"});
          if (this.cast.Q && !B[59] && !B[58] && !B[57] && B[56] === "R" &&
              !this.attacked(60,opp) && !this.attacked(59,opp) && !this.attacked(58,opp))
            moves.push({f:60, t:58, fl:"c"});
        } else if (!white && i === 4){
          if (this.cast.k && !B[5] && !B[6] && B[7] === "r" &&
              !this.attacked(4,opp) && !this.attacked(5,opp) && !this.attacked(6,opp))
            moves.push({f:4, t:6, fl:"c"});
          if (this.cast.q && !B[3] && !B[2] && !B[1] && B[0] === "r" &&
              !this.attacked(4,opp) && !this.attacked(3,opp) && !this.attacked(2,opp))
            moves.push({f:4, t:2, fl:"c"});
        }
      } else { // sliders
        const dirs = t === "r" ? ROOK_D : t === "b" ? BISH_D : KING_D; // queen = 8 dirs
        for (const [df,dr] of dirs){
          let nf = f+df, nr = r+dr;
          while (nf>=0 && nf<8 && nr>=0 && nr<8){
            const tp = B[nr*8+nf];
            if (!tp){ moves.push({f:i, t:nr*8+nf}); }
            else { if (this.sideOf(tp) !== side) moves.push({f:i, t:nr*8+nf}); break; }
            nf += df; nr += dr;
          }
        }
      }
    }
    return moves;
  }

  make(m){
    const B = this.board, side = this.turn, white = side === "w";
    const st = {
      cast: { ...this.cast }, ep: this.ep, half: this.half, full: this.full,
      cap: m.fl === "e" ? B[white ? m.t+8 : m.t-8] : B[m.t]
    };
    const piece = B[m.f];
    B[m.t] = m.pr ? (white ? m.pr.toUpperCase() : m.pr) : piece;
    B[m.f] = null;
    if (m.fl === "e") B[white ? m.t+8 : m.t-8] = null;
    if (m.fl === "c"){
      if (m.t === 62){ B[61] = B[63]; B[63] = null; }
      else if (m.t === 58){ B[59] = B[56]; B[56] = null; }
      else if (m.t === 6){ B[5] = B[7]; B[7] = null; }
      else if (m.t === 2){ B[3] = B[0]; B[0] = null; }
    }
    this.ep = m.fl === "2" ? (m.f + m.t) / 2 : -1;
    this.half = (piece.toLowerCase() === "p" || st.cap) ? 0 : this.half + 1;
    if (piece === "K"){ this.cast.K = this.cast.Q = false; }
    if (piece === "k"){ this.cast.k = this.cast.q = false; }
    for (const sq of [m.f, m.t]){
      if (sq === 63) this.cast.K = false;
      if (sq === 56) this.cast.Q = false;
      if (sq === 7)  this.cast.k = false;
      if (sq === 0)  this.cast.q = false;
    }
    if (!white) this.full++;
    this.turn = white ? "b" : "w";
    this.hist.push({ m, st });
  }

  unmake(){
    const h = this.hist.pop();
    if (!h) return;
    const { m, st } = h;
    this.turn = this.turn === "w" ? "b" : "w";
    const white = this.turn === "w", B = this.board;
    B[m.f] = m.pr ? (white ? "P" : "p") : B[m.t];
    B[m.t] = null;
    if (m.fl === "e"){ B[white ? m.t+8 : m.t-8] = st.cap; }
    else if (st.cap){ B[m.t] = st.cap; }
    if (m.fl === "c"){
      if (m.t === 62){ B[63] = B[61]; B[61] = null; }
      else if (m.t === 58){ B[56] = B[59]; B[59] = null; }
      else if (m.t === 6){ B[7] = B[5]; B[5] = null; }
      else if (m.t === 2){ B[0] = B[3]; B[3] = null; }
    }
    this.cast = st.cast; this.ep = st.ep; this.half = st.half; this.full = st.full;
  }

  legalMoves(){
    const side = this.turn;
    return this.genPseudo(side).filter(m => {
      this.make(m);
      const ok = !this.inCheck(side);
      this.unmake();
      return ok;
    });
  }

  san(m, legal){
    if (m.fl === "c") {
      let s = (m.t === 62 || m.t === 6) ? "O-O" : "O-O-O";
      return s + this._checkSuffix(m);
    }
    const piece = this.board[m.f], t = piece.toLowerCase();
    const cap = !!(this.board[m.t] || m.fl === "e");
    let s = "";
    if (t === "p"){
      if (cap) s += FILES[m.f & 7] + "x";
      s += sqName(m.t);
      if (m.pr) s += "=" + m.pr.toUpperCase();
    } else {
      s += t.toUpperCase();
      legal = legal || this.legalMoves();
      const others = legal.filter(o => o.t === m.t && o.f !== m.f &&
        this.board[o.f] && this.board[o.f].toLowerCase() === t);
      if (others.length){
        const sameFile = others.some(o => (o.f & 7) === (m.f & 7));
        const sameRank = others.some(o => (o.f >> 3) === (m.f >> 3));
        if (!sameFile) s += FILES[m.f & 7];
        else if (!sameRank) s += (8 - (m.f >> 3));
        else s += sqName(m.f);
      }
      if (cap) s += "x";
      s += sqName(m.t);
    }
    return s + this._checkSuffix(m);
  }

  _checkSuffix(m){
    this.make(m);
    let suf = "";
    if (this.inCheck(this.turn)) suf = this.legalMoves().length === 0 ? "#" : "+";
    this.unmake();
    return suf;
  }

  insufficientMaterial(){
    const pieces = [];
    for (let i = 0; i < 64; i++){
      const p = this.board[i];
      if (p && p.toLowerCase() !== "k") pieces.push({ p: p.toLowerCase(), sq: i });
    }
    if (pieces.length === 0) return true;
    if (pieces.length === 1 && (pieces[0].p === "n" || pieces[0].p === "b")) return true;
    if (pieces.length === 2 && pieces.every(x => x.p === "b")){
      const c0 = ((pieces[0].sq >> 3) + (pieces[0].sq & 7)) % 2;
      const c1 = ((pieces[1].sq >> 3) + (pieces[1].sq & 7)) % 2;
      if (c0 === c1) return true;
    }
    return false;
  }

  /* status for variant play. opts: {variant, checks:{w,b}, repMap} */
  status(opts){
    opts = opts || {};
    const v = opts.variant || "standard";
    const mover = this.turn === "w" ? "b" : "w"; // side that just moved
    if (v === "koth"){
      const CENTER = [27, 28, 35, 36]; // d5 e5 d4 e4
      for (const side of ["w","b"]){
        if (CENTER.includes(this.kingSq(side)))
          return { over: true, result: side === "w" ? "1-0" : "0-1", reason: "king reached the hill" };
      }
    }
    if (v === "3check" && opts.checks){
      if (opts.checks.w >= 3) return { over: true, result: "1-0", reason: "three checks delivered" };
      if (opts.checks.b >= 3) return { over: true, result: "0-1", reason: "three checks delivered" };
    }
    const legal = this.legalMoves();
    if (legal.length === 0){
      if (this.inCheck(this.turn))
        return { over: true, result: this.turn === "w" ? "0-1" : "1-0", reason: "checkmate" };
      return { over: true, result: "1/2-1/2", reason: "stalemate" };
    }
    if (this.half >= 100) return { over: true, result: "1/2-1/2", reason: "50-move rule" };
    if (this.insufficientMaterial()) return { over: true, result: "1/2-1/2", reason: "insufficient material" };
    if (opts.repMap && (opts.repMap.get(this.key()) || 0) >= 3)
      return { over: true, result: "1/2-1/2", reason: "threefold repetition" };
    return { over: false, mover };
  }

  perft(d){
    if (d === 0) return 1;
    let n = 0;
    for (const m of this.legalMoves()){ this.make(m); n += this.perft(d-1); this.unmake(); }
    return n;
  }
}

/* ---------------- Chess960 start position (castling disabled in our 960 mode) -------- */
function fen960(){
  const back = new Array(8).fill(null);
  const rnd = n => Math.floor(Math.random() * n);
  const lights = [1,3,5,7], darks = [0,2,4,6];
  back[lights[rnd(4)]] = "b";
  back[darks[rnd(4)]] = "b";
  let free = [];
  for (let i = 0; i < 8; i++) if (!back[i]) free.push(i);
  back[free.splice(rnd(free.length),1)[0]] = "q";
  back[free.splice(rnd(free.length),1)[0]] = "n";
  back[free.splice(rnd(free.length),1)[0]] = "n";
  // remaining three: R K R in order
  back[free[0]] = "r"; back[free[1]] = "k"; back[free[2]] = "r";
  const row = back.join("");
  return row + "/pppppppp/8/8/8/8/PPPPPPPP/" + row.toUpperCase() + " w - - 0 1";
}

/* ---------------- Evaluation & search ---------------- */
const VAL = { p:100, n:320, b:330, r:500, q:900, k:0 };
const PST = {
  p: [ 0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10,
       5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5,
       5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0 ],
  n: [ -50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30,
       -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30,
       -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50 ],
  b: [ -20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10,
       -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10,
       -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20 ],
  r: [ 0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5,
       -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0 ],
  q: [ -20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10,
       -5,0,5,5,5,5,0,-5, 0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10,
       -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20 ],
  k: [ -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30,
       -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30,
       -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10,
       20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20 ]
};
const MATE = 100000;

const AI = {
  nodes: 0,
  maxNodes: 400000,

  evaluate(g, persona){
    let score = 0;
    const B = g.board;
    let wk = -1, bk = -1, wm = 0, bm = 0;
    for (let i = 0; i < 64; i++){
      const p = B[i];
      if (!p) continue;
      const t = p.toLowerCase();
      if (p === "K") wk = i;
      if (p === "k") bk = i;
      if (p >= "A" && p <= "Z"){ score += VAL[t] + PST[t][i]; wm += VAL[t]; }
      else { score -= VAL[t] + PST[t][i ^ 56]; bm += VAL[t]; }
    }
    /* mop-up: when the defender is down to (almost) a bare king, reward driving
       his king to the edge and bringing our king close — otherwise shallow
       search shuffles pieces until the 50-move rule saves the loser */
    if (wk >= 0 && bk >= 0){
      const kd = Math.max(Math.abs((wk & 7) - (bk & 7)), Math.abs((wk >> 3) - (bk >> 3)));
      if (bm <= 330 && wm >= 400){
        const f = bk & 7, r = bk >> 3;
        const edge = Math.min(f, 7 - f, r, 7 - r);
        score += (3 - edge) * 28 + (7 - kd) * 14;
      }
      if (wm <= 330 && bm >= 400){
        const f = wk & 7, r = wk >> 3;
        const edge = Math.min(f, 7 - f, r, 7 - r);
        score -= (3 - edge) * 28 + (7 - kd) * 14;
      }
    }
    if (persona === "attack" && wk >= 0 && bk >= 0){
      // reward proximity of pieces to enemy king (both sides so search stays sound)
      for (let i = 0; i < 64; i++){
        const p = B[i];
        if (!p) continue;
        const t = p.toLowerCase();
        if (t === "p" || t === "k") continue;
        const target = (p >= "A" && p <= "Z") ? bk : wk;
        const dist = Math.max(Math.abs((i&7)-(target&7)), Math.abs((i>>3)-(target>>3)));
        const bonus = (7 - dist) * 4;
        score += (p >= "A" && p <= "Z") ? bonus : -bonus;
      }
    }
    return g.turn === "w" ? score : -score;
  },

  orderMoves(g, moves){
    const B = g.board;
    for (const m of moves){
      let s = 0;
      const victim = m.fl === "e" ? "p" : (B[m.t] ? B[m.t].toLowerCase() : null);
      if (victim) s += 10 * VAL[victim] - VAL[B[m.f].toLowerCase()];
      if (m.pr) s += VAL[m.pr] * 8;
      m._s = s;
    }
    moves.sort((a,b) => b._s - a._s);
    return moves;
  },

  qsearch(g, alpha, beta, persona, qd){
    this.nodes++;
    const stand = this.evaluate(g, persona);
    if (stand >= beta) return beta;
    if (stand > alpha) alpha = stand;
    if (qd <= 0 || this.nodes > this.maxNodes) return alpha;
    const side = g.turn;
    const caps = g.genPseudo(side).filter(m => g.board[m.t] || m.fl === "e");
    this.orderMoves(g, caps);
    for (const m of caps){
      g.make(m);
      if (g.inCheck(side)){ g.unmake(); continue; }
      const s = -this.qsearch(g, -beta, -alpha, persona, qd - 1);
      g.unmake();
      if (s >= beta) return beta;
      if (s > alpha) alpha = s;
    }
    return alpha;
  },

  search(g, depth, alpha, beta, persona, useQ, ply){
    this.nodes++;
    if (depth === 0){
      return useQ ? this.qsearch(g, alpha, beta, persona, 6) : this.evaluate(g, persona);
    }
    const side = g.turn;
    if (g.half >= 100) return 0;
    const moves = this.orderMoves(g, g.genPseudo(side));
    let legalCount = 0;
    let best = -Infinity;
    for (const m of moves){
      g.make(m);
      if (g.inCheck(side)){ g.unmake(); continue; }
      legalCount++;
      const s = -this.search(g, depth - 1, -beta, -alpha, persona, useQ, ply + 1);
      g.unmake();
      if (s > best) best = s;
      if (s > alpha) alpha = s;
      if (alpha >= beta) break;
      if (this.nodes > this.maxNodes) break;
    }
    if (legalCount === 0) return g.inCheck(side) ? -(MATE - ply) : 0;
    return best;
  },

  /* bestMove: returns {move, score, ranked} — jitter picks randomly among near-best */
  bestMove(g, opts){
    opts = opts || {};
    const depth = opts.depth || 2, useQ = !!opts.qs, persona = opts.persona || null;
    this.nodes = 0;
    const repMap = opts.repMap || null;
    const moves = this.orderMoves(g, g.legalMoves());
    if (!moves.length) return null;
    const ranked = [];
    let alpha = -Infinity;
    for (const m of moves){
      g.make(m);
      let s;
      const reps = repMap ? (repMap.get(g.key()) || 0) : 0;
      if (reps >= 2){
        s = 0; // this move claims a threefold draw
      } else {
        s = -this.search(g, depth - 1, -Infinity, -alpha + 50, persona, useQ, 1);
        if (reps >= 1) s -= 20; // discourage aimless shuffling
      }
      g.unmake();
      ranked.push({ m, s });
      if (s > alpha) alpha = s;
    }
    ranked.sort((a,b) => b.s - a.s);
    const jitter = opts.jitter || 0;
    const pool = ranked.filter(r => r.s >= ranked[0].s - jitter);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return { move: pick.m, score: pick.s, best: ranked[0], ranked };
  },

  /* all moves that give immediate checkmate */
  matingMoves(g){
    const out = [];
    const side = g.turn;
    for (const m of g.legalMoves()){
      g.make(m);
      if (g.inCheck(g.turn) && g.legalMoves().length === 0) out.push(m);
      g.unmake();
    }
    return out;
  },

  /* moves that force mate in 2 (or mate immediately) */
  mate2Moves(g){
    const out = [];
    for (const m of g.legalMoves()){
      g.make(m);
      const replies = g.legalMoves();
      if (replies.length === 0){
        if (g.inCheck(g.turn)){ out.push(m); g.unmake(); continue; } // immediate mate
        g.unmake(); continue; // stalemate
      }
      let allMated = true;
      for (const r of replies){
        g.make(r);
        if (this.matingMoves(g).length === 0) allMated = false;
        g.unmake();
        if (!allMated) break;
      }
      if (allMated) out.push(m);
      g.unmake();
    }
    return out;
  }
};

/* export for node testing */
if (typeof module !== "undefined") module.exports = { Game, AI, fen960, sqName, nameSq, START_FEN };
