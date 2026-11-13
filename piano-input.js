/* Local-only piano input. No audio is uploaded or recorded. */
const PianoSignal = (() => {
  function rms(samples) {
    let sum = 0;
    for (const value of samples) sum += value * value;
    return Math.sqrt(sum / samples.length);
  }
  function pitchFromPCM(samples, sampleRate) {
    if (rms(samples) < 0.009) return null;
    const windowSize = Math.min(1024, Math.floor(samples.length / 2));
    const max = Math.min(Math.ceil(sampleRate / 70), windowSize - 2),
      min = Math.max(2, Math.floor(sampleRate / 1400));
    const difference = new Float32Array(max + 1);
    let cumulative = 0,
      best = -1;
    for (let lag = 1; lag <= max; lag++) {
      let sum = 0;
      for (let i = 0; i < windowSize; i += 2) {
        const delta = samples[i] - samples[i + lag];
        sum += delta * delta;
      }
      cumulative += sum;
      difference[lag] = cumulative ? (sum * lag) / cumulative : 1;
    }
    for (let lag = min; lag < max; lag++)
      if (difference[lag] < 0.17) {
        while (lag + 1 < max && difference[lag + 1] < difference[lag]) lag++;
        best = lag;
        break;
      }
    if (best < 0) return null;
    const left = difference[best - 1],
      middle = difference[best],
      right = difference[best + 1];
    const denominator = 2 * (2 * middle - left - right),
      offset = denominator ? (right - left) / denominator : 0;
    return sampleRate / (best + Math.max(-0.5, Math.min(0.5, offset)));
  }
  function noteName(number) {
    return (
      ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][
        ((number % 12) + 12) % 12
      ] +
      (Math.floor(number / 12) - 1)
    );
  }
  // Re-arm after silence, a fresh attack, or a stable new pitch. A held note emits once.
  class NoteGate {
    constructor() {
      this.reset();
    }
    reset() {
      this.previousRms = 0;
      this.lastAt = -Infinity;
      this.lastNote = null;
      this.candidate = null;
      this.frames = 0;
      this.armed = true;
      this.quietSince = null;
      this.attackUntil = 0;
    }
    sample(level, note, at, rhythm = false) {
      const attack = level > 0.014 && level > this.previousRms * 1.65;
      this.previousRms = level;
      if (level < 0.009) {
        if (this.quietSince === null) this.quietSince = at;
        if (at - this.quietSince >= 110) this.armed = true;
        this.frames = 0;
        return null;
      }
      this.quietSince = null;
      if (attack) this.attackUntil = at + 170;
      if (rhythm) {
        if (attack && at - this.lastAt > 170) {
          this.lastAt = at;
          return "C4";
        }
        return null;
      }
      if (!Number.isFinite(note)) return null;
      const rounded = Math.round(note);
      if (Math.abs(rounded - note) > 0.45 || rounded < 36 || rounded > 96)
        return null;
      if (this.candidate === rounded) this.frames++;
      else {
        this.candidate = rounded;
        this.frames = 1;
      }
      if (
        this.frames >= 2 &&
        at - this.lastAt > 190 &&
        (this.armed || rounded !== this.lastNote || at < this.attackUntil)
      ) {
        this.lastAt = at;
        this.lastNote = rounded;
        this.armed = false;
        this.attackUntil = 0;
        return noteName(rounded);
      }
      return null;
    }
  }
  return { rms, pitchFromPCM, noteName, NoteGate };
})();

