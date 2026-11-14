
(function () {
  "use strict";

  /* ---------- Datos oficiales · Semana 1 (ingles-semana-1.md) ---------- */
  var MI_DAYS = [
    { dia: 1, titulo: "Presentarse", bloques: [
      "My name is Cristhiam. I'm from Nicaragua. I live in North Carolina.",
      "I work in logistics.",
      "Nice to meet you."
    ] },
    { dia: 2, titulo: "Trabajo y entregas", bloques: [
      "I'm here to pick up an order.",
      "I have a delivery for you.",
      "Can you sign here, please?",
      "I'll be there in ten minutes."
    ] },
    { dia: 3, titulo: "Dinero y precios", bloques: [
      "How much is it?",
      "I get paid every week.",
      "This is my price.",
      "I need it in writing."
    ] },
    { dia: 4, titulo: "Teléfono con clientes", bloques: [
      "Hello, this is Cristhiam.",
      "Can you repeat that, please?",
      "Send me a text, please.",
      "I'll call you back."
    ] },
    { dia: 5, titulo: "Problemas y reclamos", bloques: [
      "There's a problem with my order.",
      "This is not correct.",
      "I need to speak with a manager.",
      "Thank you for your help."
    ] },
    { dia: 6, titulo: "Familia y planes", bloques: [
      "My wife and my daughters live in Nicaragua.",
      "I'm working for my family.",
      "See you in December."
    ] },
    { dia: 7, titulo: "Repaso bajo presión", bloques: [] }
  ];
  /* Día 7 = simulación completa mezclando los 6 días: sus bloques son todos. */
  (function () {
    var all = [];
    for (var d = 0; d < 6; d++) {
      MI_DAYS[d].bloques.forEach(function (b, i) {
        all.push({ texto: b, origen: "Día " + MI_DAYS[d].dia + " · " + MI_DAYS[d].titulo });
      });
    }
    MI_DAYS[6].bloques = all.map(function (x) { return x.texto; });
    MI_DAYS[6].origenes = all.map(function (x) { return x.origen; });
  })();
  var MI_TOTAL_SEMANA = 22; /* 3+4+4+4+4+3 bloques nuevos (días 1–6) */
  var MI_META_SEMANA = 20;  /* meta oficial Semana 1 */
  var MI_COACH = "Actúa como entrenador de inglés de élite: cero teoría, cero traducción, solo bloques y shadowing. Da un estímulo corto en inglés, espera la respuesta de voz, corrige en una línea y avanza. Todo el texto de apoyo en pantalla va en español. Sesión de 30 minutos; al cerrar, reporta qué bloques quedaron firmes y cuáles se repiten mañana.";
  var MI_SESSION_SECONDS = 30 * 60;
  var MI_LS = "musa_ingles_v1"; /* ÚNICA clave que este módulo lee/escribe */

  function $(id) { return document.getElementById(id); }
  var daySel = $("miDaySel"), blocksBox = $("miBlocks"), progressBox = $("miProgress"),
      statusEl = $("miStatus"), timerEl = $("miTimer"), summaryEl = $("miSummary"),
      totalsEl = $("miTotals"), feedbackEl = $("miFeedback"),
      startBtn = $("miStartBtn"), endBtn = $("miEndBtn");
  if (!daySel || !blocksBox || !startBtn) return; /* sección no insertada */

  /* ---------- Progreso persistente (solo musa_ingles_v1) ---------- */
  function miDefaultProgress() {
    return { version: 1, firmes: {}, repetir: {}, sesiones: [], ultimoDia: 1 };
  }
  function miLoadProgress() {
    try {
      var raw = window.localStorage.getItem(MI_LS);
      if (!raw) return miDefaultProgress();
      var p = JSON.parse(raw);
      if (!p || typeof p !== "object") return miDefaultProgress();
      if (!p.firmes || typeof p.firmes !== "object") p.firmes = {};
      if (!p.repetir || typeof p.repetir !== "object") p.repetir = {};
      if (!Array.isArray(p.sesiones)) p.sesiones = [];
      if (!(p.ultimoDia >= 1 && p.ultimoDia <= 7)) p.ultimoDia = 1;
      return p;
    } catch (e) { return miDefaultProgress(); }
  }
  var prog = miLoadProgress();
  function miSaveProgress() {
    try { window.localStorage.setItem(MI_LS, JSON.stringify(prog)); } catch (e) {}
  }
  function miList(map, dia) {
    var a = map[String(dia)];
    return Array.isArray(a) ? a.slice() : [];
  }
  function miSetMark(dia, idx, kind) {
    var k = String(dia);
    var f = miList(prog.firmes, dia), r = miList(prog.repetir, dia);
    f = f.filter(function (x) { return x !== idx; });
    r = r.filter(function (x) { return x !== idx; });
    if (kind === "firme") f.push(idx);
    if (kind === "repetir") r.push(idx);
    prog.firmes[k] = f.sort(function (a, b) { return a - b; });
    prog.repetir[k] = r.sort(function (a, b) { return a - b; });
    miSaveProgress();
  }
  function miSay(msg, warn) {
    feedbackEl.textContent = msg;
    feedbackEl.className = "feedback" + (warn ? " warn" : "");
  }

  /* ---------- Selector de día ---------- */
  MI_DAYS.forEach(function (d) {
    var opt = document.createElement("option");
    opt.value = String(d.dia);
    opt.textContent = "Día " + d.dia + " — " + d.titulo + " (" + d.bloques.length + " bloques)";
    daySel.appendChild(opt);
  });
  daySel.value = String(prog.ultimoDia || 1);
  function miCurrentDay() {
    var n = parseInt(daySel.value, 10);
    if (!(n >= 1 && n <= 7)) n = 1;
    return MI_DAYS[n - 1];
  }

  /* ---------- Bloques del día con botones Firme / Repetir mañana ---------- */
  function miRenderBlocks() {
    var day = miCurrentDay();
    var firmes = miList(prog.firmes, day.dia), repetir = miList(prog.repetir, day.dia);
    blocksBox.innerHTML = "";
    day.bloques.forEach(function (texto, idx) {
      var isF = firmes.indexOf(idx) >= 0, isR = repetir.indexOf(idx) >= 0;
      var row = document.createElement("div");
      row.className = "mi-block" + (isF ? " firme" : (isR ? " repetir" : ""));
      var bt = document.createElement("div"); bt.className = "mi-btext";
      if (day.origenes) {
        var od = document.createElement("span"); od.className = "mi-bday";
        od.textContent = day.origenes[idx] || "";
        bt.appendChild(od);
      }
      bt.appendChild(document.createTextNode("“" + texto + "”"));
      var ops = document.createElement("div"); ops.className = "mi-ops";
      var bF = document.createElement("button");
      bF.type = "button"; bF.className = "btn small mi-op" + (isF ? " is-on-firme" : "");
      bF.textContent = isF ? "✓ Firme" : "Firme";
      bF.setAttribute("aria-label", "Marcar firme el bloque: " + texto);
      bF.addEventListener("click", function () {
        miSetMark(day.dia, idx, isF ? "" : "firme");
        miRenderBlocks(); miRenderProgress();
        miSay(isF ? "Marca quitada." : "Bloque firme guardado. Firme = sin traducir en <2 s, 3 veces seguidas.");
      });
      var bR = document.createElement("button");
      bR.type = "button"; bR.className = "btn small mi-op" + (isR ? " is-on-repetir" : "");
      bR.textContent = isR ? "↻ A repetir mañana" : "Repetir mañana";
      bR.setAttribute("aria-label", "Marcar para repetir mañana el bloque: " + texto);
      bR.addEventListener("click", function () {
        miSetMark(day.dia, idx, isR ? "" : "repetir");
        miRenderBlocks(); miRenderProgress();
        miSay(isR ? "Marca quitada." : "Anotado para repetir mañana.");
      });
      ops.appendChild(bF); ops.appendChild(bR);
      row.appendChild(bt); row.appendChild(ops);
      blocksBox.appendChild(row);
    });
  }

  /* ---------- Panel de progreso ---------- */
  function miRenderProgress() {
    progressBox.innerHTML = "";
    var totalFirmes = 0;
    MI_DAYS.forEach(function (d) {
      var f = miList(prog.firmes, d.dia).length;
      var r = miList(prog.repetir, d.dia).length;
      if (d.dia <= 6) totalFirmes += f; /* el Día 7 repasa: no duplica la suma */
      var row = document.createElement("div"); row.className = "mi-prow";
      var a = document.createElement("div"); a.className = "mi-pday";
      a.textContent = "Día " + d.dia + " — " + d.titulo;
      var b = document.createElement("div"); b.className = "mi-pnum";
      b.textContent = f + " firmes / " + d.bloques.length + " · " + r + " a repetir";
      var track = document.createElement("div"); track.className = "bar-track";
      var fill = document.createElement("div");
      fill.className = "bar-fill" + (f >= d.bloques.length && d.bloques.length ? " ok" : "");
      fill.style.width = (d.bloques.length ? Math.round((f / d.bloques.length) * 100) : 0) + "%";
      fill.style.background = "var(--gemini)";
      track.appendChild(fill);
      row.appendChild(a); row.appendChild(b); row.appendChild(track);
      progressBox.appendChild(row);
    });
    totalsEl.innerHTML = "";
    var b1 = document.createElement("b");
    b1.textContent = totalFirmes + " de " + MI_TOTAL_SEMANA + " bloques firmes";
    totalsEl.appendChild(b1);
    totalsEl.appendChild(document.createTextNode(
      " en la Semana 1 (meta: " + MI_META_SEMANA + ") · " + prog.sesiones.length +
      (prog.sesiones.length === 1 ? " sesión hecha." : " sesiones hechas.") +
      " Progreso guardado solo en este dispositivo (musa_ingles_v1)."
    ));
  }

  /* ---------- Reuso del chat vivo de Gemini (sin tocar su llave) ---------- */
  /* No hay fetch propio ni lectura de la llave: se pulsa el Enviar del chat
     existente, cuyo handler llama a askGemini() con la llave del iPhone. */
  function miSendToGemini(text) {
    var chat = $("sp4chat"), openBtn = $("sp4btn"),
        gemBtn = $("sp4mGem"), input = $("sp4input"), send = $("sp4send");
    if (!chat || !input || !send) return false;
    if (chat.className !== "open" && openBtn) openBtn.click(); /* abre + render() */
    if (gemBtn) gemBtn.click(); /* mode = "gemini" dentro del chat + render() */
    input.value = text;
    send.click(); /* handler vivo: gHist.push + guardar historial + askGemini() */
    return true;
  }
  function miOpenChatGemini() {
    var chat = $("sp4chat"), openBtn = $("sp4btn"), gemBtn = $("sp4mGem");
    if (!chat) return;
    if (chat.className !== "open" && openBtn) openBtn.click();
    if (gemBtn) gemBtn.click();
  }

  /* ---------- Sesión de 30 min: arranque, temporizador, cierre ---------- */
  var miTimerId = null, miSecondsLeft = MI_SESSION_SECONDS,
      miSessionActive = false, miSessionDay = null, miStartStamp = null;

  function miFmtTime(s) {
    var m = Math.floor(s / 60), ss = s % 60;
    return (m < 10 ? "0" : "") + m + ":" + (ss < 10 ? "0" : "") + ss;
  }
  function miPaintTimer() {
    timerEl.textContent = miFmtTime(Math.max(0, miSecondsLeft));
    timerEl.className = "mi-timer" + (miSessionActive && miSecondsLeft <= 60 ? " warn" : "");
    var elapsed = MI_SESSION_SECONDS - miSecondsLeft;
    var phase = elapsed < 5 * 60 ? 0 : (elapsed < 20 * 60 ? 1 : 2);
    for (var i = 0; i < 3; i++) {
      var p = $("miPhase" + i);
      if (p) p.className = "mi-phase" + (miSessionActive && i === phase ? " on" : "");
    }
  }
  function miBuildStartPrompt(day) {
    var lines = [];
    lines.push("[PRÁCTICA DE INGLÉS · MUSA · Semana 1 · Día " + day.dia + " — " + day.titulo + "]");
    lines.push("");
    lines.push(MI_COACH);
    lines.push("");
    lines.push("ESTRUCTURA DE HOY (30 minutos, en este orden):");
    lines.push("1) Calentamiento shadowing (5 min): repite conmigo el bloque del día anterior 3 veces, como un solo bloque.");
    lines.push("2) Bloques nuevos (15 min): trabajamos SOLO estos bloques del Día " + day.dia + ", uno por turno, hasta que salgan sin pensar:");
    day.bloques.forEach(function (b, i) { lines.push("   " + (i + 1) + ". \"" + b + "\""); });
    lines.push("3) Simulación bajo presión (10 min): haz el papel contrario (cliente, cajero u oficial, según el día) y yo respondo solo con los bloques aprendidos; corrígeme al instante, en una línea, sin gramática.");
    var rep = miList(prog.repetir, day.dia);
    if (rep.length) {
      lines.push("");
      lines.push("OJO: estos bloques de hoy quedaron marcados «repetir»: insiste más en ellos: " +
        rep.map(function (i) { return "\"" + day.bloques[i] + "\""; }).join(" · "));
    }
    lines.push("");
    lines.push("REGLA DE FIRMEZA: un bloque queda firme solo si lo digo sin traducir en menos de 2 segundos, 3 veces seguidas.");
    lines.push("Empieza AHORA con el calentamiento: dame el primer estímulo corto en inglés y espera mi respuesta.");
    return lines.join("\n");
  }
  function miStartSession() {
    var day = miCurrentDay();
    prog.ultimoDia = day.dia;
    miSaveProgress();
    if (!miSendToGemini(miBuildStartPrompt(day))) {
      statusEl.textContent = "No encontré el chat del equipo en esta página: la sesión no pudo arrancar.";
      miSay("Falta el módulo de chat (#sp4chat) en el archivo final.", true);
      return;
    }
    miSessionActive = true;
    miSessionDay = day.dia;
    miStartStamp = { firmes: miList(prog.firmes, day.dia).length, repetir: miList(prog.repetir, day.dia).length };
    miSecondsLeft = MI_SESSION_SECONDS;
    if (miTimerId) clearInterval(miTimerId);
    miTimerId = setInterval(function () {
      miSecondsLeft--;
      miPaintTimer();
      if (miSecondsLeft === 60) statusEl.textContent = "Queda 1 minuto: Gemini va cerrando la simulación.";
      if (miSecondsLeft <= 0) miCloseSession(true);
    }, 1000);
    summaryEl.className = "mi-summary";
    summaryEl.textContent = "";
    startBtn.disabled = true;
    endBtn.disabled = false;
    statusEl.textContent = "Sesión en curso · Día " + day.dia + " — " + day.titulo +
      ". El chat de Gemini está abierto y dirigiendo la práctica: responde en voz alta, bloque a bloque. Si Gemini pide la llave, está en la tarjeta del chat (⚙) — este módulo nunca la pide.";
    miPaintTimer();
    var sec = $("ingles");
    if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function miCloseSession(byTimer) {
    if (!miSessionActive) return;
    miSessionActive = false;
    if (miTimerId) { clearInterval(miTimerId); miTimerId = null; }
    startBtn.disabled = false;
    endBtn.disabled = true;
    var dia = miSessionDay || miCurrentDay().dia;
    var firmes = miList(prog.firmes, dia), repetir = miList(prog.repetir, dia);
    prog.sesiones.push({
      dia: dia, cuando: new Date().toISOString(),
      firmes: firmes.length, repetir: repetir.length
    });
    miSaveProgress();
    miRenderProgress();
    miPaintTimer();
    var day = MI_DAYS[dia - 1];
    summaryEl.className = "mi-summary show";
    summaryEl.innerHTML = "";
    var big = document.createElement("span"); big.className = "mi-sbig";
    big.textContent = byTimer ? "⏰ Sesión de 30 minutos terminada" : "Sesión terminada";
    var body = document.createElement("span");
    body.textContent = "Día " + dia + " — " + day.titulo + ": " + firmes.length +
      " bloques firmes hoy · " + repetir.length + " a repetir mañana" +
      (repetir.length ? " (" + repetir.map(function (i) { return "“" + day.bloques[i] + "”"; }).join(" · ") + ")" : "") +
      ". Sesiones hechas: " + prog.sesiones.length + ".";
    summaryEl.appendChild(big); summaryEl.appendChild(body);
    statusEl.textContent = "Sesión cerrada. El resumen quedó guardado en tu progreso de inglés.";
    /* Cierre con el coach: Gemini reporta firmes / a repetir (instrucción oficial). */
    miSendToGemini("[CIERRE DE SESIÓN · Día " + dia + "] Se acabaron los 30 minutos. " +
      "Según mis marcas en MUSA: firmes hoy = " + (firmes.length ? firmes.map(function (i) { return "\"" + day.bloques[i] + "\""; }).join(" · ") : "ninguno marcado") +
      "; a repetir mañana = " + (repetir.length ? repetir.map(function (i) { return "\"" + day.bloques[i] + "\""; }).join(" · ") : "ninguno marcado") +
      ". Confírmame en español, en pocas líneas, qué bloques quedaron firmes y cuáles repito mañana, y despídete hasta la próxima sesión.");
    if (byTimer) {
      try { alert("⏰ Práctica de inglés: sesión de 30 minutos terminada. Revisa tu resumen de bloques firmes y a repetir."); } catch (e) {}
    }
  }

  /* ---------- Cableado ---------- */
  daySel.addEventListener("change", function () {
    prog.ultimoDia = miCurrentDay().dia;
    miSaveProgress();
    miRenderBlocks();
    miRenderProgress();
  });
  startBtn.addEventListener("click", miStartSession);
  endBtn.addEventListener("click", function () { miCloseSession(false); });
  $("miResetBtn").addEventListener("click", function () {
    if (!window.confirm("¿Reiniciar TODO el progreso de Práctica de inglés (bloques firmes, a repetir y sesiones)? No toca el chat ni ninguna otra parte de MUSA.")) return;
    prog = miDefaultProgress();
    prog.ultimoDia = miCurrentDay().dia;
    miSaveProgress();
    miRenderBlocks();
    miRenderProgress();
    miSay("Progreso de inglés reiniciado.");
  });
  var floatBtn = $("miFloatBtn");
  if (floatBtn) {
    floatBtn.addEventListener("click", function () {
      var sec = $("ingles");
      if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  /* Atajo dentro de la sección: si el chat no está abierto, Iniciarlo ya lo abre (miStartSession). */
  miRenderBlocks();
  miRenderProgress();
  miPaintTimer();
})();
