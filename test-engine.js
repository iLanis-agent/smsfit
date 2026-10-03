var S = require('./engine.js'); var fails = 0, n = 0;
function eq(a, b, m) { n++; if (a !== b) { fails++; console.log('FAIL', m, a, b); } }
function rep(c, k) { return new Array(k + 1).join(c); }
// limits from Twilio's SMS character limit table: GSM-7 160 single / 153 per segment, UCS-2 70 / 67
eq(S.analyze('').segments, 0, 'empty');
eq(S.analyze(rep('a', 160)).segments, 1, '160 gsm = 1'); eq(S.analyze(rep('a', 161)).segments, 2, '161 gsm = 2'); eq(S.analyze(rep('a', 306)).segments, 2, '306 = 2'); eq(S.analyze(rep('a', 307)).segments, 3, '307 = 3');
eq(S.analyze(rep('\u4f60', 70)).segments, 1, '70 ucs2 = 1'); eq(S.analyze(rep('\u4f60', 71)).segments, 2, '71 ucs2 = 2'); eq(S.analyze(rep('\u4f60', 134)).segments, 2, '134 = 2'); eq(S.analyze(rep('\u4f60', 135)).segments, 3, '135 = 3');
eq(S.analyze('hello').encoding, 'gsm', 'gsm'); eq(S.analyze('hello \u4f60').encoding, 'ucs2', 'ucs2');
// extension characters cost 2 septets (3GPP 23.038 extension table)
eq(S.analyze('\u20ac').length, 2, 'euro = 2'); eq(S.analyze('[]{}\\^~|').length, 16, 'ext = 2 each'); eq(S.analyze(rep('\u20ac', 80)).segments, 1, '80 euro = 160 septets = 1'); eq(S.analyze(rep('\u20ac', 81)).segments, 2, '81 euro = 162 = 2');
// ext char is not split across a segment: 152 a + euro = 154 septets, segment 1 keeps 152 and the euro moves to segment 2
var r = S.analyze(rep('a', 152) + '\u20ac' + rep('b', 10)); eq(r.segments, 2, 'ext not split'); eq(r.used[0], 152, 'first seg 152'); eq(r.used[1], 12, 'second seg 12'); eq(S.analyze(rep('a', 152) + '\u20ac').segments, 1, '154 septets fit one single message');
// basic table characters are one septet
eq(S.analyze('@\u00a3$\u00a5\u00e8\u00e9\u00f9\u00ec\u00f2\u00c7').length, 10, 'basic row 1'); eq(S.analyze('\u00c4\u00d6\u00d1\u00dc\u00a7\u00bf\u00e4\u00f6\u00f1\u00fc\u00e0').encoding, 'gsm', 'accented in table');
eq(S.analyze('\u00e1').encoding, 'ucs2', 'a-acute is not in the default alphabet'); eq(S.analyze('`').encoding, 'ucs2', 'backtick not in GSM-7');
eq(S.analyze('\u201cquote\u201d').encoding, 'ucs2', 'curly quotes force UCS-2'); eq(S.analyze(S.simplify('\u201cquote\u201d')).encoding, 'gsm', 'simplified is GSM');
// emoji are 2 UTF-16 units; a pair is never split between segments
eq(S.analyze('\ud83d\ude00').length, 2, 'emoji = 2 units'); r = S.analyze(rep('a', 66) + '\ud83d\ude00' + rep('a', 70) + '\ud83d\ude00' ); eq(r.encoding, 'ucs2', 'emoji ucs2'); eq(r.used[0], 66, 'emoji pair moved'); eq(r.used.every(function (u) { return u <= 67; }), true, 'no seg over 67');
// every segment stays within the limit for random mixes
var pool = ['a', 'b', ' ', '\u20ac', '[', '\u00e9', '\u4f60', '\ud83d\ude00'], seed = 7;
function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
for (var t = 0; t < 300; t++) { var s = ''; var len = Math.floor(rnd() * 400); for (var k = 0; k < len; k++) s += pool[Math.floor(rnd() * pool.length)]; var a = S.analyze(s); var tot = a.used.reduce(function (x, y) { return x + y; }, 0); eq(tot, a.length, 'sum ' + t); if (a.segments > 1) eq(a.used.every(function (u) { return u <= a.perSegment; }), true, 'limit ' + t); }
eq(S.offenders('h\u00e9llo \u201cx\u201d \u201c').join(''), '\u201c\u201d', 'offenders unique');
console.log(n + ' checks, ' + fails + ' failures'); process.exit(fails ? 1 : 0);
