(function (root) {
  // GSM 03.38 / 3GPP TS 23.038 default alphabet (1 septet each) and extension table (ESC + char = 2 septets)
  var BASIC = '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\u001bÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';
  var EXT = '\f^{}\\[~]|€';
  var SINGLE = 160, MULTI = 153, SINGLE_U = 70, MULTI_U = 67;
  var basicSet = {}, extSet = {}, i;
  for (i = 0; i < BASIC.length; i++) if (BASIC.charAt(i) !== '\u001b') basicSet[BASIC.charAt(i)] = 1;
  for (i = 0; i < EXT.length; i++) extSet[EXT.charAt(i)] = 1;
  function units(text, enc) { // array of cost per character (a character is a code point)
    var chars = Array.from(text), out = [];
    chars.forEach(function (c) { out.push({ ch: c, cost: enc === 'gsm' ? (basicSet[c] ? 1 : 2) : c.length }); });
    return out;
  }
  function isGsm(text) { return Array.from(text).every(function (c) { return basicSet[c] || extSet[c]; }); }
  function offenders(text) { var seen = {}, out = []; Array.from(text).forEach(function (c) { if (!basicSet[c] && !extSet[c] && !seen[c]) { seen[c] = 1; out.push(c); } }); return out; }
  // split into segments without breaking a 2-unit character across segments
  function analyze(text) {
    var enc = isGsm(text) ? 'gsm' : 'ucs2', cs = units(text, enc), total = 0;
    cs.forEach(function (c) { total += c.cost; });
    var single = enc === 'gsm' ? SINGLE : SINGLE_U, multi = enc === 'gsm' ? MULTI : MULTI_U;
    if (total === 0) return { encoding: enc, length: 0, segments: 0, perSegment: single, used: [] };
    if (total <= single) return { encoding: enc, length: total, segments: 1, perSegment: single, used: [total], perCharLimit: single };
    var used = [], cur = 0;
    cs.forEach(function (c) { if (cur + c.cost > multi) { used.push(cur); cur = 0; } cur += c.cost; });
    used.push(cur);
    return { encoding: enc, length: total, segments: used.length, perSegment: multi, used: used, perCharLimit: multi };
  }
  var FIX = { '\u201c': '"', '\u201d': '"', '\u2018': "'", '\u2019': "'", '\u2013': '-', '\u2014': '-', '\u2026': '...', '\u00a0': ' ' };
  function simplify(text) { return Array.from(text).map(function (c) { return FIX[c] !== undefined ? FIX[c] : c; }).join(''); }
  var api = { analyze: analyze, isGsm: isGsm, offenders: offenders, simplify: simplify, BASIC: BASIC, EXT: EXT, LIMITS: { single: SINGLE, multi: MULTI, singleU: SINGLE_U, multiU: MULTI_U } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.SmsFit = api;
})(typeof window !== 'undefined' ? window : this);
