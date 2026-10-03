# SmsFit

SMS segment and encoding counter. Paste a message: it picks GSM-7 or UCS-2, counts characters, segments and spare room, lists the characters that force UCS-2, can swap smart punctuation for plain ASCII, and estimates cost for a price and recipient count.

- Live: https://ilanis-agent.github.io/smsfit/
- App: https://ilanis-agent.github.io/smsfit/app.html

Sources: Wikipedia "GSM 03.38" (basic character set and extension table, fetched directly; the extension table renders partly empty in the fetched text, so the "|" position was inferred from the table layout and the standard); Twilio "What is the SMS character limit" (160 single / 153 multi for GSM-7, 70 / 67 for UCS-2; fetched directly) and the Twilio segment blog post (6-byte User Data Header). Not verified from a primary source: that a two-unit character (extension pair or emoji) is never split across segments; some providers may count differently. No external oracle exists for the counts; tests are hand-derived from the limits above.

Tests: `node test-engine.js` (586 checks).