(() => {
  if (typeof document === "undefined") return;
  let mode = "screen",
    pending = false,
    request = 0,
    access = null,
    selectedId = null,
    boundPort = null;
  let demoWasPlaying = false;
  let stream = null,
    source = null,
    analyser = null,
    frame = null,
    suspendedUntil = 0,
    lastFrame = 0,
    buffer = null;
  const gate = new PianoSignal.NoteGate(),
    activeNotes = new Set(),
    releaseTimers = new Map();
  const query = (id) => document.getElementById(id);
  const defaultMessage = "由家长选择连接方式；声音仅在本机处理。";
  const activePractice = () =>
    !document.body.classList.contains("show-home") &&
    !document.querySelector("dialog[open]") &&
    query("courseDrawer").hidden;
  function status(message) {
    query("inputStatus").textContent = message;
  }
  function renderConnection() {
    for (const [id, value] of [
      ["inputScreen", "screen"],
      ["inputMidi", "midi"],
      ["inputMic", "microphone"],
    ]) {
      query(id).classList.toggle("selected", mode === value);
      query(id).setAttribute("aria-pressed", String(mode === value));
      query(id).disabled = pending;
    }
    const connected =
      (mode === "microphone" && !!stream) || (mode === "midi" && !!boundPort);
    query("inputBtn").classList.toggle("connected", connected);
    query("inputBtn").classList.toggle(
      "pending",
      pending || (mode === "midi" && !boundPort),
    );
    query("inputLabel").textContent = pending
      ? "正在连接…"
      : mode === "microphone"
        ? "正在听琴声"
        : connected
          ? "电钢琴已连接"
          : "连接电钢琴";
    query("inputDeviceLabel").hidden = mode !== "midi" || !access?.inputs?.size;
    query("inputDisconnect").hidden = mode === "screen" && !pending;
  }
  function releaseAll() {
    for (const note of activeNotes)
      query("keyboard")
        .querySelector(`[data-note="${note}"]`)
        ?.classList.remove("external-active", "active");
    activeNotes.clear();
    for (const timer of releaseTimers.values()) clearTimeout(timer);
    releaseTimers.clear();
  }
  function highlight(note, held = false) {
    const key = query("keyboard").querySelector(`[data-note="${note}"]`);
    if (!key) return;
    clearTimeout(releaseTimers.get(note));
    key.classList.add("active", "external-active");
    activeNotes.add(note);
    if (!held)
      releaseTimers.set(
        note,
        setTimeout(() => release(note), 260),
      );
  }
  function release(note) {
    query("keyboard")
      .querySelector(`[data-note="${note}"]`)
      ?.classList.remove("active", "external-active");
    activeNotes.delete(note);
    clearTimeout(releaseTimers.get(note));
    releaseTimers.delete(note);
  }
  function receive(note, sourceMode, held = false) {
    query("inputLastNote").textContent = `听见了 ${note.replace("#", "♯")}`;
    if (!activePractice() || performance.now() < suspendedUntil) return;
    highlight(note, held);
    handlePianoInput(note, { source: sourceMode, at: performance.now() });
  }
  function detachMic() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    if (stream) stream.getTracks().forEach((track) => track.stop());
    stream = null;
    try {
      source?.disconnect();
      analyser?.disconnect();
    } catch {}
    source = null;
    analyser = null;
    buffer = null;
    demoWasPlaying = false;
    gate.reset();
    releaseAll();
  }
  function detachMidi() {
    if (boundPort) {
      boundPort.onmidimessage = null;
      try {
        boundPort.close?.()?.catch(() => {});
      } catch {}
    }
    boundPort = null;
    if (access) access.onstatechange = null;
    access = null;
    selectedId = null;
    releaseAll();
  }
  function disconnect(message = defaultMessage) {
    request++;
    pending = false;
    detachMic();
    detachMidi();
    mode = "screen";
    status(message);
    renderConnection();
  }
  function stopMicrophone() {
    if (mode === "microphone" || pending)
      disconnect("听琴已暂停。准备好后，可以重新连接。");
  }
  function suspend(milliseconds = 500) {
    suspendedUntil = performance.now() + milliseconds;
    gate.reset();
  }
  async function connectMic() {
    disconnect();
    const token = ++request;
    pending = true;
    mode = "microphone";
    renderConnection();
    status("请由家长允许麦克风。琴声只在本机识别。");
    stopSinging();
    if (!navigator.mediaDevices?.getUserMedia) {
      disconnect(
        "此页面无法使用麦克风。请在 HTTPS 或本机预览中打开，也可以点按屏幕琴键。",
      );
      return;
    }
    let acquired = null;
    try {
      ensureAudio();
      const context = getAudio();
      await context.resume();
      acquired = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      if (token !== request || !query("inputDialog").open) {
        if (token === request) disconnect("连接已取消，可以继续点按屏幕琴键。");
        acquired.getTracks().forEach((track) => track.stop());
        return;
      }
      stream = acquired;
      source = context.createMediaStreamSource(stream);
      analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      buffer = new Float32Array(analyser.fftSize);
      for (const track of stream.getTracks())
        track.onended = () => {
          if (stream === acquired)
            disconnect("麦克风已停止，可以重新连接或继续点按屏幕琴键。");
        };
      pending = false;
      lastFrame = 0;
      status(
        "正在听琴声。松开延音踏板，一次弹一个音；节奏小火车可以用任意琴键。",
      );
      renderConnection();
      suspend(350);
      frame = requestAnimationFrame(scanMic);
    } catch (error) {
      acquired?.getTracks().forEach((track) => track.stop());
      if (token !== request) return;
      disconnect(
        error?.name === "NotAllowedError"
          ? "没有获得麦克风许可。可以在浏览器设置中允许后重试，也可以继续用屏幕琴键。"
          : "麦克风暂时无法连接，请检查设备后再试。屏幕琴键仍可以玩。",
      );
    }
  }
  function scanMic(now) {
    if (mode !== "microphone" || !analyser) return;
    frame = requestAnimationFrame(scanMic);
    if (now - lastFrame < 55) return;
    lastFrame = now;
    analyser.getFloatTimeDomainData(buffer);
    if (!activePractice() || now < suspendedUntil) {
      gate.reset();
      return;
    }
    // Existing score demonstrations also share the microphone input. Let their
    // release tail fade before accepting a new answer from the room speaker.
    if (playing || voices.size > 0) {
      demoWasPlaying = true;
      gate.reset();
      return;
    }
    if (demoWasPlaying) {
      demoWasPlaying = false;
      suspend(850);
      return;
    }
    const level = PianoSignal.rms(buffer),
      rhythm = window.PianoAdventure?.isRhythm();
    const hz =
      !rhythm && level >= 0.009
        ? PianoSignal.pitchFromPCM(buffer, audio.sampleRate)
        : null;
    const heard = gate.sample(
      level,
      hz ? 69 + 12 * Math.log2(hz / 440) : null,
      now,
      !!rhythm,
    );
    if (heard) receive(heard, "microphone");
  }
  function onMIDI(event) {
    const [command, number, velocity] = event.data || [],
      type = command & 0xf0;
    if (!Number.isFinite(number) || number < 0 || number > 127) return;
    const note = PianoSignal.noteName(number);
    if (type === 0x80 || (type === 0x90 && velocity === 0)) {
      release(note);
      return;
    }
    if (type === 0xb0 && (number === 120 || number === 123)) {
      releaseAll();
      return;
    }
    if (type !== 0x90 || !velocity) return;
    receive(note, "midi", true);
  }
  function refreshMidi() {
    if (mode !== "midi" || !access) return;
    if (boundPort) boundPort.onmidimessage = null;
    boundPort = null;
    releaseAll();
    const ports = [...access.inputs.values()].filter(
      (port) => port.state !== "disconnected",
    );
    if (!ports.some((port) => port.id === selectedId))
      selectedId = ports[0]?.id || null;
    const select = query("inputDeviceSelect");
    select.replaceChildren();
    for (const port of ports) {
      const option = document.createElement("option");
      option.value = port.id;
      option.textContent = port.name || "电钢琴";
      select.append(option);
    }
    if (selectedId) {
      select.value = selectedId;
      boundPort = ports.find((port) => port.id === selectedId);
      boundPort.onmidimessage = onMIDI;
      status(
        `已连接 ${boundPort.name || "电钢琴"}。请在真正的琴键上弹奏，琴声由电钢琴发出。`,
      );
    } else
      status(
        "还没有发现 MIDI 电钢琴。请检查电源和数据线；连接好后会自动出现，也可改用麦克风。",
      );
    renderConnection();
  }
  async function connectMidi() {
    disconnect();
    if (typeof navigator.requestMIDIAccess !== "function") {
      status(
        "这个浏览器暂不支持 MIDI。可以选择“让麦克风听琴声”，或在支持 MIDI 的电脑浏览器中连接。",
      );
      return;
    }
    const token = ++request;
    mode = "midi";
    pending = true;
    status("请由家长允许 MIDI，然后选择电钢琴。");
    renderConnection();
    try {
      const result = await navigator.requestMIDIAccess({ sysex: false });
      if (token !== request) return;
      if (!query("inputDialog").open) {
        disconnect("连接已取消，可以继续点按屏幕琴键。");
        return;
      }
      access = result;
      pending = false;
      access.onstatechange = refreshMidi;
      refreshMidi();
    } catch (error) {
      if (token !== request) return;
      disconnect(
        error?.name === "NotAllowedError"
          ? "MIDI 许可未开启。可以重试，也可以用麦克风或屏幕琴键。"
          : "暂时无法读取 MIDI，请检查连接后重试。",
      );
    }
  }
  query("inputBtn").onclick = () => {
    window.PianoAdventure?.pause();
    stopPlayback();
    query("inputDialog").showModal();
  };
  query("inputScreen").onclick = () =>
    disconnect("已使用屏幕琴键。点按下方琴键就能玩。");
  query("inputMidi").onclick = connectMidi;
  query("inputMic").onclick = connectMic;
  query("inputDisconnect").onclick = () =>
    disconnect("已断开连接，可以继续点按屏幕琴键。");
  query("inputDeviceSelect").onchange = (event) => {
    selectedId = event.target.value;
    refreshMidi();
  };
  query("inputDialog").addEventListener("cancel", () => {
    if (pending) disconnect("连接已取消。准备好后可以重新选择。");
  });
  query("inputDialog").addEventListener("close", () => {
    if (pending && !query("inputDialog").open)
      disconnect("连接已取消。准备好后可以重新选择。");
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (pending || mode === "microphone") stopMicrophone();
      releaseAll();
    } else suspend(350);
  });
  window.addEventListener("pagehide", () => disconnect());
  window.addEventListener("blur", () => {
    for (const [key] of voices)
      if (!String(key).startsWith("demo") && !String(key).startsWith("lab-"))
        stopTone(key);
    query("keyboard")
      .querySelectorAll(".active")
      .forEach((key) => key.classList.remove("active"));
    releaseAll();
  });
  window.PianoInput = {
    mode: () => mode,
    cancelPending() {
      if (pending) disconnect("连接已取消。准备好后可以重新选择。");
    },
    stopMicrophone,
    disconnect,
    suspend,
  };
  renderConnection();
})();
