/* Original pre-staff exercises, informed by the sequence of Bastien's primers. */
const PianoAdventureData = (() => {
  const foundations = [
    {
      id: "twins",
      title: "两颗黑键的家",
      symbol: "Ⅱ",
      summary: "先找到两个一组的黑键",
      message: "找到并排的两颗黑键，听一听，再轮流弹。",
      tip: "在真琴上找不同位置的“两颗黑键”。让孩子自己指给你看，再轻轻弹；不急着背升降号名字。",
      notes: ["C#4", "D#4", "D#4", "C#4"],
      labels: ["左边", "右边", "右边", "左边"],
      family: "black",
    },
    {
      id: "triples",
      title: "三颗黑键的小队",
      symbol: "Ⅲ",
      summary: "听见三个一组的黑键",
      message: "三颗黑键排排站，从左到右，再走回来。",
      tip: "先在真琴上用眼睛找三个一组，和两个一组做对比。黑键练习可换到别的八度，手臂保持放松。",
      notes: ["F#4", "G#4", "A#4", "G#4", "F#4"],
      labels: ["左边", "中间", "右边", "中间", "左边"],
      family: "black",
    },
    {
      id: "register",
      title: "声音住在哪里",
      symbol: "↗",
      summary: "低低的声音，高高的声音",
      message: "先听低低和高高的声音，再用任意低音、高音回答。",
      tip: "低音在左，高音在右。请孩子在真琴上试一试，不必局限于屏幕示范的四个音。",
      notes: ["C3", "C5", "D3", "E5"],
      labels: ["低低的", "高高的", "低低的", "高高的"],
      ranges: ["low", "high", "low", "high"],
    },
    {
      id: "relay",
      title: "左右手来接力",
      symbol: "↔",
      summary: "左边打招呼，右边来回答",
      message: "左手弹低处，右手弹高处，轮流打个招呼。",
      tip: "由家长观察是否真的轮换左右手，网页只检查音高。每只手选一个舒服的手指即可，手腕不绷紧。",
      notes: ["C3", "D3", "C4", "D4"],
      labels: ["左手 Do", "左手 Re", "右手 Do", "右手 Re"],
    },
    {
      id: "long-short",
      title: "长音，短音",
      symbol: "♩𝅗𝅥",
      summary: "先听长短，再轻轻数拍子",
      message: "短短、长长、短短、长长。边弹边轻轻数一数。",
      tip: "跟着示范唱“哒，哒—”。这里不按时值判错；家长观察长音有没有保持，再到节奏小火车练落键的间隔。",
      notes: ["C4", "D4", "C4", "D4"],
      labels: ["一拍", "两拍", "一拍", "两拍"],
      beats: [1, 2, 1, 2],
    },
    {
      id: "first-melody",
      title: "我的第一句音乐",
      symbol: "♫",
      summary: "Do、Re、Mi，编成一句话",
      message: "三颗白键，连成自己的小旋律。听完再弹给家人听。",
      tip: "在两个黑键左边找 Do，然后找到 Re、Mi。示范是原创小乐句，试着让孩子自己换一个结尾。之后可进入高音谱号课。",
      notes: ["C4", "D4", "E4", "D4", "C4"],
      labels: ["Do", "Re", "Mi", "Re", "Do"],
    },
  ];
  const echoes = [
    [
      ["C4", "E4"],
      ["E4", "D4"],
      ["C4", "C4"],
    ],
    [
      ["C4", "D4", "E4"],
      ["G4", "E4", "D4"],
      ["E4", "E4", "C4"],
    ],
    [
      ["C4", "E4", "G4", "E4"],
      ["G4", "F4", "D4", "C4"],
      ["D4", "E4", "E4", "C4"],
    ],
  ];
  const rhythms = [
    [
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
    ],
    [
      [1, 2, 1],
      [2, 1, 1],
      [1, 1, 2, 1],
    ],
    [
      [1, { rest: 1 }, 1, 1],
      [1, 1, { rest: 1 }, 1],
      [1, { rest: 1 }, 1, { rest: 1 }, 1],
    ],
  ];
  function rhythmOnsets(pattern) {
    let beat = 0;
    const out = [];
    for (const item of pattern) {
      if (typeof item === "number") {
        out.push(beat);
        beat += item;
      } else beat += item.rest;
    }
    return out;
  }
  function assessRhythm(onsets, times) {
    if (onsets.length !== times.length || times.length < 2)
      return { matched: false, maxError: Infinity };
    const wanted = onsets.slice(1).map((value, i) => value - onsets[i]),
      heard = times.slice(1).map((value, i) => value - times[i]);
    if (heard.some((interval) => interval < 130))
      return { matched: false, maxError: Infinity };
    const ratios = heard
        .map((value, i) => value / wanted[i])
        .sort((a, b) => a - b),
      middle = Math.floor(ratios.length / 2);
    const beat =
      ratios.length % 2
        ? ratios[middle]
        : (ratios[middle - 1] + ratios[middle]) / 2;
    const errors = heard.map((value, i) => Math.abs(value - wanted[i] * beat));
    const matched = errors.every(
      (error, i) => error <= Math.max(130, wanted[i] * beat * 0.28),
    );
    return { matched, beat, maxError: Math.max(...errors) };
  }
  return { foundations, echoes, rhythms, rhythmOnsets, assessRhythm };
})();

