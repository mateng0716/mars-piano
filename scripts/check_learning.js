// Pure signal and rhythm checks; these do not certify a physical microphone or piano.
const fs = require("node:fs"),
  vm = require("node:vm"),
  assert = require("node:assert/strict"),
  path = require("node:path");
const root = path.resolve(__dirname, ".."),
  context = vm.createContext({ console, Float32Array, Math, Set, Map });
vm.runInContext(
  fs.readFileSync(path.join(root, "piano-input.js"), "utf8"),
  context,
);
vm.runInContext(
  fs.readFileSync(path.join(root, "piano-adventure.js"), "utf8"),
  context,
);
const signal = vm.runInContext("PianoSignal", context),
  data = vm.runInContext("PianoAdventureData", context);
let count = 0;
function check(name, run) {
  run();
  count++;
  console.log("PASS " + name);
}
check("silence is not a note", () =>
  assert.equal(signal.pitchFromPCM(new Float32Array(2048), 48000), null),
);
for (const rate of [44100, 48000])
  for (const number of [48, 60, 63, 67, 72, 84])
    check(`piano fundamental ${number} at ${rate} Hz`, () => {
      const hz = 440 * 2 ** ((number - 69) / 12),
        samples = Float32Array.from(
          { length: 2048 },
          (_, i) =>
            0.16 * Math.sin((2 * Math.PI * hz * i) / rate) +
            0.07 * Math.sin((4 * Math.PI * hz * i) / rate) +
            0.025 * Math.sin((6 * Math.PI * hz * i) / rate),
        );
      const estimate = signal.pitchFromPCM(samples, rate);
      assert.ok(estimate);
      assert.ok(
        Math.abs(1200 * Math.log2(estimate / hz)) < 20,
        `${hz} -> ${estimate}`,
      );
    });
check("unpitched noise is not a stable piano note", () => {
  let seed = 8231;
  const samples = Float32Array.from({ length: 2048 }, () => {
    seed = (seed * 16807) % 2147483647;
    return (seed / 2147483647 - 0.5) * 0.1;
  });
  assert.equal(signal.pitchFromPCM(samples, 48000), null);
});
check("a held note emits once; silence re-arms same-note input", () => {
  const gate = new signal.NoteGate(),
    hits = [];
  for (let t = 0; t <= 500; t += 60) {
    const note = gate.sample(0.04, 60, t);
    if (note) hits.push(note);
  }
  assert.equal(hits.length, 1);
  gate.sample(0, null, 600);
  gate.sample(0, null, 750);
  gate.sample(0.05, 60, 900);
  assert.equal(gate.sample(0.05, 60, 960), "C4");
});
check("a stable changed pitch emits without requiring silence", () => {
  const gate = new signal.NoteGate();
  gate.sample(0.04, 60, 0);
  assert.equal(gate.sample(0.04, 60, 60), "C4");
  gate.sample(0.04, 62, 400);
  assert.equal(gate.sample(0.04, 62, 460), "D4");
});
check("a fresh attack allows repeated piano notes", () => {
  const gate = new signal.NoteGate();
  gate.sample(0.04, 60, 0);
  gate.sample(0.04, 60, 60);
  gate.sample(0.015, 60, 400);
  assert.equal(gate.sample(0.07, 60, 460), "C4");
  assert.equal(gate.sample(0.06, 60, 520), null);
  assert.equal(gate.sample(0.05, 60, 580), null);
});
check("rhythm onset gate ignores sustain", () => {
  const gate = new signal.NoteGate();
  assert.equal(gate.sample(0.04, null, 0, true), "C4");
  assert.equal(gate.sample(0.04, null, 200, true), null);
  gate.sample(0.01, null, 300, true);
  assert.equal(gate.sample(0.05, null, 500, true), "C4");
});
for (const [level, patterns] of data.rhythms.entries())
  for (const [round, pattern] of patterns.entries())
    check(
      `rhythm level ${level} round ${round}, free tempo and latency`,
      () => {
        const expected = data.rhythmOnsets(pattern);
        for (const beat of [450, 690, 1100]) {
          const taps = expected.map(
            (value, i) => 5000 + value * beat + (i % 2 ? 34 : -21),
          );
          assert.equal(data.assessRhythm(expected, taps).matched, true);
        }
      },
    );
check("equal gaps do not pass a short-long pattern", () =>
  assert.equal(data.assessRhythm([0, 1, 3], [0, 600, 1200]).matched, false),
);
check("a rest must occupy time between taps", () =>
  assert.equal(data.assessRhythm([0, 2, 3], [0, 650, 1300]).matched, false),
);
check("duplicate chord events do not count as a rhythm", () =>
  assert.equal(data.assessRhythm([0, 1, 2], [0, 0, 600]).matched, false),
);
check("all six foundations have matching visual labels", () => {
  assert.equal(data.foundations.length, 6);
  for (const lesson of data.foundations)
    assert.equal(lesson.notes.length, lesson.labels.length);
});
check("echo phrases include repeated-note practice at every level", () => {
  for (const level of data.echoes)
    assert.ok(
      level.some((phrase) =>
        phrase.some((note, i) => i && note === phrase[i - 1]),
      ),
    );
});
console.log(`${count} learning checks passed.`);
