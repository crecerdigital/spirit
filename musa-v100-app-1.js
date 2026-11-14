
      (function () {
        "use strict";

        var ROLES = { "Muse": "Operaciones", "ChatGPT": "Análisis", "Gemini": "Investigación y creación" };
        var COLORS = {
          "Muse": ["var(--claude)", "var(--claude-soft)"],
          "ChatGPT": ["var(--chatgpt)", "var(--chatgpt-soft)"],
          "Gemini": ["var(--gemini)", "var(--gemini-soft)"]
        };
        var STATUSES = ["Pendiente", "En curso", "Hecho"];
        var RESPONSE_STATUSES = ["Pendiente de verificación", "En revisión por Muse", "Verificada por Muse", "Devuelta a corrección"];
        var FILTER_NAMES = ["Estudio del líder", "Paridad o superioridad funcional", "Legalidad y permisos", "Experiencia de usuario (UX)", "Diseño y acabado visual", "Contenido y textos", "Honestidad estructural", "Funcionamiento real verificado", "Rendimiento y confiabilidad", "Seguridad y privacidad", "Valor real para la persona", "Soporte y mejora continua"];
        var LS_KEY = "spiritia.v3.estado";
        var QUEUE_EMPTY = "La cola está vacía. Genera el primer encargo en el Coordinador y añádelo aquí para hacerle seguimiento: pendiente → en curso → hecho. La cola se guarda en este dispositivo.";
        var RESP_EMPTY = "Todavía no hay respuestas registradas. Cuando ChatGPT o Gemini entreguen por el puente, pega la respuesta completa aquí y conserva su estado de verificación.";

        /* ---------- Estado y persistencia local (localStorage) ---------- */
        function defaultState() {
          return {
            version: 3,
            panel: { tablero: 44, fondoCobrado: 0, fondoMeta: 20000, semanaCobrado: 0, semanaPiso: 400, embProp: 7, embResp: 1, embEnt: 0, embCon: 0, tareasHoy: 0 },
            queue: [], nextId: 1,
            responses: [], nextResponseId: 1,
            paquete: [
              { id: 1, text: "Guru: escribir la cantidad exacta del cargo temporal de la tarjeta y enviar la verificación a revisión", done: false },
              { id: 2, text: "MUSA: completar el inicio de sesión de Netlify para desplegar la app", done: false },
              { id: 3, text: "VerboLabs: si llega su canal seguro, enviar la identificación oficial (1 minuto)", done: false },
              { id: 4, text: "Outlier: autorizar el mensaje a soporte por el país del documento (borrador ya listo)", done: false }
            ],
            nextPaqueteId: 5,
            calidad: { pieza: "", checks: [false, false, false, false, false, false, false, false, false, false, false, false], apple: "", listo: false, listoCuando: "" }
          };
        }
        function num(v, dflt) { var n = parseFloat(v); return isFinite(n) ? n : dflt; }
        function int(v, dflt) { var n = parseInt(v, 10); return isFinite(n) ? n : dflt; }
        function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

        function normalizeState(raw) {
          var s = defaultState();
          if (!raw || typeof raw !== "object") return s;
          if (raw.panel && typeof raw.panel === "object") {
            var p = raw.panel, d = s.panel;
            d.tablero = clamp(num(p.tablero, d.tablero), 0, 100);
            d.fondoCobrado = Math.max(0, num(p.fondoCobrado, d.fondoCobrado));
            d.fondoMeta = Math.max(1, num(p.fondoMeta, d.fondoMeta));
            d.semanaCobrado = Math.max(0, num(p.semanaCobrado, d.semanaCobrado));
            d.semanaPiso = Math.max(1, num(p.semanaPiso, d.semanaPiso));
            d.embProp = Math.max(0, int(p.embProp, d.embProp));
            d.embResp = Math.max(0, int(p.embResp, d.embResp));
            d.embEnt = Math.max(0, int(p.embEnt, d.embEnt));
            d.embCon = Math.max(0, int(p.embCon, d.embCon));
            d.tareasHoy = Math.max(0, int(p.tareasHoy, d.tareasHoy));
          }
          if (Array.isArray(raw.queue)) {
            s.queue = raw.queue.filter(function (q) { return q && typeof q === "object"; }).map(function (q) {
              return { id: int(q.id, 0), agent: ROLES[q.agent] ? q.agent : "Muse", prio: typeof q.prio === "string" ? q.prio : "Normal", title: String(q.title || "Encargo sin título"), status: clamp(int(q.status, 0), 0, 2) };
            });
          }
          s.nextId = Math.max(1, int(raw.nextId, 1));
          if (Array.isArray(raw.responses)) {
            s.responses = raw.responses.filter(function (r) { return r && typeof r === "object"; }).map(function (r) {
              return { id: int(r.id, 0), source: (r.source === "Gemini" || r.source === "ChatGPT") ? r.source : "ChatGPT", status: clamp(int(r.status, 0), 0, 3), title: String(r.title || "Respuesta"), text: String(r.text || ""), when: String(r.when || new Date().toISOString()) };
            });
          }
          s.nextResponseId = Math.max(1, int(raw.nextResponseId, 1));
          if (Array.isArray(raw.paquete)) {
            s.paquete = raw.paquete.filter(function (t) { return t && typeof t === "object" && String(t.text || "").trim(); }).map(function (t) {
              return { id: int(t.id, 0), text: String(t.text), done: !!t.done };
            });
          }
          s.nextPaqueteId = Math.max(1, int(raw.nextPaqueteId, s.paquete.length + 1));
          if (raw.calidad && typeof raw.calidad === "object") {
            var c = raw.calidad;
            s.calidad.pieza = String(c.pieza || "");
            if (Array.isArray(c.checks)) { for (var i = 0; i < 12; i++) s.calidad.checks[i] = !!c.checks[i]; }
            s.calidad.apple = (c.apple === "si" || c.apple === "no") ? c.apple : "";
            s.calidad.listo = !!c.listo;
            s.calidad.listoCuando = String(c.listoCuando || "");
          }
          return s;
        }

        var state = defaultState();
        try {
          var saved = window.localStorage.getItem(LS_KEY);
          if (saved) state = normalizeState(JSON.parse(saved));
        } catch (e) { /* sin almacenamiento disponible: la app sigue en memoria */ }

        function save() {
          try { window.localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {}
        }

        /* Atajos vivos al estado (las vistas leen y escriben aquí) */
        var queue = state.queue;
        var responses = state.responses;
        var currentBrief = null;

        /* ---------- Referencias DOM ---------- */
        function el(id) { return document.getElementById(id); }
        var fAgent = el("fAgent"), fPrio = el("fPrio"), fTitle = el("fTitle"), fContext = el("fContext"), fDone = el("fDone");
        var outWrap = el("outWrap"), briefOut = el("briefOut"), feedback = el("feedback");
        var queueList = el("queueList"), queueCounts = el("queueCounts"), pulseQueue = el("pulseQueue");
        var rSource = el("rSource"), rStatus = el("rStatus"), rTitle = el("rTitle"), rText = el("rText");
        var responseList = el("responseList"), responseCounts = el("responseCounts"), responseFeedback = el("responseFeedback");
        var swState = el("swState");
        var paqueteList = el("paqueteList"), paqueteCounts = el("paqueteCounts"), paqueteFeedback = el("paqueteFeedback");
        var stateText = el("stateText"), dataFeedback = el("dataFeedback");
        var gatePiece = el("gatePiece"), gateCount = el("gateCount"), gateBar = el("gateBar"),
            gateVerdict = el("gateVerdict"), gateFeedback = el("gateFeedback"),
            appleYes = el("appleYes"), appleNo = el("appleNo");
        var gateBoxes = document.querySelectorAll("[data-filter]");

        /* Fecha de hoy (hora de casa, America/New_York) */
        try {
          var fmt = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "America/New_York" });
          var today = fmt.format(new Date());
          today = today.charAt(0).toUpperCase() + today.slice(1);
          el("today").textContent = today;
          el("footDate").textContent = today;
        } catch (e) {
          el("today").textContent = "Hoy";
        }

        /* ---------- Service worker (solo HTTPS/localhost) ---------- */
        function setSWState(msg) { if (swState) swState.textContent = msg; }
        if ("serviceWorker" in navigator && (window.location.protocol === "https:" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
          window.addEventListener("load", function () {
            navigator.serviceWorker.register("./service-worker.js").then(function () {
              setSWState("Modo app: service worker registrado en este origen.");
            }, function () {
              setSWState("Modo app: no se pudo registrar el service worker en este origen.");
            });
          });
        } else {
          setSWState("Modo app: el service worker se activa cuando la app se abre desde HTTPS.");
        }

        function fmtMoney(n) {
          return Number(n).toLocaleString("en-US", { maximumFractionDigits: (Math.round(n) === n ? 0 : 2) });
        }
        function pct(part, whole) { return whole > 0 ? clamp(Math.round((part / whole) * 100), 0, 100) : 0; }

        /* ---------- Panel del día ---------- */
        var PANEL_INPUTS = [
          ["inTablero", "tablero"], ["inFondo", "fondoCobrado"], ["inFondoMeta", "fondoMeta"],
          ["inSemana", "semanaCobrado"], ["inSemanaPiso", "semanaPiso"],
          ["inEmbProp", "embProp"], ["inEmbResp", "embResp"], ["inEmbEnt", "embEnt"], ["inEmbCon", "embCon"],
          ["inTareas", "tareasHoy"]
        ];
        function renderPanel(updateInputs) {
          var p = state.panel;
          el("tableroBig").textContent = String(p.tablero);
          el("tableroPctTxt").textContent = p.tablero + "%";
          el("tableroBar").style.width = p.tablero + "%";
          el("tableroBar").className = "bar-fill" + (p.tablero >= 100 ? " ok" : "");
          el("fondoBig").textContent = fmtMoney(p.fondoCobrado);
          el("fondoPctTxt").textContent = pct(p.fondoCobrado, p.fondoMeta) + "%";
          el("fondoBar").style.width = pct(p.fondoCobrado, p.fondoMeta) + "%";
          el("semanaBig").textContent = fmtMoney(p.semanaCobrado);
          el("semanaPctTxt").textContent = pct(p.semanaCobrado, p.semanaPiso) + "% del piso";
          el("semanaBar").style.width = pct(p.semanaCobrado, p.semanaPiso) + "%";
          el("semanaBar").className = "bar-fill" + (p.semanaCobrado >= p.semanaPiso ? " ok" : "");
          el("embProp").textContent = String(p.embProp);
          el("embResp").textContent = String(p.embResp);
          el("embEnt").textContent = String(p.embEnt);
          el("embCon").textContent = String(p.embCon);
          el("tareasBig").textContent = String(p.tareasHoy);
          el("tareasBar").style.width = pct(p.tareasHoy, 30) + "%";
          el("tareasBar").className = "bar-fill" + (p.tareasHoy >= 30 ? " ok" : "");
          /* La meta y el piso visibles siguen a los valores guardados */
          document.querySelector("#panel .stat:nth-child(2) .unit").textContent = " de $" + fmtMoney(p.fondoMeta);
          document.querySelector("#panel .stat:nth-child(3) .unit").textContent = " de $" + fmtMoney(p.semanaPiso);
          if (updateInputs) {
            PANEL_INPUTS.forEach(function (pair) { el(pair[0]).value = String(p[pair[1]]); });
          }
        }
        PANEL_INPUTS.forEach(function (pair) {
          el(pair[0]).addEventListener("input", function () {
            var v = num(this.value, state.panel[pair[1]]);
            if (pair[1] === "tablero") v = clamp(v, 0, 100);
            if (pair[1] === "fondoMeta" || pair[1] === "semanaPiso") v = Math.max(1, v);
            state.panel[pair[1]] = Math.max(0, v);
            save();
            renderPanel(false);
          });
        });

        /* ---------- Paquete diario del dueño ---------- */
        function paqueteSay(msg, warn) {
          paqueteFeedback.textContent = msg;
          paqueteFeedback.className = "feedback" + (warn ? " warn" : "");
        }
        function renderPaquete() {
          paqueteList.innerHTML = "";
          if (!state.paquete.length) {
            var empty = document.createElement("div");
            empty.className = "queue-empty";
            empty.textContent = "Sin toques pendientes. Cuando algo necesite la mano del dueño, se anota aquí — junto, en un solo paquete.";
            paqueteList.appendChild(empty);
          } else {
            state.paquete.forEach(function (t) { paqueteList.appendChild(paqueteItemEl(t)); });
          }
          var done = state.paquete.filter(function (t) { return t.done; }).length;
          paqueteCounts.innerHTML = state.paquete.length
            ? "<b>" + state.paquete.length + "</b> toques · <b>" + (state.paquete.length - done) + "</b> pendientes · <b>" + done + "</b> hechos"
            : "Sin toques pendientes";
        }
        function paqueteItemEl(t) {
          var wrap = document.createElement("div");
          wrap.className = "touch" + (t.done ? " done" : "");
          var cb = document.createElement("input");
          cb.type = "checkbox"; cb.checked = t.done;
          cb.setAttribute("aria-label", "Marcar como hecho el toque «" + t.text + "»");
          cb.addEventListener("change", function () {
            t.done = cb.checked;
            save();
            renderPaquete();
            paqueteSay(t.done ? "Toque marcado como hecho. Guardado en este dispositivo." : "Toque de vuelta a pendiente.");
          });
          var body = document.createElement("div"); body.className = "t";
          var who = document.createElement("div"); who.className = "who"; who.textContent = "Toque del dueño";
          var txt = document.createElement("div"); txt.textContent = t.text;
          body.appendChild(who); body.appendChild(txt);
          var del = document.createElement("button");
          del.type = "button"; del.className = "iconbtn";
          del.setAttribute("aria-label", "Quitar el toque «" + t.text + "»");
          del.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>';
          del.addEventListener("click", function () {
            state.paquete = state.paquete.filter(function (x) { return x.id !== t.id; });
            save();
            renderPaquete();
            paqueteSay("Toque eliminado del paquete.");
          });
          wrap.appendChild(cb); wrap.appendChild(body); wrap.appendChild(del);
          return wrap;
        }
        el("paqueteForm").addEventListener("submit", function (ev) {
          ev.preventDefault();
          var v = el("paqueteNew").value.trim();
          if (!v) { paqueteSay("Escribe primero el toque que quieres añadir.", true); return; }
          state.paquete.push({ id: state.nextPaqueteId++, text: v, done: false });
          el("paqueteNew").value = "";
          save();
          renderPaquete();
          paqueteSay("Toque añadido al paquete del dueño.");
        });


        /* ---------- Plantillas ---------- */
        var TEMPLATES = {
          deploy404: {
            agent: "ChatGPT", prio: "Alta",
            title: "Diagnosticar por qué el despliegue de MUSA en Netlify devuelve 404",
            context: "Sitio: https://eclectic-cucurucho-dbbdcf.netlify.app — desplegado vía Netlify Drop y ya puesto público para auditarlo.\n\nDiagnóstico verificado (no es suposición):\n- La raíz / devuelve error 404 (página por defecto de Netlify).\n- También dan 404: /index.html, /app, /dist/, /public/, /home, /assets/.\n- Lo único que responde 200 es /favicon.ico.\nConclusión: el paquete subido no contiene una app servible en la raíz; probablemente el index quedó dentro de una subcarpeta o no se incluyó.",
            done: "Entregar la estructura exacta de archivos del paquete original y el paquete completo corregido, archivo por archivo, con index.html en la raíz y sin paso de compilación."
          },
          auditoria: {
            agent: "Muse", prio: "Normal",
            title: "Auditar una página y corregir lo que falle",
            context: "Pega aquí la dirección de la página y qué debe hacer. Muse la abre en teléfono y escritorio, revisa errores, enlaces, textos y controles, y corrige antes de reportar.",
            done: "Entregar la lista de fallos encontrados con su corrección aplicada y la verificación final en pantalla."
          },
          mercado: {
            agent: "Gemini", prio: "Normal",
            title: "Investigar un mercado o tema y traerlo con fuentes",
            context: "Escribe aquí el tema exacto, la zona geográfica y para qué se va a usar la investigación. Sin datos inventados: cada afirmación con su fuente.",
            done: "Entregar un resumen con los datos clave, las fuentes enlazadas y lo que no se pudo comprobar, marcado como tal."
          },
          revision: {
            agent: "ChatGPT", prio: "Normal",
            title: "Revisar un texto antes de enviarlo o publicarlo",
            context: "Pega aquí el texto completo y di a quién va dirigido y qué debe lograr. Revisa claridad, tono, errores y lo que sobre o falte.",
            done: "Entregar el texto corregido y, aparte, la lista breve de cambios importantes con su porqué."
          },
          segunda: {
            agent: "ChatGPT", prio: "Alta",
            title: "Segunda opinión antes de lanzar",
            context: "Describe aquí qué se va a lanzar (producto, página, oferta), a quién va dirigido y qué está en juego si sale mal.",
            done: "Entregar un veredicto claro — lanzar, corregir o no lanzar — con los tres riesgos mayores y cómo se cubre cada uno."
          }
        };

        function applyTemplate(key) {
          var t = TEMPLATES[key];
          if (!t) return;
          fAgent.value = t.agent;
          fPrio.value = t.prio;
          fTitle.value = t.title;
          fContext.value = t.context;
          fDone.value = t.done;
          say("");
          el("coordinador").scrollIntoView({ behavior: "smooth", block: "start" });
          setTimeout(function () { fTitle.focus({ preventScroll: true }); }, 350);
        }

        var tplBtns = document.querySelectorAll("[data-tpl]");
        for (var i = 0; i < tplBtns.length; i++) {
          tplBtns[i].addEventListener("click", function () { applyTemplate(this.getAttribute("data-tpl")); });
        }

        /* Botones "Encargar a …" de las tarjetas */
        var assignBtns = document.querySelectorAll("[data-assign]");
        for (var j = 0; j < assignBtns.length; j++) {
          assignBtns[j].addEventListener("click", function () {
            fAgent.value = this.getAttribute("data-assign");
            el("coordinador").scrollIntoView({ behavior: "smooth", block: "start" });
            setTimeout(function () { fTitle.focus({ preventScroll: true }); }, 350);
          });
        }

        /* ---------- Generar encargo ---------- */
        function say(msg) { feedback.textContent = msg; }

        function buildBrief() {
          var agent = fAgent.value;
          var prio = fPrio.value;
          var title = fTitle.value.trim();
          var context = fContext.value.trim();
          var done = fDone.value.trim();
          var dateStr = el("today").textContent;
          var lines = [];
          lines.push("ENCARGO MUSA");
          lines.push("Para: " + agent + " (" + ROLES[agent] + ")");
          lines.push("Prioridad: " + prio);
          lines.push("Fecha: " + dateStr);
          lines.push("");
          lines.push("CONTEXTO FIJO DE LA CASA");
          lines.push("- Crecer Digital es la operación de Cristhiam; español primero.");
          lines.push("- Muse dirige y verifica; ChatGPT analiza; Gemini investiga y crea.");
          lines.push("- Hechos y cifras solo si están verificados; no inventes clientes, ventas, precios ni resultados.");
          lines.push(agent === "Muse" ? "- Canal: directo dentro de la casa." : "- Canal: puente manual de MUSA; no afirmes una conexión automática inexistente.");
          lines.push("");
          lines.push("TAREA");
          lines.push(title || "(sin título — escribe la tarea antes de enviar)");
          if (context) { lines.push(""); lines.push("CONTEXTO Y DATOS"); lines.push(context); }
          if (done) { lines.push(""); lines.push("CRITERIO DE ENTREGA"); lines.push(done); }
          lines.push("");
          lines.push("REGLAS");
          lines.push("- Responde con hechos verificables; lo que no puedas comprobar, dilo tal cual.");
          lines.push("- Sin relleno: ve al resultado que pide el criterio de entrega.");
          lines.push("- Si falta un dato indispensable, pide solo ese dato y sigue con el resto.");
          return { agent: agent, prio: prio, title: title, text: lines.join("\n") };
        }

        el("briefForm").addEventListener("submit", function (ev) {
          ev.preventDefault();
          if (!fTitle.value.trim()) {
            say("Escribe primero la tarea: sin tarea no hay encargo.");
            fTitle.focus();
            return;
          }
          currentBrief = buildBrief();
          briefOut.textContent = currentBrief.text;
          outWrap.classList.add("show");
          say("Encargo generado. Cópialo y pégalo en " + currentBrief.agent + ", o déjalo en la cola.");
          outWrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });

        el("clearBtn").addEventListener("click", function () {
          fTitle.value = ""; fContext.value = ""; fDone.value = "";
          fPrio.value = "Normal";
          outWrap.classList.remove("show");
          currentBrief = null;
          say("");
          fTitle.focus();
        });

        /* ---------- Copiar / descargar ---------- */
        function copyText(text, done) {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
          } else { fallbackCopy(text); done(); }
        }
        function fallbackCopy(text) {
          var ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed"; ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand("copy"); } catch (e) {}
          document.body.removeChild(ta);
        }

        el("copyBtn").addEventListener("click", function () {
          if (!currentBrief) return;
          copyText(currentBrief.text, function () { say("Copiado. Ya puedes pegarlo en " + currentBrief.agent + "."); });
        });

        el("dlBtn").addEventListener("click", function () {
          if (!currentBrief) return;
          var name = "encargo-" + currentBrief.agent.toLowerCase() + "-" + state.nextId + ".txt";
          var blob = new Blob([currentBrief.text], { type: "text/plain;charset=utf-8" });
          var url = URL.createObjectURL(blob);
          var a = document.createElement("a");
          a.href = url; a.download = name;
          document.body.appendChild(a); a.click();
          document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(url); }, 800);
          say("Descargado como " + name + ".");
        });

        /* ---------- Cola (persistente) ---------- */
        el("queueBtn").addEventListener("click", function () {
          if (!currentBrief) return;
          queue.push({ id: state.nextId++, agent: currentBrief.agent, prio: currentBrief.prio, title: currentBrief.title || "Encargo sin título", status: 0 });
          save();
          renderQueue();
          say("Añadido a la cola. Queda guardado en este dispositivo.");
          el("cola").scrollIntoView({ behavior: "smooth", block: "start" });
        });

        function renderQueue() {
          queue = state.queue;
          queueList.innerHTML = "";
          if (!queue.length) {
            var empty = document.createElement("div");
            empty.className = "queue-empty";
            empty.textContent = QUEUE_EMPTY;
            queueList.appendChild(empty);
          } else {
            queue.forEach(function (item) { queueList.appendChild(queueItemEl(item)); });
          }
          var p = 0, c = 0, h = 0;
          queue.forEach(function (it) { if (it.status === 0) p++; else if (it.status === 1) c++; else h++; });
          queueCounts.innerHTML = queue.length
            ? "<b>" + queue.length + "</b> en total · <b>" + p + "</b> pendientes · <b>" + c + "</b> en curso · <b>" + h + "</b> hechos"
            : "Sin encargos todavía";
          pulseQueue.textContent = String(queue.length);
        }

        function queueItemEl(item) {
          var wrap = document.createElement("div");
          wrap.className = "qitem";
          wrap.style.setProperty("--ac", COLORS[item.agent][0]);
          wrap.style.setProperty("--ac-soft", COLORS[item.agent][1]);

          var bar = document.createElement("span"); bar.className = "bar"; bar.setAttribute("aria-hidden", "true");
          var body = document.createElement("div"); body.className = "body";

          var t = document.createElement("div"); t.className = "t"; t.textContent = item.title;
          var meta = document.createElement("div"); meta.className = "meta";
          var pillA = document.createElement("span"); pillA.className = "pill"; pillA.textContent = item.agent + " · " + ROLES[item.agent];
          var pillP = document.createElement("span"); pillP.className = "pill prio" + (item.prio !== "Normal" ? " alta" : ""); pillP.textContent = "Prioridad: " + item.prio;
          meta.appendChild(pillA); meta.appendChild(pillP);

          var ops = document.createElement("div"); ops.className = "ops";
          var sBtn = document.createElement("button");
          sBtn.type = "button"; sBtn.className = "btn small statusbtn";
          sBtn.setAttribute("data-s", String(item.status));
          sBtn.textContent = "Estado: " + STATUSES[item.status] + " — tocar para avanzar";
          sBtn.setAttribute("aria-label", "Avanzar el estado del encargo «" + item.title + "», ahora " + STATUSES[item.status]);
          sBtn.addEventListener("click", function () {
            item.status = (item.status + 1) % STATUSES.length;
            save();
            renderQueue();
          });
          ops.appendChild(sBtn);

          body.appendChild(t); body.appendChild(meta); body.appendChild(ops);

          var del = document.createElement("button");
          del.type = "button"; del.className = "iconbtn";
          del.setAttribute("aria-label", "Quitar de la cola el encargo «" + item.title + "»");
          del.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>';
          del.addEventListener("click", function () {
            state.queue = queue.filter(function (q) { return q.id !== item.id; });
            save();
            renderQueue();
          });

          wrap.appendChild(bar); wrap.appendChild(body); wrap.appendChild(del);
          return wrap;
        }


        /* ---------- Respuestas del equipo (persistentes) ---------- */
        function responseSay(msg) { responseFeedback.textContent = msg; }

        el("responseForm").addEventListener("submit", function (ev) {
          ev.preventDefault();
          var text = rText.value.trim();
          if (!text) {
            responseSay("Pega primero la respuesta completa: el registro no acepta entradas vacías.");
            rText.focus();
            return;
          }
          responses.unshift({
            id: state.nextResponseId++,
            source: rSource.value,
            status: parseInt(rStatus.value, 10) || 0,
            title: rTitle.value.trim() || ("Respuesta de " + rSource.value),
            text: text,
            when: new Date().toISOString()
          });
          state.responses = responses;
          rText.value = "";
          rTitle.value = "";
          rStatus.value = "0";
          save();
          renderResponses();
          responseSay("Respuesta registrada y guardada en este dispositivo. Estado: " + RESPONSE_STATUSES[responses[0].status] + ".");
          el("respuestas").scrollIntoView({ behavior: "smooth", block: "start" });
        });

        el("responseClear").addEventListener("click", function () {
          rTitle.value = "";
          rText.value = "";
          rStatus.value = "0";
          responseSay("");
          rText.focus();
        });

        function renderResponses() {
          responses = state.responses;
          responseList.innerHTML = "";
          if (!responses.length) {
            var empty = document.createElement("div");
            empty.className = "queue-empty";
            empty.textContent = RESP_EMPTY;
            responseList.appendChild(empty);
          } else {
            responses.forEach(function (item) { responseList.appendChild(responseItemEl(item)); });
          }
          var p = 0, r = 0, v = 0, d = 0;
          responses.forEach(function (it) {
            if (it.status === 0) p++; else if (it.status === 1) r++; else if (it.status === 2) v++; else d++;
          });
          responseCounts.innerHTML = responses.length
            ? "<b>" + responses.length + "</b> en total · <b>" + p + "</b> pendientes · <b>" + r + "</b> en revisión · <b>" + v + "</b> verificadas · <b>" + d + "</b> devueltas"
            : "Sin respuestas registradas";
        }

        function responseItemEl(item) {
          var wrap = document.createElement("div");
          wrap.className = "qitem ritem";
          wrap.style.setProperty("--ac", COLORS[item.source][0]);
          wrap.style.setProperty("--ac-soft", COLORS[item.source][1]);

          var bar = document.createElement("span"); bar.className = "bar"; bar.setAttribute("aria-hidden", "true");
          var body = document.createElement("div"); body.className = "body";

          var t = document.createElement("div"); t.className = "t"; t.textContent = item.title;
          var meta = document.createElement("div"); meta.className = "meta";
          var pillS = document.createElement("span"); pillS.className = "pill"; pillS.textContent = item.source + " · " + ROLES[item.source];
          var pillW = document.createElement("span"); pillW.className = "pill prio";
          var whenDate = new Date(item.when);
          pillW.textContent = (isFinite(whenDate.getTime()) ? whenDate.toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "Sin fecha") + " · " + item.text.length + " caracteres";
          meta.appendChild(pillS); meta.appendChild(pillW);

          var text = document.createElement("div"); text.className = "resp-text"; text.textContent = item.text;

          var ops = document.createElement("div"); ops.className = "ops";
          var sBtn = document.createElement("button");
          sBtn.type = "button"; sBtn.className = "btn small statusbtn";
          sBtn.setAttribute("data-v", String(item.status));
          sBtn.textContent = "Verificación: " + RESPONSE_STATUSES[item.status] + " — tocar para avanzar";
          sBtn.setAttribute("aria-label", "Avanzar el estado de verificación de la respuesta «" + item.title + "», ahora " + RESPONSE_STATUSES[item.status]);
          sBtn.addEventListener("click", function () {
            item.status = (item.status + 1) % RESPONSE_STATUSES.length;
            save();
            renderResponses();
          });
          ops.appendChild(sBtn);

          body.appendChild(t); body.appendChild(meta); body.appendChild(text); body.appendChild(ops);

          var del = document.createElement("button");
          del.type = "button"; del.className = "iconbtn";
          del.setAttribute("aria-label", "Quitar del registro la respuesta «" + item.title + "»");
          del.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>';
          del.addEventListener("click", function () {
            state.responses = responses.filter(function (x) { return x.id !== item.id; });
            save();
            renderResponses();
          });

          wrap.appendChild(bar); wrap.appendChild(body); wrap.appendChild(del);
          return wrap;
        }

        /* ---------- Puertas de calidad ---------- */
        function gateSay(msg, warn) {
          gateFeedback.textContent = msg;
          gateFeedback.className = "feedback" + (warn ? " warn" : "");
        }
        function gateMissing() {
          var missing = [];
          state.calidad.checks.forEach(function (c, i) { if (!c) missing.push(FILTER_NAMES[i]); });
          return missing;
        }
        function renderCalidad(updateInputs) {
          var c = state.calidad;
          var count = c.checks.filter(Boolean).length;
          if (c.listo && !(count === 12 && c.apple === "si")) { c.listo = false; c.listoCuando = ""; }
          for (var i = 0; i < gateBoxes.length; i++) {
            var idx = int(gateBoxes[i].getAttribute("data-filter"), 0);
            gateBoxes[i].checked = !!c.checks[idx];
            var lab = gateBoxes[i].closest ? gateBoxes[i].closest(".filter") : gateBoxes[i].parentElement;
            if (lab) lab.classList.toggle("pass", !!c.checks[idx]);
          }
          gateCount.textContent = String(count);
          gateBar.style.width = Math.round((count / 12) * 100) + "%";
          gateBar.className = "bar-fill" + (count === 12 ? " ok" : "");
          appleYes.classList.toggle("sel-yes", c.apple === "si");
          appleNo.classList.toggle("sel-no", c.apple === "no");
          if (updateInputs) gatePiece.value = c.pieza;
          if (c.listo) {
            gateVerdict.className = "verdict ok";
            gateVerdict.innerHTML = "";
            var b = document.createElement("span"); b.className = "big-v"; b.textContent = "✔ LISTO PARA PUBLICAR";
            var d = document.createElement("span");
            d.textContent = "«" + (c.pieza || "Pieza sin nombre") + "» pasó los 12 filtros y la pregunta de entrega" + (c.listoCuando ? " · marcado el " + new Date(c.listoCuando).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "") + ".";
            gateVerdict.appendChild(b); gateVerdict.appendChild(d);
          } else {
            gateVerdict.className = "verdict";
            gateVerdict.innerHTML = "";
            var b2 = document.createElement("span"); b2.className = "big-v"; b2.textContent = "Puerta cerrada";
            var d2 = document.createElement("span");
            var miss = gateMissing();
            var parts = [];
            if (miss.length) parts.push("faltan " + miss.length + " de 12 filtros");
            if (c.apple === "") parts.push("falta responder «¿Apple lo entregaría así?»");
            if (c.apple === "no") parts.push("la pregunta de entrega se respondió NO: vuelve al taller");
            d2.textContent = parts.length ? ("Para abrir la puerta: " + parts.join(" · ") + ".") : "Marca los 12 filtros y responde la pregunta de entrega para abrir la puerta.";
            gateVerdict.appendChild(b2); gateVerdict.appendChild(d2);
          }
        }
        for (var g = 0; g < gateBoxes.length; g++) {
          gateBoxes[g].addEventListener("change", function () {
            var idx = int(this.getAttribute("data-filter"), 0);
            state.calidad.checks[idx] = this.checked;
            if (!this.checked) { state.calidad.listo = false; state.calidad.listoCuando = ""; }
            save();
            renderCalidad(false);
          });
        }
        gatePiece.addEventListener("input", function () {
          state.calidad.pieza = this.value;
          save();
        });
        appleYes.addEventListener("click", function () {
          state.calidad.apple = "si";
          save();
          renderCalidad(false);
          gateSay("Pregunta de entrega: SÍ registrado.");
        });
        appleNo.addEventListener("click", function () {
          state.calidad.apple = "no";
          state.calidad.listo = false; state.calidad.listoCuando = "";
          save();
          renderCalidad(false);
          gateSay("Pregunta de entrega: NO. La pieza vuelve al taller; cuando mejore, re-corre los 12 filtros completos.", true);
        });
        el("gateReady").addEventListener("click", function () {
          var miss = gateMissing();
          if (miss.length === 0 && state.calidad.apple === "si") {
            state.calidad.listo = true;
            state.calidad.listoCuando = new Date().toISOString();
            save();
            renderCalidad(false);
            gateSay("Puerta abierta: 12/12 filtros + pregunta de entrega en SÍ. Lista para publicar.");
          } else {
            var why = [];
            if (miss.length) why.push("faltan los filtros: " + miss.join(", "));
            if (state.calidad.apple === "") why.push("falta responder la pregunta de entrega");
            if (state.calidad.apple === "no") why.push("la pregunta de entrega está en NO");
            gateVerdict.className = "verdict blocked";
            gateVerdict.innerHTML = "";
            var b = document.createElement("span"); b.className = "big-v"; b.textContent = "✖ NO LISTO PARA PUBLICAR";
            var d = document.createElement("span"); d.textContent = "La regla de la casa es 12/12 o no sale: " + why.join(" · ") + ".";
            gateVerdict.appendChild(b); gateVerdict.appendChild(d);
            gateSay("No se marcó como listo: " + why.join(" · ") + ".", true);
          }
        });
        el("gateReset").addEventListener("click", function () {
          state.calidad = { pieza: "", checks: [false, false, false, false, false, false, false, false, false, false, false, false], apple: "", listo: false, listoCuando: "" };
          save();
          renderCalidad(true);
          gateSay("Ficha reiniciada. La próxima pieza corre los 12 filtros desde cero.");
        });

        /* ---------- Datos y respaldo ---------- */
        function dataSay(msg, warn) {
          dataFeedback.textContent = msg;
          dataFeedback.className = "feedback" + (warn ? " warn" : "");
        }
        el("exportBtn").addEventListener("click", function () {
          stateText.value = JSON.stringify(state, null, 2);
          dataSay("Estado exportado al cuadro de texto. Cópialo y guárdalo donde quieras: es tu respaldo completo.");
        });
        el("copyStateBtn").addEventListener("click", function () {
          if (!stateText.value.trim()) stateText.value = JSON.stringify(state, null, 2);
          copyText(stateText.value, function () { dataSay("Respaldo copiado al portapapeles."); });
        });
        el("importBtn").addEventListener("click", function () {
          var raw = stateText.value.trim();
          if (!raw) { dataSay("Pega primero un respaldo en el cuadro de texto.", true); return; }
          try {
            var parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== "object" || (!parsed.panel && !parsed.queue && !parsed.responses)) throw new Error("formato no reconocido");
            state = normalizeState(parsed);
            save();
            renderAll();
            dataSay("Estado importado y guardado en este dispositivo. Todo quedó como venía en el respaldo.");
          } catch (e) {
            dataSay("Ese texto no es un respaldo válido de MUSA. No se cambió nada.", true);
          }
        });
        el("wipeBtn").addEventListener("click", function () {
          if (!window.confirm("¿Borrar TODO el estado guardado (panel, paquete, cola, respuestas y ficha de calidad) y volver a los valores iniciales?")) return;
          try { window.localStorage.removeItem(LS_KEY); } catch (e) {}
          state = defaultState();
          save();
          stateText.value = "";
          renderAll();
          dataSay("Estado borrado. La app volvió a los valores iniciales verificados.");
        });

        /* ---------- Arranque ---------- */
        function renderAll() {
          renderPanel(true);
          renderPaquete();
          renderQueue();
          renderResponses();
          renderCalidad(true);
        }
        renderAll();
      })();
    
/* MUSA v21: los botones de llamada y voz viven tras el engranaje; la cabecera queda como la de Muse */
(function(){try{
  var head=document.querySelector("#sp4chat .sp4head"),panel=document.getElementById("sp16panel");
  if(!head||!panel)return;
  Array.prototype.slice.call(head.querySelectorAll("button")).forEach(function(b){
    if(b.id==="sp7menu"||b.id==="sp4close"||b.id==="sp7share")return;
    if(b.getAttribute("aria-label")==="Ajustes del chat")return;
    panel.appendChild(b);
  });
}catch(e){}})();