(() => {
  if (typeof document === "undefined") return;
  const q = (id) => document.getElementById(id),
    KEY = "mars-piano-discoveries-v1";
  const validIds = new Set(
    PianoAdventureData.foundations.map((item) => item.id),
  );
  let storageFailed = false;
  let profile = { foundations: [], courses: [], days: {}, lastCourse: 0 };
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (raw && typeof raw === "object") {
      profile.foundations = Array.isArray(raw.foundations)
        ? [...new Set(raw.foundations.filter((id) => validIds.has(id)))]
        : [];
      profile.courses = Array.isArray(raw.courses)
        ? [
            ...new Set(
              raw.courses.filter(
                (i) =>
                  Number.isInteger(i) && i >= 0 && i < COURSE_LESSONS.length,
              ),
            ),
          ]
        : [];
      profile.lastCourse =
        Number.isInteger(raw.lastCourse) &&
        raw.lastCourse >= 0 &&
        raw.lastCourse < COURSE_LESSONS.length
          ? raw.lastCourse
          : 0;
      if (raw.days && typeof raw.days === "object")
        for (const [day, items] of Object.entries(raw.days))
          if (/^\d{4}-\d{2}-\d{2}$/.test(day) && Array.isArray(items))
            profile.days[day] = [
              ...new Set(
                items.filter((item) =>
                  ["warm", "listen", "read"].includes(item),
                ),
              ),
            ];
    }
  } catch {}
  function localDay() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }
  function save() {
    profile.days = Object.fromEntries(
      Object.entries(profile.days)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 30),
    );
    try {
      localStorage.setItem(KEY, JSON.stringify(profile));
      storageFailed = false;
    } catch {
      storageFailed = true;
    }
    renderHome();
  }
  function markDaily(category) {
    const day = localDay();
    profile.days[day] = [...new Set([...(profile.days[day] || []), category])];
    save();
  }
  function renderHome() {
    const done = profile.days[localDay()] || [];
    q("dayProgress").textContent = storageFailed
      ? "本次发现未能保存，仍可继续玩"
      : done.length
        ? `今天收集了 ${done.length} 个小发现`
        : "今天的三个小发现";
    document.querySelectorAll("[data-daily]").forEach((button) => {
      const complete = done.includes(button.dataset.daily);
      button.classList.toggle("done", complete);
      button.querySelector(".stop-number").textContent = complete
        ? "✓"
        : { warm: "01", listen: "02", read: "03" }[button.dataset.daily];
    });
    q("courseProgress").textContent = profile.courses.length
      ? `已探索 ${profile.courses.length}/19 · 打开课程 ↗`
      : "打开课程 ↗";
    q("homeStartBtn").innerHTML =
      (done.length === 3
        ? "今天真棒，自由弹一会"
        : done.length
          ? "继续今天的探险"
          : "开启今天的探险") + " <span>↗</span>";
  }
  function nextFoundation() {
    const index = PianoAdventureData.foundations.findIndex(
      (item) => !profile.foundations.includes(item.id),
    );
    return index < 0 ? 0 : index;
  }
  window.PianoLearning = {
    renderHome,
    hasCourse: (i) => profile.courses.includes(i),
    rememberCourse(i) {
      profile.lastCourse = i;
      save();
    },
    completeReading(course, piece) {
      if (
        Number.isInteger(course) &&
        course >= 0 &&
        !profile.courses.includes(course)
      )
        profile.courses.push(course);
      if (course !== null || piece !== null) markDaily("read");
    },
  };

  let session = null,
    playbackTimers = [],
    feedbackTimer = null,
    runId = 0,
    lastAccepted = -Infinity,
    drawerFocus = null;
  const pitchLabel = (note) =>
    (({ C: "Do", D: "Re", E: "Mi", F: "Fa", G: "Sol", A: "La", B: "Si" })[
      note?.[0]
    ] || "♪") + (note?.includes("#") ? "♯" : "");
  const clearKeyHint = () =>
    q("keyboard")
      .querySelectorAll(".target,.demo,[data-finger]")
      .forEach((key) => {
        key.classList.remove("target", "demo");
        key.removeAttribute("data-finger");
      });
  function clearPlayback() {
    runId++;
    for (const id of playbackTimers) clearTimeout(id);
    playbackTimers = [];
    clearTimeout(feedbackTimer);
    feedbackTimer = null;
    for (const key of [...voices.keys()])
      if (String(key).startsWith("lab-")) stopTone(key);
    q("keyboard")
      .querySelectorAll(".demo")
      .forEach((key) => key.classList.remove("demo"));
  }
  const later = (callback, delay) => {
    const id = setTimeout(callback, delay);
    playbackTimers.push(id);
    return id;
  };
  function data() {
    if (!session) return null;
    if (session.kind === "foundation")
      return PianoAdventureData.foundations[session.index];
    if (session.kind === "echo")
      return {
        notes: PianoAdventureData.echoes[session.difficulty][session.round],
      };
    return {
      pattern: PianoAdventureData.rhythms[session.difficulty][session.round],
    };
  }
  function targetPitch() {
    const current = data();
    return current?.notes?.[session.cursor] || current?.notes?.[0] || "C4";
  }
  function refreshHint() {
    clearKeyHint();
    if (!session || !["idle", "responding", "retry"].includes(session.phase))
      return;
    if (session.kind === "foundation" || session.hint) {
      const note = targetPitch();
      q("keyboard")
        .querySelector(`[data-note="${note}"]`)
        ?.classList.add("target");
    }
  }
  function mount(kind, index = 0, difficulty = 0) {
    leave();
    leaveGame();
    clearTimeout(timer);
    stopPlayback();
    stopSinging();
    if (narrationAudio) {
      narrationAudio.pause();
      narrationAudio = null;
    }
    courseIndex = null;
    pieceIndex = null;
    freeNote = null;
    locked = false;
    session = {
      kind,
      index,
      difficulty,
      round: 0,
      cursor: 0,
      phase: "idle",
      hint: false,
      playingIndex: -1,
      times: [],
      wrong: false,
    };
    lastAccepted = -Infinity;
    document.body.classList.remove(
      "show-home",
      "game-mode",
      "game-running",
      "piece-mode",
      "free-mode",
      "both-hands",
    );
    document.body.classList.add("lab-mode");
    q("courseDrawer").hidden = true;
    q("adventurePanel").hidden = false;
    q("gamePanel").hidden = true;
    q("groupCelebration").hidden = true;
    q("gameLeaderboard").hidden = true;
    q("gameResult").hidden = true;
    clearKeyColors();
    q("labParentTip").closest("details").open = false;
    renderPanel();
    requestAnimationFrame(locate);
  }
  function leave() {
    clearPlayback();
    clearKeyHint();
    session = null;
    document.body.classList.remove("lab-mode");
    q("adventurePanel").hidden = true;
  }
  function introMessage() {
    const current = data();
    return session.kind === "foundation"
      ? current.message
      : session.kind === "echo"
        ? "先听小旋律，再在琴键上弹回来。慢慢想，不用赶时间。"
        : "先听，再用任意一颗琴键回答。第一下由你出发，不用赶拍子。";
  }
  function renderProgress() {
    const n = session.kind === "foundation" ? 1 : 3,
      finished =
        session.phase === "done"
          ? n
          : session.round + (session.phase === "roundDone" ? 1 : 0);
    q("labProgress").innerHTML = Array.from(
      { length: n },
      (_, i) =>
        `<span class="${i < finished ? "done" : ""}" aria-label="${i < finished ? "已完成" : "还未完成"}">✦</span>`,
    ).join("");
    q("labProgress").setAttribute(
      "aria-label",
      `本次已完成 ${finished}/${n} 个小发现`,
    );
  }
  function renderPanel() {
    if (!session) return;
    const current = data(),
      kind = session.kind,
      phase = session.phase;
    q("adventurePanel").dataset.phase = phase;
    q("adventurePanel").dataset.kind = kind;
    q("labBadge").textContent =
      kind === "foundation"
        ? `FIRST LITTLE STEPS · ${String(session.index + 1).padStart(2, "0")} / 06`
        : kind === "echo"
          ? "LISTEN, REMEMBER & PLAY"
          : "FEEL THE RHYTHM";
    q("labTitle").textContent =
      kind === "foundation"
        ? current.title
        : kind === "echo"
          ? "旋律回声"
          : "节奏小火车";
    q("labDifficulty").hidden = kind === "foundation";
    const labels =
      kind === "echo"
        ? ["两颗音", "三颗音", "四颗音"]
        : ["一拍一拍", "有长有短", "停一停"];
    q("labDifficulty")
      .querySelectorAll("button")
      .forEach((button, i) => {
        button.textContent = labels[i];
        button.classList.toggle("selected", session.difficulty === i);
        button.setAttribute("aria-pressed", String(session.difficulty === i));
      });
    const messages = {
      idle: introMessage(),
      listening:
        kind === "rhythm"
          ? "先听火车怎么走，轮到你时再弹。"
          : "小耳朵准备好，先听一听。",
      responding:
        kind === "foundation"
          ? current.ranges
            ? `轮到你：${current.labels[session.cursor]}。`
            : "轮到你：" + current.message
          : kind === "echo"
            ? "轮到你了。把刚才的小旋律轻轻弹回来。"
            : "轮到你了，选一颗喜欢的琴键。",
      retry: "火车的长短和停顿，再听一遍就更熟悉了。",
      roundDone: "接住这句音乐了！准备好，再听下一句。",
      done:
        kind === "foundation"
          ? "又多了一个小发现，带到真正的钢琴上试试吧。"
          : "小耳朵和小手一起，完成了今天的音乐。",
      paused: "休息一下也很好。回来后，再听一遍就能继续。",
    };
    q("labMessage").textContent = session.wrong
      ? "差一点点，再试试这一颗。"
      : messages[phase] || "";
    q("labParentTip").textContent =
      kind === "foundation"
        ? current.tip
        : kind === "echo"
          ? "先哼一遍再找琴键，给孩子时间回想。需要时打开提示；正确音会留下来，弹错不会扣星。麦克风适合单音，松开延音踏板。"
          : "只比较各次落键之间的相对长短，允许整句快一点或慢一点，不评价最后一个音的保持时长。车厢“等”表示这一拍不弹；家长可以先和孩子拍手模仿。";
    q("labStart").hidden = !["idle", "paused", "retry"].includes(phase);
    q("labStart").textContent =
      phase === "paused"
        ? "再听，继续"
        : phase === "retry"
          ? "再试一次"
          : "先听一听";
    q("labReplay").hidden = !["responding", "retry"].includes(phase);
    q("labReplay").textContent = "再听一次";
    q("labHint").hidden =
      kind !== "echo" || !["idle", "responding"].includes(phase);
    q("labHint").textContent = session.hint ? "收起琴键提示" : "给我一点提示";
    q("labHint").setAttribute("aria-pressed", String(session.hint));
    q("labNext").hidden = !["roundDone", "done"].includes(phase);
    q("labNext").textContent =
      phase === "roundDone"
        ? "下一小段 →"
        : kind === "foundation"
          ? session.index < 5
            ? "下一个发现 →"
            : "去认识五线谱 →"
          : "再玩一小局 ↻";
    q("labHome").hidden = phase !== "done";
    renderProgress();
    renderStage();
    refreshHint();
  }
  function renderStage() {
    if (!session) return;
    const current = data(),
      phase = session.phase;
    if (phase === "done") {
      q("labStage").innerHTML =
        `<div class="lab-done"><span class="big-star" aria-hidden="true">✦</span><strong>${session.kind === "foundation" ? "今天的发现，收藏好了。" : "我听见，你的音乐了。"}</strong><p>${session.kind === "foundation" ? "在真琴上也弹一次，再给家人听。" : "不计快慢，不扣星。喜欢的话，明天再来。"}</p></div>`;
      return;
    }
    if (phase === "paused") {
      q("labStage").innerHTML =
        '<span class="paused-pill">音符在这里，等你回来 ♪</span>';
      return;
    }
    if (session.kind === "rhythm") {
      const pattern = current.pattern;
      let noteIndex = 0;
      q("labStage").innerHTML =
        '<div class="rhythm-track" aria-label="节奏火车，车厢表示一拍或两拍，空车厢表示停顿">' +
        pattern
          .map((item, i) => {
            const rest = typeof item !== "number",
              beats = rest ? item.rest : item,
              index = rest ? -1 : noteIndex++;
            const isCurrent =
              phase === "listening"
                ? session.playingIndex === i
                : !rest && index === session.cursor;
            const done =
              phase === "roundDone" || (!rest && index < session.cursor);
            return `<div class="rhythm-car ${rest ? "rest " : ""}${isCurrent ? "current " : ""}${done ? "done" : ""}" style="--beats:${beats}"><span aria-hidden="true">${rest ? "𝄽" : beats === 2 ? "𝅗𝅥" : "♩"}</span><small>${rest ? "等一拍" : beats === 2 ? "走—走" : "走"}</small></div>`;
          })
          .join("") +
        "</div>";
      return;
    }
    const show = session.kind === "foundation" || session.hint;
    const orbs = current.notes
      .map((note, i) => {
        const isCurrent =
          phase === "listening"
            ? session.playingIndex === i
            : phase === "responding" && i === session.cursor;
        const done = phase === "roundDone" || i < session.cursor;
        const label = current.labels?.[i] || pitchLabel(note),
          visible = show || done || (phase === "listening" && isCurrent);
        const mark = current.ranges ? (i % 2 ? "↑" : "↓") : "♪";
        return `<div class="sound-orb ${isCurrent ? "current " : ""}${done ? "done " : ""}${session.wrong && i === session.cursor ? "try-again" : ""}" aria-label="第 ${i + 1} 颗${done ? "已接住" : show ? " " + label : ""}"><span class="orb-note" aria-hidden="true">${current.ranges && visible ? mark : visible ? `<img src="${pianoAssetUrl("assets/lesson-art/blue-note.webp")}" alt="" draggable="false">` : "?"}</span><small>${visible ? label : "听一听"}</small></div>`;
      })
      .join("");
    const caption =
      session.kind === "foundation"
        ? current.family === "black"
          ? "在其他八度找到同一组黑键，也可以弹。"
          : current.ranges
            ? "琴键左边低，琴键右边高。"
            : current.beats
              ? "先听时值，再跟着唱；这里不按节拍判错。"
              : "先用耳朵听，再让手指回答。"
        : session.hint
          ? "提示陪你想一想，熟悉后可以收起来。"
          : "用耳朵记住它，再弹给音乐房听。";
    q("labStage").innerHTML =
      `<div class="foundation-display"><div class="echo-orbs">${orbs}</div><p class="foundation-caption">${caption}</p></div>`;
  }
  function play() {
    if (!session) return;
    clearPlayback();
    ensureAudio();
    const token = runId;
    session.cursor = 0;
    session.times = [];
    session.phase = "listening";
    session.playingIndex = -1;
    session.wrong = false;
    lastAccepted = -Infinity;
    clearKeyColors();
    renderPanel();
    const current = data(),
      unit = 690;
    let delay = 250;
    const sequence =
      session.kind === "rhythm"
        ? current.pattern.map((item) =>
            typeof item === "number"
              ? { note: "C4", beats: item }
              : { rest: true, beats: item.rest },
          )
        : current.notes.map((note, i) => ({
            note,
            beats: current.beats?.[i] || 1,
          }));
    for (const [i, item] of sequence.entries()) {
      const key = `lab-${token}-${i}`,
        start = delay;
      later(() => {
        if (!session || token !== runId) return;
        session.playingIndex = i;
        renderStage();
        q("keyboard")
          .querySelectorAll(".demo")
          .forEach((button) => button.classList.remove("demo"));
        if (item.note) {
          startTone(item.note, key);
          q("keyboard")
            .querySelector(`[data-note="${item.note}"]`)
            ?.classList.add("demo");
        }
      }, start);
      if (item.note)
        later(() => stopTone(key), start + unit * item.beats * 0.78);
      delay += unit * item.beats;
    }
    window.PianoInput?.suspend(delay + 650);
    later(() => {
      if (!session || token !== runId) return;
      session.phase = "responding";
      session.playingIndex = -1;
      q("keyboard")
        .querySelectorAll(".demo")
        .forEach((button) => button.classList.remove("demo"));
      renderPanel();
      window.PianoInput?.suspend(100);
    }, delay + 650);
  }
  function completeRound() {
    clearTimeout(feedbackTimer);
    session.wrong = false;
    clearKeyHint();
    session.phase =
      session.kind === "foundation" || session.round === 2
        ? "done"
        : "roundDone";
    if (session.phase === "done") {
      if (session.kind === "foundation") {
        const id = data().id;
        if (!profile.foundations.includes(id)) profile.foundations.push(id);
        markDaily("warm");
      } else markDaily("listen");
    }
    gameCue(true);
    window.PianoInput?.suspend(500);
    renderPanel();
  }
  function noteOn(note, detail = {}) {
    if (!session || session.phase !== "responding") return;
    const at = Number.isFinite(detail.at) ? detail.at : performance.now();
    if (at - lastAccepted < (session.kind === "rhythm" ? 130 : 90)) return;
    if (session.kind === "rhythm") {
      lastAccepted = at;
      session.times.push(at);
      session.cursor++;
      renderStage();
      const expected = PianoAdventureData.rhythmOnsets(data().pattern);
      if (session.cursor === expected.length) {
        const result = PianoAdventureData.assessRhythm(expected, session.times);
        if (result.matched) completeRound();
        else {
          session.phase = "retry";
          session.cursor = 0;
          renderPanel();
        }
      }
      return;
    }
    const current = data(),
      target = current.notes[session.cursor],
      number = midi(note),
      targetNumber = midi(target);
    if (!Number.isFinite(number)) return;
    const range = current.ranges?.[session.cursor],
      sameName = (number - targetNumber) % 12 === 0;
    const allowOctave =
      (session.kind === "foundation" && current.family === "black") ||
      (session.kind === "echo" && q("inputOctave").checked);
    const correct = range
      ? range === "low"
        ? number < 60
        : number >= 60
      : allowOctave
        ? sameName
        : note === target;
    clearTimeout(feedbackTimer);
    if (!correct) {
      session.wrong = true;
      renderPanel();
      feedbackTimer = setTimeout(() => {
        if (!session) return;
        session.wrong = false;
        renderPanel();
      }, 650);
      return;
    }
    lastAccepted = at;
    session.wrong = false;
    session.cursor++;
    const key = q("keyboard").querySelector(`[data-note="${note}"]`);
    key?.classList.add("correct");
    if (session.cursor >= current.notes.length) completeRound();
    else {
      renderPanel();
      if (session.kind === "foundation" || session.hint)
        requestAnimationFrame(() => {
          const targetKey = q("keyboard").querySelector(
              `[data-note="${targetPitch()}"]`,
            ),
            view = q("keyboardViewport");
          if (!targetKey) return;
          const rect = targetKey.getBoundingClientRect(),
            bounds = view.getBoundingClientRect();
          if (rect.left < bounds.left || rect.right > bounds.right) locate();
        });
    }
  }
  function pause() {
    if (
      !session ||
      !["listening", "responding", "retry"].includes(session.phase)
    )
      return;
    clearPlayback();
    session.phase = "paused";
    session.cursor = 0;
    session.times = [];
    session.wrong = false;
    renderPanel();
  }
  function openFoundations() {
    drawerFocus = document.activeElement;
    leave();
    leaveGame();
    clearTimeout(timer);
    stopPlayback();
    stopSinging();
    drawerMode = "foundations";
    q("courseDrawer").classList.remove("piece-picker", "course-picker");
    q("courseDrawer").classList.add("foundation-picker");
    q("drawerKicker").textContent =
      "参考巴斯蒂安启蒙顺序 · 原创小练习 · 不急着看谱";
    q("drawerTitle").textContent = "初遇钢琴 · 六个小发现";
    q("lessonList").className = "course-list";
    q("lessonList").innerHTML = PianoAdventureData.foundations
      .map(
        (item, i) =>
          `<button class="course-item" data-foundation="${i}" type="button"><span class="course-num">${String(i + 1).padStart(2, "0")}</span><span class="course-item-copy"><b>${item.title}</b><small>${item.summary}${profile.foundations.includes(item.id) ? " · 已探索" : ""}</small></span><span class="foundation-symbol" aria-hidden="true">${item.symbol}</span></button>`,
      )
      .join("");
    q("lessonList")
      .querySelectorAll("button")
      .forEach(
        (button) =>
          (button.onclick = () =>
            mount("foundation", Number(button.dataset.foundation))),
      );
    q("courseDrawer").hidden = false;
    q("closeCourse").focus({ preventScroll: true });
  }
  q("homeFoundationBtn").onclick = openFoundations;
  q("homeWarmBtn").onclick = () => mount("foundation", nextFoundation());
  q("homeEchoBtn").onclick = q("homeListenBtn").onclick = () => mount("echo");
  q("homeRhythmBtn").onclick = () => mount("rhythm");
  q("homeContinueBtn").onclick = () => {
    selectCourse(profile.lastCourse);
    enterPractice();
  };
  q("homeStartBtn").onclick = () => {
    const done = profile.days[localDay()] || [];
    if (!done.includes("warm")) mount("foundation", nextFoundation());
    else if (!done.includes("listen")) mount("echo");
    else if (!done.includes("read")) {
      selectCourse(profile.lastCourse);
      enterPractice();
    } else q("homeExploreBtn").click();
  };
  q("labStart").onclick = () => {
    if (session?.phase === "retry") {
      session.phase = "responding";
      session.times = [];
      session.cursor = 0;
      lastAccepted = -Infinity;
      renderPanel();
      window.PianoInput?.suspend(150);
    } else play();
  };
  q("labReplay").onclick = play;
  q("labHint").onclick = () => {
    if (session) {
      session.hint = !session.hint;
      renderPanel();
    }
  };
  q("labNext").onclick = () => {
    if (!session) return;
    if (session.phase === "roundDone") {
      session.round++;
      session.cursor = 0;
      play();
    } else if (session.kind === "foundation") {
      if (session.index < 5) mount("foundation", session.index + 1);
      else {
        leave();
        selectCourse(0);
        enterPractice();
      }
    } else mount(session.kind, 0, session.difficulty);
  };
  q("labHome").onclick = showHome;
  q("labDifficulty")
    .querySelectorAll("button")
    .forEach(
      (button) =>
        (button.onclick = () => {
          if (session)
            mount(session.kind, 0, Number(button.dataset.difficulty));
        }),
    );
  function openParent() {
    pause();
    stopPlayback();
    q("parentDialog").showModal();
  }
  q("parentBtn").onclick = q("homeParentBtn").onclick = openParent;
  document.querySelectorAll("[data-close-dialog]").forEach(
    (button) =>
      (button.onclick = () => {
        if (button.dataset.closeDialog === "inputDialog")
          window.PianoInput?.cancelPending();
        q(button.dataset.closeDialog).close();
      }),
  );
  for (const dialog of document.querySelectorAll("dialog"))
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) {
        if (dialog.id === "inputDialog") window.PianoInput?.cancelPending();
        dialog.close();
      }
    });
  q("closeCourse").addEventListener("click", () => {
    drawerFocus?.focus?.({ preventScroll: true });
    drawerFocus = null;
  });
  q("courseDrawer").setAttribute("role", "dialog");
  q("courseDrawer").setAttribute("aria-modal", "true");
  q("courseDrawer").addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const controls = [...q("courseDrawer").querySelectorAll("button")].filter(
      (button) => !button.disabled,
    );
    if (event.shiftKey && document.activeElement === controls[0]) {
      event.preventDefault();
      controls.at(-1)?.focus();
    } else if (!event.shiftKey && document.activeElement === controls.at(-1)) {
      event.preventDefault();
      controls[0]?.focus();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause();
    else renderHome();
  });
  window.addEventListener("pagehide", leave);
  window.PianoAdventure = {
    active: () => !!session,
    targetPitch,
    refreshHint,
    noteOn,
    leave,
    pause,
    isRhythm: () =>
      session?.kind === "rhythm" && session.phase === "responding",
  };
  renderHome();
  renderCourseList();
})();
