
(function(){
"use strict";
var LS_KEY="spirit_gemini_key", LS_G="spirit_chat_gemini_v4", LS_T="spirit_chat_team_v4", LS_P="spirit_chat_pollinations_v1", LS_O="spirit_chat_openrouter_v1", LS_OK="spirit_openrouter_key";
var mode="gemini";
var models=["gemini-flash-latest","gemini-2.5-flash","gemini-2.5-flash-lite","gemini-2.0-flash-001","gemini-2.0-flash"];
function $(id){return document.getElementById(id);}
function load(k,d){try{var v=window.localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}}
function save(k,v){try{window.localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function getKey(){try{return window.localStorage.getItem(LS_KEY)||"";}catch(e){return "";}}
var gHist=load(LS_G,[]), tHist=load(LS_T,[]), pHist=load(LS_P,[]), oHist=load(LS_O,[]);
(function(){var bad=["is not found for API version","Call ModelService","No pude responder ahora:","supported for generateContent","not supported for generateContent"];function clean(a){return a.filter(function(m){var t=(m&&m.text)||"";for(var i=0;i<bad.length;i++){if(t.indexOf(bad[i])>=0)return false;}return true;});}var g2=clean(gHist),t2=clean(tHist),p2=clean(pHist);if(g2.length!==gHist.length){gHist=g2;save(LS_G,gHist);}if(t2.length!==tHist.length){tHist=t2;save(LS_T,tHist);}if(p2.length!==pHist.length){pHist=p2;save(LS_P,pHist);}})();
var SPOR_ICON="data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2064%2064%22%3E%3Ccircle%20cx=%2232%22%20cy=%2232%22%20r=%2232%22%20fill=%22%23f0f0f0%22/%3E%3Cpath%20d=%22M20%2044%20L32%2020%20L44%2044%22%20stroke=%22%231f1f1f%22%20stroke-width=%223%22%20fill=%22none%22/%3E%3Cg%20fill=%22%231f1f1f%22%3E%3Ccircle%20cx=%2220%22%20cy=%2244%22%20r=%225%22/%3E%3Ccircle%20cx=%2232%22%20cy=%2220%22%20r=%225%22/%3E%3Ccircle%20cx=%2244%22%20cy=%2244%22%20r=%225%22/%3E%3C/g%3E%3C/svg%3E";
var SP6AV={"Muse":"","ChatGPT":"","Gemini":"","Equipo":"","Pollinations":"","OpenRouter":""};
var SP8IMG={"Muse":"avatar-claude.png","ChatGPT":"avatar-chatgpt.png","Gemini":"avatar-gemini.png","Equipo":"avatar-claude.png","Pollinations":"avatar-pollinations.png","OpenRouter":SPOR_ICON};
function sp6speak(t){try{var u=new SpeechSynthesisUtterance(String(t).slice(0,600));u.lang="es-US";var vs=speechSynthesis.getVoices();for(var i=0;i<vs.length;i++){if(vs[i].lang&&vs[i].lang.indexOf("es")===0){u.voice=vs[i];break;}}speechSynthesis.cancel();speechSynthesis.speak(u);}catch(e){}}
/* MUSA v72 (sp25): markdown sanitizado, scroll inteligente, estados por etapas, reintentos */
var sp25Busy=false;
var sp25ActiveCtrl=null,sp25UserCancel=false;
function sp25Cancel(){sp25UserCancel=true;try{if(sp25ActiveCtrl)sp25ActiveCtrl.abort();}catch(e){}}
function sp25Esc(t){return String(t==null?"":t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function sp25md(src){
  var t=sp25Esc(src);
  var blocks=[];
  t=t.replace(/```[a-zA-Z0-9]*\n?([\s\S]*?)```/g,function(m,c){blocks.push(c.replace(/\n+$/,""));return "\u0001B"+(blocks.length-1)+"\u0001";});
  var codes=[];
  t=t.replace(/`([^`\n]+)`/g,function(m,c){codes.push(c);return "\u0001C"+(codes.length-1)+"\u0001";});
  t=t.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>");
  t=t.replace(/(^|[^*])\*([^*\n]+)\*/g,"$1<em>$2</em>");
  t=t.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
  var lines=t.split("\n"),out=[],list=null;
  function closeList(){if(list){out.push(list==="ul"?"</ul>":"</ol>");list=null;}}
  lines.forEach(function(ln){
    var x=ln.replace(/^\s+|\s+$/g,"");
    var ph=x.match(/^\u0001B(\d+)\u0001$/);
    if(ph){closeList();out.push("<pre class=\"sp25pre\">"+blocks[+ph[1]]+"</pre>");return;}
    var li=x.match(/^[-*\u2022]\s+(.*)$/);
    if(li){if(list!=="ul"){closeList();out.push("<ul>");list="ul";}out.push("<li>"+li[1]+"</li>");return;}
    var lo=x.match(/^\d+[.)]\s+(.*)$/);
    if(lo){if(list!=="ol"){closeList();out.push("<ol>");list="ol";}out.push("<li>"+lo[1]+"</li>");return;}
    closeList();
    if(!x){out.push("");return;}
    var h=x.match(/^#{1,4}\s+(.*)$/);
    if(h){out.push("<div class=\"sp25h\">"+h[1]+"</div>");return;}
    out.push("<div>"+x+"</div>");
  });
  closeList();
  var html=out.join("");
  html=html.replace(/\u0001C(\d+)\u0001/g,function(m,i2){return "<code class=\"sp25code\">"+codes[+i2]+"</code>";});
  html=html.replace(/\u0001B(\d+)\u0001/g,function(m,i2){return "<pre class=\"sp25pre\">"+blocks[+i2]+"</pre>";});
  return html;
}
function sp25Near(box){box=box||$("sp4msgs");if(!box)return true;return (box.scrollHeight-box.scrollTop-box.clientHeight)<140;}
function sp25ShowJump(sh){var b=document.getElementById("sp25jump");if(b)b.className=sh?"show":"";}
function sp25JumpInit(){try{var chat=$("sp4chat");if(!chat||document.getElementById("sp25jump"))return;var b=document.createElement("button");b.id="sp25jump";b.type="button";b.textContent="↓ Ir al último mensaje";b.addEventListener("click",function(){var m=$("sp4msgs");if(m)m.scrollTop=1e7;sp25ShowJump(false);});chat.appendChild(b);var m=$("sp4msgs");if(m)m.addEventListener("scroll",function(){if(sp25Near(m))sp25ShowJump(false);});}catch(e){}}
function sp25SetStatus(t){var e=document.getElementById("sp25status");if(e)e.textContent=t;try{musaPillStatus(t);}catch(x){}}
function musaPillEl(){return document.getElementById("sp100pill");}
function musaPillShow(){var p=musaPillEl();if(!p)return;var s=p.querySelector(".st2");if(s)s.textContent="está trabajando";p.className="show";}
function musaPillStatus(t){var p=musaPillEl();if(!p||p.className!=="show")return;var s="está trabajando";if(t&&t.indexOf("escribiendo")>=0)s="está escribiendo…";var e=p.querySelector(".st2");if(e)e.textContent=s;}
function musaPillHide(){var p=musaPillEl();if(p)p.className="";}
(function(){try{var chat=$("sp4chat");if(!chat||document.getElementById("sp100pill"))return;var p=document.createElement("div");p.id="sp100pill";p.innerHTML="<img src=\"avatar-gemini.png\" alt=\"\"><span class=\"who2\">Gemini</span><span class=\"st2\">está trabajando</span><span class=\"sp25dots\" aria-hidden=\"true\"><i></i><i></i><i></i></span>";chat.appendChild(p);}catch(e){}})();
function sp25Sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
function sp25Regen(){if(sp25Busy||mode!=="gemini")return;for(var i=gHist.length-1;i>=0;i--){if(gHist[i].who==="me"){askGemini(gHist[i].text);return;}}}
function sp25AttachRetry(userText){try{var box=$("sp4msgs");var d=box.lastElementChild;if(!d)return;var b=document.createElement("button");b.className="sp4copy";b.type="button";b.textContent="Reintentar";b.addEventListener("click",function(){if(!sp25Busy)askGemini(userText);});var acts=d.querySelector(".sp25acts");if(acts)acts.appendChild(b);else d.appendChild(b);}catch(e){}}
function bubble(list,who,text,extra){
  var box=$("sp4msgs");
  var near=sp25Near(box);
  var d=document.createElement("div");  d.className="sp4m "+(who==="me"?"me":"ai")+(window.__musaBulk?"":" musa-in");
  var w=document.createElement("span");w.className="who";w.textContent=who==="me"?"Tú":(SP6AV[who]||"")+who;if(SP8IMG[who]){var av=document.createElement("img");av.src=SP8IMG[who];av.alt="";av.className="sp8ava";av.onerror=function(){av.remove();};w.insertBefore(av,w.firstChild);}d.appendChild(w);
  var bd=document.createElement("div");bd.className="sp25body";
  if(who==="me"){bd.textContent=text;}else{bd.innerHTML=sp25md(text);}
  d.appendChild(bd);
  var acts=null;
  function actBtn(label,fn){if(!acts){acts=document.createElement("div");acts.className="sp25acts";d.appendChild(acts);}var b=document.createElement("button");b.className="sp4copy";b.type="button";b.textContent=label;b.addEventListener("click",function(){fn(b);});acts.appendChild(b);return b;}
  if(extra){actBtn("Copiar mensaje",function(b){copyText(text);b.textContent="¡Copiado!";setTimeout(function(){b.textContent="Copiar mensaje";},1500);});}
  if(who!=="me"){
    actBtn("Copiar",function(b){copyText(text);b.textContent="¡Copiado!";setTimeout(function(){b.textContent="Copiar";},1500);});
    if(who==="Gemini"){actBtn("Regenerar",function(){sp25Regen();});}
    actBtn("Escuchar",function(){sp6speak(text);});
  }
  box.appendChild(d);
  if(near||who==="me"){box.scrollTop=1e7;sp25ShowJump(false);}else{sp25ShowJump(true);}
}
function copyText(t){if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).catch(function(){});}else{var ta=document.createElement("textarea");ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand("copy");}catch(e){}document.body.removeChild(ta);}}
function render(){
  window.__musaBulk=true;
  $("sp4msgs").innerHTML="";
  var list=mode==="gemini"?gHist:(mode==="pollinations"?pHist:(mode==="openrouter"?oHist:tHist));
  if(!list.length){
    bubble("ai",mode==="gemini"?"Gemini":(mode==="pollinations"?"Pollinations":(mode==="openrouter"?"OpenRouter":"Equipo")),mode==="gemini"?"Hola, soy Gemini. Estoy EN VIVO dentro de MUSA: escríbeme y te respondo al instante. Mi fuerte: investigación y creación.":(mode==="pollinations"?"Hola, soy Pollinations. Estoy EN VIVO dentro de MUSA y no necesito llave: escríbeme y te respondo. Mi fuerte: respuestas rápidas y creación.":(mode==="openrouter"?"Hola, soy OpenRouter. Estoy EN VIVO dentro de MUSA con tu llave: desde aquí hablas con los modelos gratuitos de Llama, Qwen y DeepSeek. Escríbeme y te respondo.":"Aquí escribes a Muse y ChatGPT. Muse recoge tu mensaje, lo trabaja con ChatGPT y las respuestas verificadas quedan en MUSA, en la sección Respuestas del equipo.")));
  }
  list.forEach(function(m){bubble("ai",m.who,m.text,m.who==="me"&&mode==="team");});
  $("sp4mGem").className="sp4mode"+(mode==="gemini"?" on":"");
  $("sp4mTeam").className="sp4mode"+(mode==="team"?" on":"");
  $("sp4mPol").className="sp4mode"+(mode==="pollinations"?" on":"");
  $("sp4mOR").className="sp4mode"+(mode==="openrouter"?" on":"");
  $("sp4modeNote").textContent=mode==="gemini"?"Gemini responde al instante, directo desde la app.":(mode==="pollinations"?"Pollinations responde en vivo dentro de MUSA, gratis y sin llave. Su servicio a veces se satura: si tarda, dale unos segundos.":(mode==="openrouter"?"OpenRouter responde en vivo con tu llave: modelos gratuitos de Llama, Qwen y DeepSeek.":"Muse y ChatGPT no tienen canal en vivo gratuito: Muse trae sus respuestas verificadas a MUSA. Copia tu mensaje y pégalo en el chat de Muse para activar al equipo al momento."));
  keyState();orKeyState();spORSync();window.__musaBulk=false;
}
function keyState(){
  var k=getKey();
  sp5PlaceCard();
  var rm=$("sp4keyremove");if(rm)rm.style.display=k?"inline-block":"none";
  var row=$("sp4keyrow");if(row)row.style.display="none";
  if(!k){$("sp4keystate").innerHTML="<b>Tu llave gratuita de Gemini</b> (se guarda solo en tu teléfono):";return;}
  if(sp5GBad===k){$("sp4keystate").innerHTML="<b>Google no aceptó la llave guardada.</b> Pega la llave de Google en el campo de arriba y toca Guardar: la app la comprueba sola.";return;}
  if(sp5GVrf()){$("sp4keystate").innerHTML="<b>Gemini en vivo: ACTIVO</b> en este iPhone.";return;}
  $("sp4keystate").innerHTML="<b>Gemini: llave guardada en este iPhone.</b> Se comprueba sola: en cuanto Google responda, queda ACTIVO.";
  if(sp5GCheckedFor!==k&&!sp5GCheckBusy){sp5GCheckedFor=k;sp5GCheckBusy=true;sp5CheckGemini(k).then(function(){sp5GCheckBusy=false;keyState();});}
}
/* MUSA v105 · PEGADO INTELIGENTE DE LLAVES + COMPROBACIÓN EN VIVO
   Una sola casilla en Ajustes («Pega tu llave»): al guardar, la app
   comprueba la llave EN VIVO y la guarda en la clave de persistencia
   del servicio que la ACEPTA, nunca en la del otro. Antes de decir
   ACTIVO, la llave se comprueba con una llamada real: Gemini con
   ListModels y OpenRouter con /auth/key. Si el servicio la rechaza,
   NO se guarda y la tarjeta lo dice claro. Las marcas de
   comprobación (…_vrf) son claves NUEVAS: ninguna clave existente se
   renombra ni se mueve.
   MUSA v107 · SIN PUERTA DE PREFIJO: hasta v106 la casilla clasificaba
   por el prefijo («AIza» / «sk-or-») y RECHAZABA sin guardar cualquier
   llave sin esos prefijos (así cayó la llave real del dueño en su
   reprueba del 2026-11-16). Desde v107 la llave pegada se prueba en
   vivo, en orden: primero Google y, si Google la rechaza, OpenRouter.
   Se guarda solo donde el servicio la acepte. El prefijo queda solo
   como pista para el guardado «sin comprobar» cuando un servicio no
   responde y el dueño del prefijo no la rechazó; sin prefijo y sin
   comprobación posible no se guarda nada: se pide reintentar con
   conexión. */
var sp5GBad="",sp5OBad="",sp5GCheckedFor="",sp5OCheckedFor="",sp5GCheckBusy=false,sp5OCheckBusy=false;
function sp5GVrf(){try{return window.localStorage.getItem("spirit_gemini_key_vrf")==="1";}catch(e){return false;}}
function sp5OVrf(){try{return window.localStorage.getItem("spirit_openrouter_key_vrf")==="1";}catch(e){return false;}}
function sp5Msg(t){var m=$("sp5keymsg");if(m)m.textContent=t;}
function sp5PlaceCard(){try{var p=$("sp16panel"),c=$("sp5keycard"),kc=$("sp4keycard");if(p&&c&&c.parentNode!==p){if(kc&&kc.parentNode===p)p.insertBefore(c,kc);else p.appendChild(c);}}catch(e){}}
async function sp5CheckGemini(key){
  try{
    var r=await sp24Fetch("https://generativelanguage.googleapis.com/v1beta/models",{headers:{"x-goog-api-key":key}},10000);
    if(r.ok){try{window.localStorage.setItem("spirit_gemini_key_vrf","1");}catch(e){}if(sp5GBad===key)sp5GBad="";return "ok";}
    if(r.status===400||r.status===401||r.status===403){sp5GBad=key;try{window.localStorage.removeItem("spirit_gemini_key_vrf");}catch(e){}return "bad";}
    return "net";
  }catch(e){return "net";}
}
async function sp5CheckOR(key){
  try{
    var r=await sp24Fetch("https://openrouter.ai/api/v1/auth/key",{headers:{"Authorization":"Bearer "+key}},10000);
    if(r.ok){try{window.localStorage.setItem("spirit_openrouter_key_vrf","1");}catch(e){}if(sp5OBad===key)sp5OBad="";return "ok";}
    if(r.status===401||r.status===403){sp5OBad=key;try{window.localStorage.removeItem("spirit_openrouter_key_vrf");}catch(e){}return "bad";}
    return "net";
  }catch(e){return "net";}
}
(function(){try{
  var sv=$("sp5savekey");
  if(sv)sv.addEventListener("click",async function(){
    var inp=$("sp5key");var v=((inp&&inp.value)||"").trim();
    if(!v){sp5Msg("Pega primero tu llave en el campo.");return;}
    function saveGemini(verified){
      try{window.localStorage.setItem(LS_KEY,v);}catch(e){}
      sp5GBad="";sp5GCheckedFor=v;inp.value="";
      sp5Msg(verified?"Llave de Google aceptada y guardada: Gemini quedó ACTIVO.":"Llave de Gemini guardada. Sin conexión para comprobarla ahora: se comprueba sola al enviar tu primer mensaje.");
      keyState();render();
      bubble("ai","Gemini",verified?"Llave de Google comprobada y guardada en tu iPhone. Ya estoy en vivo: pregúntame lo que sea.":"Llave guardada en tu iPhone: pregúntame lo que sea y me compruebo al responder.");
    }
    function saveOR(verified){
      try{window.localStorage.setItem(LS_OK,v);}catch(e){}
      sp5OBad="";sp5OCheckedFor=v;inp.value="";
      sp5Msg(verified?"Llave de OpenRouter aceptada y guardada: OpenRouter quedó ACTIVO.":"Llave de OpenRouter guardada. Sin conexión para comprobarla ahora: se comprueba sola al enviar tu primer mensaje.");
      oHist.push({who:"OpenRouter",text:verified?"Llave de OpenRouter comprobada y guardada en tu iPhone. Ya estoy en vivo con los modelos gratuitos de Llama, Qwen y DeepSeek: pregúntame lo que sea.":"Llave guardada en tu iPhone: pregúntame lo que sea y me compruebo al responder."});save(LS_O,oHist);
      mode="openrouter";orKeyState();render();
    }
    /* v107: clasificacion por COMPROBACION EN VIVO, jamas por prefijo:
       primero Google (ListModels); si Google la rechaza, OpenRouter
       (/auth/key). Se guarda solo donde el servicio la ACEPTE, con la
       marca de comprobacion que pone la propia funcion de chequeo. */
    sp5Msg("Comprobando tu llave con Google…");
    var resG=await sp5CheckGemini(v);
    if(resG==="ok"){saveGemini(true);return;}
    sp5Msg("Comprobando tu llave con OpenRouter…");
    var resO=await sp5CheckOR(v);
    if(resO==="ok"){saveOR(true);return;}
    if(resG==="bad"&&resO==="bad"){
      sp5Msg("Esa llave no la aceptó ni Google ni OpenRouter. Revisa que la copiaste completa y pégala de nuevo.");
      return;
    }
    /* Ninguno la confirmo y al menos uno no respondio (sin conexion o
       respuesta rara): guardado «sin comprobar» SOLO si el prefijo
       indica el servicio y ESE servicio no la rechazo (patron v106).
       Sin prefijo y sin comprobacion posible: no se guarda nada. */
    if(resG!=="bad"&&v.indexOf("AIza")===0){saveGemini(false);return;}
    if(resO!=="bad"&&v.indexOf("sk-or-")===0){saveOR(false);return;}
    if(resG==="bad"||resO==="bad"){
      sp5Msg((resG==="bad"?"Google":"OpenRouter")+" no aceptó esta llave y el otro servicio no respondió para comprobarla. Revisa que la copiaste completa y pégala de nuevo.");
      return;
    }
    sp5Msg("Sin conexión no pude comprobar tu llave. Revisa tu señal y toca Guardar de nuevo.");
  });
  var grm=$("sp4keyremove");
  if(grm)grm.addEventListener("click",function(){
    try{window.localStorage.removeItem(LS_KEY);window.localStorage.removeItem("spirit_gemini_key_vrf");}catch(e){}
    sp5GBad="";sp5GCheckedFor="";sp5Msg("");keyState();render();
  });
  var orm=$("sp4orremove");
  if(orm)orm.addEventListener("click",function(){
    try{window.localStorage.removeItem("spirit_openrouter_key_vrf");}catch(e){}
    sp5OBad="";sp5OCheckedFor="";
  });
  (function sp5PlaceTry(n){sp5PlaceCard();var p=$("sp16panel"),c=$("sp5keycard");if((!p||(c&&c.parentNode!==p))&&(n||0)<24)setTimeout(function(){sp5PlaceTry((n||0)+1);},250);})(0);
}catch(e){}})();
var SP12DONE=false;
async function sp12RefreshModels(key){
  /* v100-P1: el candado SP12DONE lo pone askGemini antes de llamar */
  var pref=["gemini-flash-latest","gemini-3-flash-preview","gemini-3.1-flash-lite","gemini-2.5-flash","gemini-2.5-flash-lite","gemini-2.0-flash-001","gemini-2.0-flash"]; /* v106: la familia 3.x de la documentacion vigente de Google va primero si la llave la ve en ListModels */
  try{
    var r=await sp24Fetch("https://generativelanguage.googleapis.com/v1beta/models",{headers:{"x-goog-api-key":key}},8000);
    var d=await r.json();
    if(r.ok&&d.models){try{window.localStorage.setItem("spirit_gemini_key_vrf","1");}catch(e){}if(sp5GBad===key)sp5GBad=""; /* v105: ListModels OK = llave de Gemini comprobada */
      var ok=d.models.filter(function(m){return (m.supportedGenerationMethods||[]).indexOf("generateContent")>=0;}).map(function(m){return m.name.replace("models/","");}).filter(function(n){return n.indexOf("tts")<0&&n.indexOf("embedding")<0&&n.indexOf("aqa")<0&&n.indexOf("-image")<0&&n.indexOf("computer-use")<0&&n.indexOf("-live")<0&&n.indexOf("native-audio")<0&&n.indexOf("transcribe")<0&&n.indexOf("lyria")<0;}); /* v100.1: fuera modelos de solo-voz/imagen/embeddings: no sirven para chat y un 400 suyo se confundia con llave mala */
      var ordered=[];
      pref.forEach(function(p){if(ok.indexOf(p)>=0)ordered.push(p);});
      ok.forEach(function(m){if(m.indexOf("flash")>=0&&m.indexOf("lite")<0&&ordered.indexOf(m)<0)ordered.push(m);});
      ok.forEach(function(m){if(m.indexOf("flash-lite")>=0&&ordered.indexOf(m)<0)ordered.push(m);});
      ok.forEach(function(m){if(m.indexOf("pro")<0&&ordered.indexOf(m)<0)ordered.push(m);});
      ok.forEach(function(m){if(ordered.indexOf(m)<0)ordered.push(m);}); /* v100: Pro solo al final, si la tarea lo exige */
      if(ordered.length)models=ordered;
    }
  }catch(e){}
  if(models.indexOf("gemini-1.5-flash")>=0)models=models.filter(function(m){return m!=="gemini-1.5-flash";});
}
function sp12Human(st){
  if(st===503||st===429)return "Gemini está saturado en este momento (su nivel gratis se llena). Espera un minuto y pregúntame de nuevo.";
  if(st===401||st===403)return "Google no aceptó la llave guardada. Pégala de nuevo en Ajustes (engranaje) y toca Guardar.";
  if(st===400)return "Ningún modelo de Gemini pudo con esa petición tal como está. Hazla más simple o divídela en partes e inténtalo de nuevo.";
  if(st===-1||st===0)return "Sin conexión en este momento. Revisa tu señal e inténtalo de nuevo.";
  if(st===451)return "Gemini bloqueó esa respuesta por sus filtros de seguridad. Reformula la pregunta e inténtalo de nuevo.";
  if(st===-3)return "Ningún modelo respondió a tiempo. Revisa tu señal e inténtalo de nuevo.";
  return "No pude responder en este momento. Inténtalo de nuevo en un minuto.";
}
function sp24Fetch(url,opts,ms){return new Promise(function(res,rej){var c=new AbortController();var t=setTimeout(function(){c.abort();},ms);var o={};for(var k in opts)o[k]=opts[k];o.signal=c.signal;fetch(url,o).then(function(r){clearTimeout(t);res(r);}).catch(function(e){clearTimeout(t);rej(e);});});}
async function askGemini(text){
  var key=getKey();
  if(!key){bubble("ai","Gemini","Todavía no tengo llave en este iPhone. Créala gratis en aistudio.google.com/apikey y pégala en Ajustes (engranaje): tardo 1 minuto en encenderme.");return;}
  if(sp25Busy){var sp25q=setInterval(function(){if(!sp25Busy){clearInterval(sp25q);askGemini(text);}},700);return;}
  sp25Busy=true;
  try{musaPillShow();}catch(x){}
  var __perf={t0:(window.performance&&performance.now)?performance.now():Date.now(),first:0};
  window.__musaMarkFirst=function(){if(!__perf.first)__perf.first=(window.performance&&performance.now)?performance.now():Date.now();};
  window.__musaPerfPush=function(ok){try{var a=[];try{a=JSON.parse(localStorage.getItem("musa_perf_v1")||"[]");}catch(e){}a.push({ttft:__perf.first?Math.round(__perf.first-__perf.t0):-1,total:Math.round(((window.performance&&performance.now)?performance.now():Date.now())-__perf.t0),ok:ok?1:0,ts:Date.now()});if(a.length>50)a=a.slice(a.length-50);localStorage.setItem("musa_perf_v1",JSON.stringify(a));}catch(e){}};
  window.__musaPerfStats=function(){try{var a=JSON.parse(localStorage.getItem("musa_perf_v1")||"[]").map(function(x){return x.ttft;}).filter(function(x){return x>=0;}).sort(function(x,y){return x-y;});if(!a.length)return "sin datos aun";function pq(q){return a[Math.min(a.length-1,Math.floor(q*a.length))];}return "TTFT n="+a.length+" p50="+pq(0.5)+" ms p95="+pq(0.95)+" ms (meta ChatGPT: p50<700, p95<1500)";}catch(e){return "sin datos";}};
  var contents=gHist.filter(function(m){return m.who==="me"||m.who==="Gemini";}).slice(-14).map(function(m){return{role:m.who==="me"?"user":"model",parts:[{text:m.text}]};});
  contents.push({role:"user",parts:[{text:text}]});
  var box=$("sp4msgs");
  var wd=document.createElement("div");wd.id="sp24wait";wd.className="sp4m ai";
  var wst=document.createElement("span");wst.id="sp25status";wst.textContent="Conectando…";
  var dots=document.createElement("span");dots.className="sp25dots";dots.setAttribute("aria-hidden","true");dots.innerHTML="<i></i><i></i><i></i>";
  wd.appendChild(wst);wd.appendChild(dots);
  var near0=sp25Near(box);box.appendChild(wd);if(near0)box.scrollTop=1e7;else sp25ShowJump(true);
  var stopB=document.createElement("button");stopB.id="sp25stop";stopB.type="button";stopB.textContent="Detener";
  stopB.style.cssText="display:block;margin:4px 0 8px auto;padding:5px 12px;border:1px solid #d9d9d9;border-radius:999px;background:#fff;color:#333;font-size:12px;cursor:pointer";
  stopB.addEventListener("click",function(){sp25Cancel();});
  box.appendChild(stopB);
  function sp25StopOff(){var b=document.getElementById("sp25stop");if(b)b.remove();}
  function sp24Done(){var e=document.getElementById("sp24wait");if(e)e.remove();}
  /* v100-P1: no bloquear el primer token con ListModels; refresca en segundo plano */
  if(!SP12DONE){SP12DONE=true;sp12RefreshModels(key);}
  var lastSt=0,lastErr="",lastKeyBad=false;
  var tStart=Date.now();
  async function sp100Wait(ms,why){
    var end=Date.now()+ms;
    while(Date.now()<end){
      var left=Math.ceil((end-Date.now())/1000);
      sp25SetStatus(why+" Reintento en "+left+" s…");
      await sp25Sleep(Math.min(1000,Math.max(0,end-Date.now())));
    }
  }
  var delays=[1000,2000,4000],di=0;
  /* v100: Token Bucket local (ritmo amable con el nivel gratis) + backoff con jitter */
  var SP100TB={n:10,max:10,last:Date.now()};
  function sp100Jitter(ms){return Math.round(ms*(1+Math.random()*0.4));}
  async function sp100Take(){
    for(;;){
      var nowT=Date.now();SP100TB.n=Math.min(SP100TB.max,SP100TB.n+(nowT-SP100TB.last)/2000);SP100TB.last=nowT;
      if(SP100TB.n>=1){SP100TB.n-=1;return;}
      sp25SetStatus("Esperando turno (ritmo del nivel gratis)…");
      await sp25Sleep(500);
    }
  }
  var maxM=Math.min(models.length,4); /* v100: la cadena Flash>Lite necesita un intento mas */
  var SYS="Eres Gemini, asistente del equipo de Crecer Digital. Tu jefa es Muse. Respondes en español, directo, útil y breve salvo que pidan detalle.";
  function sp25Finish(acc){try{idbSet("spirit_chat_draft_v1",null);}catch(e){}sp25StopOff();sp25ActiveCtrl=null;if(window.__musaPerfPush)window.__musaPerfPush(true);gHist.push({who:"Gemini",text:acc});save(LS_G,gHist);bubble("ai","Gemini",acc);sp16Speak(acc);sp25Busy=false;try{musaPillHide();}catch(x){}}
  for(var mi=0;mi<maxM;mi++){
    var nextModel=false;
    var mr=0; /* v100: max. 3 reintentos por modelo */
    while(!nextModel){
      var acc="",liveEl=null,liveBody=null,stallT=null,paintPend=false;
      var finReason="";
      function sp100Paint(){
        paintPend=false;
        if(!liveBody||!liveEl)return;
        liveBody.textContent=acc;
        if(sp25Near(box))box.scrollTop=1e7;else sp25ShowJump(true);
      }
      function sp100PaintSoon(){
        if(paintPend)return;paintPend=true;
        if(window.requestAnimationFrame)requestAnimationFrame(sp100Paint);else setTimeout(sp100Paint,16);
      }
      try{
        sp25SetStatus(di>0?"Reintentando…":(mi>0?"Ese modelo se saturó, probando otro…":"Conectando…"));
        var ctrl=new AbortController();sp25ActiveCtrl=ctrl;
        var firstChunk=true;
        var stallFired=false;
        var armStall=function(){if(stallT)clearTimeout(stallT);stallT=setTimeout(function(){stallFired=true;try{ctrl.abort();}catch(e){}},firstChunk?6000:30000);}; /* v100-V4: stallFired distingue el corte por inactividad de la saturacion */
        armStall();
        await sp100Take();
        armStall(); /* v100-V4: el vigilante corre desde que sale el fetch, no desde la espera del Token Bucket */
        var r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+models[mi]+":streamGenerateContent?alt=sse",{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},body:JSON.stringify({systemInstruction:{parts:[{text:SYS}]},contents:contents}),signal:ctrl.signal});
        if(!r.ok){
          lastSt=r.status;
          if(stallT)clearTimeout(stallT);
          if((r.status===429||r.status===503)&&mr<3&&di<delays.length&&(Date.now()-tStart)<60000){
            mr++;
            var ra=parseInt(r.headers.get("Retry-After")||"0",10);
            var waitMs=ra>0?Math.min(ra*1000,15000):sp100Jitter(delays[di]);
            di++;
            await sp100Wait(waitMs,"Gemini saturado ("+models[mi]+").");
            continue;
          }
          /* v100-V3: leer la causa real; llave/peticion mala no se cura rotando modelos */
          var errMsg="";try{var et=await r.text();var ej=JSON.parse(et);errMsg=(ej&&ej.error&&ej.error.message)||"";}catch(e){}
          if(errMsg)lastErr=errMsg.slice(0,180);
          if(r.status===401||r.status===403){lastKeyBad=true;mi=maxM;nextModel=true;break;}
          if(r.status===400){
            if(/api.?key/i.test(errMsg)||/API_KEY_INVALID/.test(errMsg)){lastKeyBad=true;mi=maxM;nextModel=true;break;} /* llave mala de verdad: no se cura rotando */
            /* v100.1: 400 de capacidad del modelo (p. ej. un modelo sin chat multiturno): se marca muerto en la sesion y se prueba el siguiente, sin culpar a la llave */
            var deadM=models[mi];models=models.filter(function(m){return m!==deadM;});
            nextModel=true;break;
          }
          nextModel=true;break;
        }
        sp25SetStatus("Gemini está escribiendo…");
        var feedBuf="",evtData=[],dropped=0;
        function sp100FlushEvt(force){
          if(!evtData.length)return;
          var js=evtData.join("\n");
          if(js==="[DONE]"){evtData=[];return;}
          var o=null;
          try{o=JSON.parse(js);}catch(e){
            if(!force)return; /* JSON partido en varias lineas data:; se sigue acumulando */
            dropped++;evtData=[];
            try{console.warn("MUSA SSE: evento descartado ("+dropped+")");}catch(e2){}
            return;
          }
          evtData=[];
          var ps=(o&&o.candidates&&o.candidates[0]&&o.candidates[0].content&&o.candidates[0].content.parts)||[];
          var fr=o&&o.candidates&&o.candidates[0]&&o.candidates[0].finishReason;if(fr&&fr!=="STOP")finReason=fr;
          var add="";for(var pi=0;pi<ps.length;pi++)add+=ps[pi].text||"";
          if(!add)return;
          acc+=add;
          if(firstChunk){firstChunk=false;armStall();} /* conserva el failover del Frente 1 */
          if(window.__musaMarkFirst)window.__musaMarkFirst(); /* V6: marca de primer token */
          if(!liveEl){
            sp24Done();
            liveEl=document.createElement("div");liveEl.className="sp4m ai";
            var w=document.createElement("span");w.className="who";w.textContent=(SP6AV["Gemini"]||"")+"Gemini";
            if(SP8IMG["Gemini"]){var av=document.createElement("img");av.src=SP8IMG["Gemini"];av.alt="";av.className="sp8ava";av.onerror=function(){av.remove();};w.insertBefore(av,w.firstChild);}
            liveBody=document.createElement("div");liveBody.className="sp25body";
            liveEl.appendChild(w);liveEl.appendChild(liveBody);box.appendChild(liveEl);
          }
          sp100PaintSoon();
        }
        var sp25Feed=function(chunk){
          feedBuf+=chunk;
          var lines=feedBuf.split("\n");feedBuf=lines.pop();
          for(var li=0;li<lines.length;li++){
            var ln=lines[li].replace(/^\s+|\s+$/g,"");
            if(!ln){sp100FlushEvt(true);continue;}
            if(ln.indexOf("data:")===0){evtData.push(ln.slice(5).replace(/^\s+|\s+$/g,""));sp100FlushEvt(false);continue;}
            /* lineas event:/id:/retry: y comentarios ":" se ignoran, como manda SSE */
          }
        };
        function sp25Flush(){
          if(feedBuf&&feedBuf.replace(/^\s+|\s+$/g,""))sp25Feed("\n");
          sp100FlushEvt(true);
          if(dropped&&acc)acc=acc+"\n\nSe perdió un fragmento de la transmisión. Si falta algo, toca Regenerar.";
        }
        if(r.body&&typeof r.body.getReader==="function"){
          var reader=r.body.getReader();var dec=new TextDecoder();
          var lastCk=0;
          while(true){var rd=await reader.read();armStall();if(rd.done)break;if(rd.value){sp25Feed(dec.decode(rd.value,{stream:true}));if(acc&&Date.now()-lastCk>4000){lastCk=Date.now();try{idbSet("spirit_chat_draft_v1",{text:acc,ts:Date.now()});}catch(e){}}}}
          /* v100-V1 (sustituye al vaciado P3): vaciar el decoder y cerrar el evento pendiente */
          var tail=dec.decode();if(tail)sp25Feed(tail);
          sp25Flush();
        }else{
          sp25Feed(await r.text());
          sp25Flush();
        }
        /* v100-P4: causa real del cierre */
        if(finReason==="SAFETY"&&!acc){lastSt=451;nextModel=true;break;}
        if(finReason==="MAX_TOKENS"&&acc)acc=acc+"\n\nRespuesta cortada por longitud. Pídeme «sigue» y continúo.";
        if(stallT)clearTimeout(stallT);
        if(acc){if(liveEl){liveEl.remove();liveEl=null;liveBody=null;}sp25Finish(acc);return;}
        lastSt=503;nextModel=true;
      }catch(e){
        if(stallT)clearTimeout(stallT);
        if(sp25UserCancel){
          sp25UserCancel=false;sp25ActiveCtrl=null;
          if(acc){if(liveEl){liveEl.remove();liveEl=null;liveBody=null;}sp25Finish(acc+"\n\nDetenido por ti: esto es lo que llegó.");}
          else{sp24Done();sp25StopOff();sp25Busy=false;try{musaPillHide();}catch(x){}bubble("ai","Gemini","Detenido. Pregúntame otra cosa cuando quieras.");}
          return;
        }
        if(acc){if(liveEl){liveEl.remove();liveEl=null;liveBody=null;}sp25Finish(acc+"\n\nLa conexión se cortó: esto es lo que llegó. Toca Regenerar para pedirla completa.");return;}
        lastSt=(e&&e.name==="AbortError")?503:0;
        if(stallFired&&!acc){lastSt=-3;nextModel=true;break;} /* v100-V4: modelo mudo -> failover directo, sin quemar reintentos en el mismo */
        if(mr<3&&di<delays.length&&(Date.now()-tStart)<60000){mr++;await sp100Wait(sp100Jitter(delays[di++]),"Se cortó la conexión.");continue;}
        nextModel=true;
      }
    }
  }
  sp24Done();sp25StopOff();sp25ActiveCtrl=null;sp25Busy=false;try{musaPillHide();}catch(x){}if(window.__musaPerfPush)window.__musaPerfPush(false);
  if(lastKeyBad){try{window.localStorage.removeItem("spirit_gemini_key_vrf");}catch(e){}sp5GBad=key;keyState();bubble("ai","Gemini","La llave de Gemini guardada no es válida: Google la rechazó. Pega en Ajustes (engranaje) la llave de Google — empieza con «AIza» — y toca Guardar.");}
  else bubble("ai","Gemini",sp12Human(lastSt)+(lastErr?"\n\nDetalle de Google: "+lastErr:""));
  sp25AttachRetry(text);
}

/* Ola 100 · F6: Pollinations EN VIVO dentro de MUSA — API de texto gratuita y
   anonima (sin llave, CORS abierto), una pieza por llamada GET, modelo
   openai-fast. Reutiliza bubble(), sp25SetStatus, sp25Cancel y save(). */
function spPAttachRetry(userText){try{var box=$("sp4msgs");var d=box.lastElementChild;if(!d)return;var b=document.createElement("button");b.className="sp4copy";b.type="button";b.textContent="Reintentar";b.addEventListener("click",function(){if(!sp25Busy)askPollinations(userText);});var acts=d.querySelector(".sp25acts");if(acts)acts.appendChild(b);else d.appendChild(b);}catch(e){}}
async function askPollinations(text){
  if(sp25Busy){var spPq=setInterval(function(){if(!sp25Busy){clearInterval(spPq);askPollinations(text);}},700);return;}
  sp25Busy=true;sp25UserCancel=false;
  var box=$("sp4msgs");
  var wd=document.createElement("div");wd.id="sp24wait";wd.className="sp4m ai";
  var wst=document.createElement("span");wst.id="sp25status";wst.textContent="Conectando\u2026";
  var dots=document.createElement("span");dots.className="sp25dots";dots.setAttribute("aria-hidden","true");dots.innerHTML="<i></i><i></i><i></i>";
  wd.appendChild(wst);wd.appendChild(dots);
  var near0=sp25Near(box);box.appendChild(wd);if(near0)box.scrollTop=1e7;else sp25ShowJump(true);
  var ctrl=new AbortController();sp25ActiveCtrl=ctrl;
  var stopB=document.createElement("button");stopB.id="sp25stop";stopB.type="button";stopB.textContent="Detener";
  stopB.style.cssText="display:block;margin:4px 0 8px auto;padding:5px 12px;border:1px solid #d9d9d9;border-radius:999px;background:#fff;color:#333;font-size:12px;cursor:pointer";
  stopB.addEventListener("click",function(){sp25Cancel();});
  box.appendChild(stopB);
  function spPDone(){var e=document.getElementById("sp24wait");if(e)e.remove();var b=document.getElementById("sp25stop");if(b)b.remove();}
  var to=setTimeout(function(){try{ctrl.abort();}catch(e){}},45000);
  try{
    sp25SetStatus("Pollinations est\u00e1 escribiendo\u2026");
    var SYS="Eres Pollinations, asistente del equipo de Crecer Digital. Tu jefa es Muse. Respondes en espa\u00f1ol, directo, \u00fatil y breve salvo que pidan detalle.";
    var ctx=pHist.filter(function(m){return m.who==="me"||m.who==="Pollinations";}).slice(-6).map(function(m){return (m.who==="me"?"Usuario: ":"Pollinations: ")+m.text;}).join("\n");
    var prompt=SYS+"\n\n"+(ctx?ctx+"\n":"")+"Usuario: "+text+"\nPollinations:";
    if(prompt.length>3500)prompt=SYS+"\n\nUsuario: "+text+"\nPollinations:";
    var r=await fetch("https://text.pollinations.ai/"+encodeURIComponent(prompt)+"?model=openai-fast",{signal:ctrl.signal});
    clearTimeout(to);
    if(!r.ok)throw new Error("HTTP "+r.status);
    var acc=(await r.text()||"").replace(/^\s+|\s+$/g,"");
    spPDone();sp25ActiveCtrl=null;sp25Busy=false;
    if(!acc){bubble("ai","Pollinations","Llegu\u00e9 vac\u00edo esta vez. Preg\u00fantame de nuevo.");return;}
    pHist.push({who:"Pollinations",text:acc});save(LS_P,pHist);bubble("ai","Pollinations",acc);sp16Speak(acc);
  }catch(e){
    clearTimeout(to);spPDone();sp25ActiveCtrl=null;sp25Busy=false;
    if(sp25UserCancel){sp25UserCancel=false;bubble("ai","Pollinations","Detenido. Preg\u00fantame otra cosa cuando quieras.");return;}
    bubble("ai","Pollinations","No pude responder ahora: mi servicio gratuito a veces se satura o tarda demasiado. Int\u00e9ntalo de nuevo en un momento.");
    spPAttachRetry(text);
  }
}
/* MUSA v104 · OpenRouter DENTRO de MUSA — el hueco del ejercito con llave
   propia (mismo patron que la de Gemini): la llave vive SOLO en este iPhone
   (spirit_openrouter_key). Sin llave, OpenRouter NO aparece como miembro
   activo: ni retrato en el selector ni boton de modo. Con llave, suma los
   modelos gratuitos de OpenRouter (Llama, Qwen, DeepSeek) via su API
   compatible. Nada fingido: sin llave, el hueco solo existe como tarjeta
   en Ajustes para pegar la llave. */
var SPOR_MODELS=["openrouter/free","nvidia/nemotron-3-ultra-550b-a55b:free","google/gemma-4-31b-it:free","inclusionai/ling-3.2-flash:free","baidu/ernie-5.5-flash-preview:free","nvidia/nemotron-3.5-lightning:free","google/gemma-4-26b-a4b-it:free"]; /* v106: respaldo fijo = catalogo gratuito de OpenRouter verificado el 2026-11-16; los 5 :free de v104/v105 ya no existen como gratuitos */
var SPOR_DONE=false;
async function spORRefreshModels(){ /* v106: descubrimiento en vivo del catalogo gratuito (sin llave: el catalogo es publico); si falla, queda el respaldo fijo de arriba */
  try{
    var r=await sp24Fetch("https://openrouter.ai/api/v1/models",{},8000);
    var d=await r.json();
    if(!r.ok||!d||!d.data)return;
    var free=d.data.filter(function(m){var pr=m.pricing||{};return parseFloat(pr.prompt||"1")===0&&parseFloat(pr.completion||"1")===0;}).map(function(m){return m.id;}).filter(function(id){return id==="openrouter/free"||/:free$/.test(id);});
    var pref=["openrouter/free","nvidia/nemotron-3-ultra-550b-a55b:free","google/gemma-4-31b-it:free","inclusionai/ling-3.2-flash:free","baidu/ernie-5.5-flash-preview:free","nvidia/nemotron-3.5-lightning:free","google/gemma-4-26b-a4b-it:free"];
    var ordered=[];
    pref.forEach(function(x){if(free.indexOf(x)>=0)ordered.push(x);});
    free.forEach(function(x){if(ordered.indexOf(x)<0&&x.indexOf("lyria")<0)ordered.push(x);});
    if(ordered.length)SPOR_MODELS=ordered;
  }catch(e){}
}
var spORBuilt=false;
function getORKey(){try{return window.localStorage.getItem(LS_OK)||"";}catch(e){return "";}}
function spORSync(){try{
  var order=["team","team","gemini","pollinations","openrouter"];
  Array.prototype.forEach.call(document.querySelectorAll(".sp16trio"),function(trio){
    Array.prototype.forEach.call(trio.children,function(btn){
      if(btn.getAttribute&&btn.getAttribute("data-or")==="1"){btn.className=(mode==="openrouter")?"on":"";return;}
      var dm=btn.getAttribute?btn.getAttribute("data-m"):null;
      if(dm){btn.className=(dm===mode)?"on":"";}
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll(".sp16trio"),function(trio){
    var kids=trio.children;
    for(var i=0;i<kids.length;i++){var btn=kids[i];if(btn.getAttribute&&btn.getAttribute("data-or")==="1")continue;if(btn.getAttribute&&btn.getAttribute("data-m"))continue;if(order[i])btn.className=(order[i]===mode)?"on":"";}
  });
}catch(e){}}
function spORBuildTrio(){if(spORBuilt)return;spORBuilt=true;try{
  Array.prototype.forEach.call(document.querySelectorAll(".sp16trio"),function(trio){
    var btn=document.createElement("button");btn.type="button";btn.setAttribute("data-or","1");btn.setAttribute("data-m","openrouter");
    btn.innerHTML='<img src="'+SPOR_ICON+'" alt="OpenRouter"><span>OpenRouter</span>';
    btn.addEventListener("click",function(){mode="openrouter";render();});
    trio.appendChild(btn);trio.className="sp16trio five";
  });
}catch(e){}}
function orKeyState(){
  var k=getORKey();
  var panel=$("sp16panel"),card=$("sp4orcard");
  if(panel&&card&&card.parentNode!==panel)panel.appendChild(card);
  var stEl=$("sp4orstate"),row=$("sp4orrow"),mb=$("sp4mOR"),rm=$("sp4orremove");
  if(stEl){if(!k)stEl.innerHTML="<b>Tu llave de OpenRouter</b> — suma a Llama, Qwen y DeepSeek al ejército (se guarda solo en tu teléfono):";
    else if(sp5OBad===k)stEl.innerHTML="<b>OpenRouter no aceptó la llave guardada.</b> Pega la llave de OpenRouter en el campo de arriba y toca Guardar: la app la comprueba sola.";
    else if(sp5OVrf())stEl.innerHTML="<b>OpenRouter en vivo: ACTIVO</b> en este iPhone (Llama, Qwen y DeepSeek gratuitos).";
    else stEl.innerHTML="<b>OpenRouter: llave guardada en este iPhone.</b> Se comprueba sola: en cuanto OpenRouter responda, queda ACTIVO.";}
  if(row)row.style.display="none";
  if(rm)rm.style.display=k?"inline-block":"none";
  if(k)spORBuildTrio();
  if(mb)mb.style.display=k?"":"none";
  Array.prototype.forEach.call(document.querySelectorAll('[data-or="1"]'),function(b){b.style.display=k?"":"none";});
  if(k&&sp5OBad!==k&&!sp5OVrf()&&sp5OCheckedFor!==k&&!sp5OCheckBusy){sp5OCheckedFor=k;sp5OCheckBusy=true;sp5CheckOR(k).then(function(){sp5OCheckBusy=false;orKeyState();});}
}
(function(){try{
  var sv=$("sp4orsave");
  if(sv)sv.addEventListener("click",function(){
    var v=$("sp4orkey").value.trim();
    if(!v){alert("Pega primero tu llave de OpenRouter.");return;}
    try{window.localStorage.setItem(LS_OK,v);}catch(e){}
    $("sp4orkey").value="";
    oHist.push({who:"OpenRouter",text:"Llave guardada en tu iPhone. Ya estoy en vivo con los modelos gratuitos de Llama, Qwen y DeepSeek: pregúntame lo que sea."});save(LS_O,oHist);
    mode="openrouter";render();
  });
  var rm=$("sp4orremove");
  if(rm)rm.addEventListener("click",function(){
    try{window.localStorage.removeItem(LS_OK);}catch(e){}
    if(mode==="openrouter")mode="gemini";
    render();
  });
}catch(e){}})();
function spOAttachRetry(userText){try{var box=$("sp4msgs");var d=box.lastElementChild;if(!d)return;var b=document.createElement("button");b.className="sp4copy";b.type="button";b.textContent="Reintentar";b.addEventListener("click",function(){if(!sp25Busy)askOpenRouter(userText);});var acts=d.querySelector(".sp25acts");if(acts)acts.appendChild(b);else d.appendChild(b);}catch(e){}}
async function askOpenRouter(text){
  var key=getORKey();
  if(!key){bubble("ai","OpenRouter","Todavía no tengo llave en este iPhone. Créala gratis en openrouter.ai/keys y pégala en Ajustes (engranaje): tardo 1 minuto en encenderme.");return;}
  if(sp25Busy){var spOq=setInterval(function(){if(!sp25Busy){clearInterval(spOq);askOpenRouter(text);}},700);return;}
  sp25Busy=true;sp25UserCancel=false;
  var box=$("sp4msgs");
  var wd=document.createElement("div");wd.id="sp24wait";wd.className="sp4m ai";
  var wst=document.createElement("span");wst.id="sp25status";wst.textContent="Conectando…";
  var dots=document.createElement("span");dots.className="sp25dots";dots.setAttribute("aria-hidden","true");dots.innerHTML="<i></i><i></i><i></i>";
  wd.appendChild(wst);wd.appendChild(dots);
  var near0=sp25Near(box);box.appendChild(wd);if(near0)box.scrollTop=1e7;else sp25ShowJump(true);
  var ctrl=new AbortController();sp25ActiveCtrl=ctrl;
  var stopB=document.createElement("button");stopB.id="sp25stop";stopB.type="button";stopB.textContent="Detener";
  stopB.style.cssText="display:block;margin:4px 0 8px auto;padding:5px 12px;border:1px solid #d9d9d9;border-radius:999px;background:#fff;color:#333;font-size:12px;cursor:pointer";
  stopB.addEventListener("click",function(){sp25Cancel();});
  box.appendChild(stopB);
  function spODone(){var e=document.getElementById("sp24wait");if(e)e.remove();var b=document.getElementById("sp25stop");if(b)b.remove();}
  var to=setTimeout(function(){try{ctrl.abort();}catch(e){}},60000);
  var SYS="Eres un miembro del equipo de Crecer Digital que responde vía OpenRouter. Tu jefa es Muse. Respondes en español, directo, útil y breve salvo que pidan detalle.";
  var msgs=[{role:"system",content:SYS}];
  oHist.filter(function(m){return m.who==="me"||m.who==="OpenRouter";}).slice(-8).forEach(function(m){msgs.push({role:m.who==="me"?"user":"assistant",content:m.text});});
  msgs.push({role:"user",content:text});
  var lastSt=0,acc="";
  if(!SPOR_DONE){SPOR_DONE=true;await spORRefreshModels();} /* v106: catalogo fresco una vez por sesion */
  for(var oi=0;oi<SPOR_MODELS.length&&!acc;oi++){
    if(sp25UserCancel)break;
    try{
      sp25SetStatus("OpenRouter está escribiendo…");
      var r=await fetch("https://openrouter.ai/api/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+key,"X-Title":"MUSA"},body:JSON.stringify({model:SPOR_MODELS[oi],messages:msgs}),signal:ctrl.signal});
      lastSt=r.status;
      if(r.status===401||r.status===403)break;
      if(!r.ok)continue;
      var d=await r.json();
      acc=String((d&&d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content)||"").replace(/^\s+|\s+$/g,"");
    }catch(e){if(sp25UserCancel)break;}
  }
  clearTimeout(to);spODone();sp25ActiveCtrl=null;sp25Busy=false;
  if(sp25UserCancel){sp25UserCancel=false;bubble("ai","OpenRouter","Detenido. Pregúntame otra cosa cuando quieras.");return;}
  if(!acc){
    if(lastSt===401||lastSt===403){try{window.localStorage.removeItem("spirit_openrouter_key_vrf");}catch(e){}sp5OBad=key;orKeyState();bubble("ai","OpenRouter","La llave de OpenRouter guardada no fue aceptada: no es válida para OpenRouter. Pega en Ajustes (engranaje) la llave de OpenRouter — empieza con «sk-or-» — y toca Guardar.");return;}
    if(lastSt===429){bubble("ai","OpenRouter","Los modelos gratuitos de OpenRouter están saturados ahora mismo (límite del nivel gratis). Espera un minuto e inténtalo de nuevo.");spOAttachRetry(text);return;}
    if(lastSt===200){bubble("ai","OpenRouter","Los modelos gratuitos de OpenRouter no devolvieron respuesta esta vez. Inténtalo de nuevo en un momento.");spOAttachRetry(text);return;}
    if(lastSt>0){bubble("ai","OpenRouter","OpenRouter devolvió un error (código "+lastSt+") y ningún modelo gratuito pudo responder. Inténtalo de nuevo en un momento.");spOAttachRetry(text);return;}
    bubble("ai","OpenRouter","Sin conexión con OpenRouter en este momento. Revisa tu señal e inténtalo de nuevo.");
    spOAttachRetry(text);return;
  }
  try{window.localStorage.setItem("spirit_openrouter_key_vrf","1");}catch(e){} /* v105: respuesta real = llave de OpenRouter comprobada */
  oHist.push({who:"OpenRouter",text:acc});save(LS_O,oHist);bubble("ai","OpenRouter",acc);sp16Speak(acc);
}
$("sp4send").addEventListener("click",function(){
  var t=$("sp4input").value.trim();if(!t)return;$("sp4input").value="";
  if(mode==="gemini"){gHist.push({who:"me",text:t});save(LS_G,gHist);bubble("ai","me",t);askGemini(t);}
  else if(mode==="pollinations"){pHist.push({who:"me",text:t});save(LS_P,pHist);bubble("ai","me",t);askPollinations(t);}
  else if(mode==="openrouter"){oHist.push({who:"me",text:t});save(LS_O,oHist);bubble("ai","me",t);askOpenRouter(t);}
  else{tHist.push({who:"me",text:t});save(LS_T,tHist);bubble("ai","me",t,true);var r="Guardado en tu bandeja del equipo. Muse lo recoge en su ronda y responde en MUSA junto con ChatGPT. Para activarlo al momento, copia el mensaje y pégalo en el chat de Muse.";tHist.push({who:"Equipo",text:r});save(LS_T,tHist);bubble("ai","Equipo",r);}
});
$("sp4mGem").addEventListener("click",function(){mode="gemini";render();});
$("sp4mTeam").addEventListener("click",function(){mode="team";render();});
$("sp4mPol").addEventListener("click",function(){mode="pollinations";render();});
$("sp4mOR").addEventListener("click",function(){mode="openrouter";render();});
$("sp4btn").addEventListener("click",function(){$("sp4chat").className="open";render();});
$("sp4close").addEventListener("click",function(){$("sp4chat").className="";});
function sp5Chips(){try{var raw=localStorage.getItem("spiritia.v3.estado");if(!raw)return;var st=JSON.parse(raw);var ms=(st&&st.metrics)||[];var t="",f="",s="";ms.forEach(function(m){var u=((m.label||"")+" "+(m.value||"")).toLowerCase();if(u.indexOf("tablero")>=0)t=m.value;if(u.indexOf("fondo")>=0)f=m.value;if(u.indexOf("semana")>=0)s=m.value;});var c=$("sp5chips");if(c)c.innerHTML="<span>Tablero "+(t||"44%")+"</span><span>Fondo "+(f||"$0 / $20,000")+"</span><span>Semana "+(s||"$0 / $400")+"</span>";}catch(e){}}
sp5Chips();
sp25JumpInit();
setTimeout(function(){$("sp4chat").className="open";render();},400);





/* MUSA v19: estado final garantizado — el panel de ajustes arranca CERRADO siempre */
(function(){try{var p=$("sp16panel");if(p)p.className="";}catch(e){}})();
/* MUSA v19 · BOVEDA BLINDADA: sus papeles cifrados con SU clave, solo en su telefono; ni Muse puede leerlos */
(function(){try{
  var LS="musa_boveda_v1",key=null,entries=null;
  var ov=document.createElement("div");ov.id="sp19vault";
  ov.innerHTML="<h2><svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' aria-hidden='true' style='vertical-align:-3px;margin-right:6px'><rect x='4' y='10' width='16' height='10' rx='2'/><path d='M8 10V7a4 4 0 0 1 8 0v3'/></svg>Bóveda blindada</h2><p id=\"sp19msg\">Tus papeles viven cifrados en este telefono, bajo TU clave. Nada sale de aqui; ni yo puedo leerlos.</p><div id=\"sp19lock\"><input id=\"sp19pass\" type=\"password\" placeholder=\"Tu clave de la boveda\" autocomplete=\"off\"><button id=\"sp19open\" type=\"button\">Crear o abrir boveda</button></div><div id=\"sp19main\" style=\"display:none\"><div id=\"sp19list\"></div><input id=\"sp19label\" type=\"text\" placeholder=\"Nombre (ej.: Pasaporte, SSN, Tarjeta)\"><input id=\"sp19value\" type=\"text\" placeholder=\"Valor secreto\" autocomplete=\"off\"><button id=\"sp19add\" type=\"button\">Guardar cifrado</button><button id=\"sp19close\" type=\"button\" class=\"ghost\">Cerrar y bloquear</button></div><button id=\"sp19exit\" type=\"button\" class=\"ghost\">Volver</button>";
  document.body.appendChild(ov);
  function enc(s){return new TextEncoder().encode(s);}
  function dec(b){return new TextDecoder().decode(b);}
  function b64(a){return btoa(String.fromCharCode.apply(null,new Uint8Array(a)));}
  function ub64(s){return Uint8Array.from(atob(s),function(c){return c.charCodeAt(0);});}
  function store(){try{return JSON.parse(localStorage.getItem(LS)||"null");}catch(e){return null;}}
  function derive(pass,salt){return crypto.subtle.importKey("raw",enc(pass),"PBKDF2",false,["deriveKey"]).then(function(km){return crypto.subtle.deriveKey({name:"PBKDF2",salt:salt,iterations:150000,hash:"SHA-256"},km,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);});}
  function saveAll(){var st=store()||{};var iv=crypto.getRandomValues(new Uint8Array(12));return crypto.subtle.encrypt({name:"AES-GCM",iv:iv},key,enc(JSON.stringify(entries))).then(function(ct){localStorage.setItem(LS,JSON.stringify({salt:st.salt,iv:b64(iv),data:b64(ct)}));});}
  function render(){var L=$("sp19list");L.innerHTML="";(entries||[]).forEach(function(en,i){var r=document.createElement("div");r.className="sp19row";r.innerHTML="<div><b></b><br><span>\u2022\u2022\u2022\u2022\u2022\u2022</span></div><div></div>";r.querySelector("b").textContent=en.label;var box=r.querySelectorAll("div")[1];var bv=document.createElement("button");bv.type="button";bv.textContent="Ver";bv.addEventListener("click",function(){var s=r.querySelector("span");s.textContent=(s.textContent.indexOf("\u2022")===0)?en.value:"\u2022\u2022\u2022\u2022\u2022\u2022";});var bd=document.createElement("button");bd.type="button";bd.className="ghost";bd.textContent="Borrar";bd.addEventListener("click",function(){entries.splice(i,1);saveAll().then(render);});box.appendChild(bv);box.appendChild(bd);L.appendChild(r);});}
  $("sp19open").addEventListener("click",function(){var pass=$("sp19pass").value;if(pass.length<4){$("sp19msg").textContent="Tu clave necesita al menos 4 caracteres.";return;}
    var st=store();
    if(!st){var salt=crypto.getRandomValues(new Uint8Array(16));derive(pass,salt).then(function(k){key=k;entries=[];localStorage.setItem(LS,JSON.stringify({salt:b64(salt),iv:"",data:""}));return saveAll();}).then(function(){$("sp19lock").style.display="none";$("sp19main").style.display="block";$("sp19msg").textContent="Boveda creada. Esta clave solo la sabes tu: no la guardes en chats.";render();});return;}
    derive(pass,ub64(st.salt)).then(function(k){return crypto.subtle.decrypt({name:"AES-GCM",iv:ub64(st.iv)},k,ub64(st.data)).then(function(pt){key=k;entries=JSON.parse(dec(pt));$("sp19lock").style.display="none";$("sp19main").style.display="block";$("sp19msg").textContent="Boveda abierta. Al cerrar, todo vuelve a quedar cifrado.";render();});}).catch(function(){$("sp19msg").textContent="Clave incorrecta: la boveda sigue cerrada.";});});
  $("sp19add").addEventListener("click",function(){var l=$("sp19label").value.trim(),v=$("sp19value").value;if(!l||!v)return;entries.push({label:l,value:v});$("sp19label").value="";$("sp19value").value="";saveAll().then(render);});
  function lock(){key=null;entries=null;$("sp19pass").value="";$("sp19main").style.display="none";$("sp19lock").style.display="block";$("sp19msg").textContent="Boveda bloqueada.";}
  $("sp19close").addEventListener("click",lock);
  $("sp19exit").addEventListener("click",function(){lock();ov.className="";});
  var dr=$("sp7drawer");if(dr){var b=document.createElement("button");b.type="button";b.textContent="Bóveda blindada";b.addEventListener("click",function(){ov.className="open";var d=$("sp7drawer");if(d)d.className="";var bd=$("sp7backdrop");if(bd)bd.className="";});dr.appendChild(b);}
}catch(e){}})();

/* MUSA v18: memoria sin cortes — el historial completo vive en IndexedDB (cuota enorme), no en el cajon chico */
function idbOpen(cb){try{var r=indexedDB.open("musa-memoria",1);r.onupgradeneeded=function(){try{r.result.createObjectStore("kv");}catch(e){}};r.onsuccess=function(){cb(r.result);};r.onerror=function(){cb(null);};}catch(e){cb(null);}}
function idbSet(k,v){idbOpen(function(db){if(!db)return;try{db.transaction("kv","readwrite").objectStore("kv").put(v,k);}catch(e){}});}
function idbGet(k,cb){idbOpen(function(db){if(!db){cb(null);return;}try{var rq=db.transaction("kv").objectStore("kv").get(k);rq.onsuccess=function(){cb(rq.result||null);};rq.onerror=function(){cb(null);};}catch(e){cb(null);}});}
var __saveOrig=save;
save=function(k,v){try{if(k===LS_G||k===LS_T||k===LS_P){idbSet(k,v);try{localStorage.removeItem(k);}catch(e){}return;}}catch(e){}__saveOrig(k,v);};
(function(){try{
  var marks=["is not found for API version","Call ModelService","No pude responder ahora:","supported for generateContent","not supported for generateContent"];
  function clean(a){return (a||[]).filter(function(m){var t=(m&&m.text)||"";return !marks.some(function(x){return t.indexOf(x)>=0;});});}
  idbGet(LS_G,function(v){var old=clean(load(LS_G,[]));if(v&&v.length>=old.length){gHist=clean(v);}else{gHist=old;if(old.length)idbSet(LS_G,old);}render();});
  idbGet(LS_T,function(v){var old=clean(load(LS_T,[]));if(v&&v.length>=old.length){tHist=clean(v);}else{tHist=old;if(old.length)idbSet(LS_T,old);}render();});
  idbGet(LS_P,function(v){var old=clean(load(LS_P,[]));if(v&&v.length>=old.length){pHist=clean(v);}else{pHist=old;if(old.length)idbSet(LS_P,old);}render();});
  idbGet("spirit_chat_draft_v1",function(d){try{if(d&&d.text&&d.text.length>20){gHist.push({who:"Gemini",text:d.text+"\n\nRespuesta recuperada: la app se cerró mientras escribía. Esto es lo que alcanzó a llegar."});idbSet(LS_G,gHist);idbSet("spirit_chat_draft_v1",null);render();}}catch(e){}});
  var p=$("sp16panel");if(p){var d=document.createElement("div");d.style.cssText="padding:8px 14px;font-size:12px;color:#6f6f6f";d.textContent="Memoria completa: todo se guarda, sin cortes.";p.appendChild(d);}
}catch(e){}})();

/* MUSA v104: llamada en vivo con DOBLE RUTA de escucha — 1) SpeechRecognition
   con vigilante de ~6 s; 2) si no produce texto, no existe o falla repetido,
   GRABACION automatica: MediaRecorder + Gemini multimodal (transcribe y
   responde en el mismo turno) con la llave que ya vive en la app. Si ambas
   rutas fallan, la pantalla lo dice claro y ofrece reintentar. La practica
   de ingles usa esta misma tuberia: el contexto de la sesion vive en el
   historial del chat y el audio se transcribe en el idioma que se hable. */
/* v109 (2026-11-18): iOS entra directo por GRABACION (el reconocimiento de voz de iOS en vistas web no es confiable); getUserMedia con limite de 10 s y mensajes distintos segun la causa (permiso denegado / vista dentro de otra app / sin respuesta); el analizador de silencio solo manda si su contexto de audio esta corriendo — si iOS lo deja suspendido decide el tamano de la grabacion, porque antes se descartaba audio bueno y la llamada «no escuchaba»; deteccion de vista dentro de otra app por falta de «Version/» en el agente de usuario, con excepcion de la app instalada (standalone). */
/* v110 (2026-11-18): el turno de audio de la llamada hereda la maquinaria del chat (que si funciona): reintentos con espera creciente ante 429/503 de Google honrando Retry-After, rotacion por 4 modelos, presupuesto de 90 s y, si al final no hay respuesta, la pantalla muestra la causa real que devolvio Google en vez del generico «No te escuche». */
(function(){try{
  var chat=$("sp4chat"),head=chat.querySelector(".sp4head");
  if(chat.parentNode!==document.body)document.body.appendChild(chat); /* v20: el chat cubre TODA la pantalla, como en Muse */
  var scr=document.createElement("div");scr.id="sp17call";
  scr.innerHTML="<img id='sp17img' src='avatar-gemini.png' alt=''><div id='sp17name'>Gemini</div><div id='sp17status'>Llamada en vivo</div><div id='sp17note'></div><button id='sp17mic' type='button'><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><rect x='9' y='2.5' width='6' height='11' rx='3'/><path d='M5.5 11a6.5 6.5 0 0 0 13 0'/><path d='M12 17.5V21'/></svg></button><button id='sp17mute' type='button'>Silenciar</button><button id='sp17end' type='button'><svg viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'><path d='M12 9c-1.6 0-3.22.25-4.75.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.17-.43.26-.68.26-.25 0-.5-.09-.68-.27L.29 13.08C.11 12.91 0 12.68 0 12.43 0 8.62 5.37 5.5 12 5.5s12 3.12 12 6.93c0 .25-.11.48-.29.65l-2.38 2.48c-.18.18-.43.27-.68.27-.25 0-.5-.09-.68-.26-.79-.74-1.68-1.36-2.66-1.85-.33-.16-.56-.51-.56-.9v-3.1C15.22 9.25 13.6 9 12 9z'/></svg></button>";
  chat.appendChild(scr);
  var active=false,rec=null,waiting=false,muted=false,speaking=false,errs=0,prevVoice=SP16VOICE,prevMode="gemini";
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  var route="sr",lfast=0,lstop=false,lwatch=null;
  var mr=null,mrStream=null,mrChunks=[],mrMime="",mrBusy=false,mrHeard=false,mrAnalyserOn=false,mrMaxT=null,mrSilT=null,mrCtx=null,mrAnalyser=null,mrSilenceSince=0;
  var mrPermNote=false; /* v105: el aviso previo de permiso de micrófono se muestra una sola vez por llamada */
  function st(t){$("sp17status").textContent=t;}
  function sp17InApp(){try{if(window.navigator&&window.navigator.standalone===true)return false;var ua=navigator.userAgent||"";if(/FBAN|FBAV|Instagram|Line\/|Twitter|Snapchat/i.test(ua))return true;if(/iPhone|iPad|iPod/.test(ua)&&/AppleWebKit/.test(ua)&&!/Version\//.test(ua))return true;return false;}catch(e){return false;}}
  function sp17IOS(){try{return /iPhone|iPad|iPod/.test(navigator.userAgent||"");}catch(e){return false;}}
  function sp17VoiceBlocked(){var hasSR=!!(window.SpeechRecognition||window.webkitSpeechRecognition);var hasRec=!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&typeof MediaRecorder!=="undefined");return !hasSR&&!hasRec;}
  function sp17SafariAviso(){lclear();$("sp17mic").className="";st("En esta vista el micrófono está bloqueado.");$("sp17note").textContent="Estás dentro de otra app: iOS bloquea el micrófono de la web en esta vista y la llamada no puede escucharte. Abre MUSA en Safari (Compartir o los tres puntos → «Abrir en Safari») y toca la llamada otra vez. Si en Safari Gemini te pide la llave, pégala una sola vez tocando el engranaje de Ajustes: queda guardada en Safari.";}
  function face(){var g=(mode==="gemini");$("sp17img").src=g?"avatar-gemini.png":"avatar-claude.png";$("sp17name").textContent=g?"Gemini":"Muse";}
  function english(){try{for(var i=gHist.length-1;i>=0&&i>=gHist.length-8;i--){var t=(gHist[i]&&gHist[i].text)||"";if(t.indexOf("entrenador de inglés")>=0||t.indexOf("entrenador de ingles")>=0)return true;}}catch(e){}return false;}
  function lclear(){if(lwatch){clearTimeout(lwatch);lwatch=null;}}
  function finalFail(){lclear();$("sp17mic").className="";if(sp17VoiceBlocked()||sp17InApp()){sp17SafariAviso();return;}st("No te escuché; revisa el micrófono. Toca el micrófono para intentarlo de nuevo.");}
  function stopTracks(){if(mrStream){try{mrStream.getTracks().forEach(function(tr){tr.stop();});}catch(e){}mrStream=null;}}
  function mrCleanup(){if(mrMaxT){clearTimeout(mrMaxT);mrMaxT=null;}if(mrSilT){clearInterval(mrSilT);mrSilT=null;}if(mrCtx){try{mrCtx.close();}catch(e){}mrCtx=null;}mrAnalyser=null;mrAnalyserOn=false;stopTracks();}
  function stopRec(){if(mrMaxT){clearTimeout(mrMaxT);mrMaxT=null;}if(mrSilT){clearInterval(mrSilT);mrSilT=null;}try{if(mr&&mr.state!=="inactive")mr.stop();}catch(e){mrCleanup();mrBusy=false;}}
  function switchToRec(){if(route==="rec")return;route="rec";lclear();lstop=true;try{if(rec)rec.abort();}catch(e){}if(active&&!waiting&&!muted)setTimeout(listen,150);}
  function listen(){if(!active||waiting||muted)return;if(!getKey()){lclear();$("sp17mic").className="";st("Sin tu llave de Gemini no puedo escucharte: pégala una vez en Ajustes (engranaje). Mientras tanto, escríbeme por texto en el chat.");return;}if(route==="rec"){listenRec();return;}if(!SR){route="rec";listenRec();return;}
    try{rec=new SR();rec.lang=english()?"en-US":"es-ES";rec.interimResults=false;var t0=Date.now(),got=false;
      rec.onresult=function(ev){got=true;lclear();var t=ev.results[0][0].transcript;errs=0;lfast=0;waiting=true;$("sp17mic").className="";st("Pensando…");$("sp4input").value=t;$("sp4send").click();};
      rec.onend=function(){lclear();if(lstop){lstop=false;return;}if(active&&!waiting&&!muted){if(!got&&(Date.now()-t0)<700){lfast++;if(lfast>=3){switchToRec();return;}}else lfast=0;setTimeout(listen,350);}};
      rec.onerror=function(ev){lclear();var er=ev&&ev.error;if(er==="not-allowed"||er==="service-not-allowed"||er==="audio-capture"){switchToRec();return;}errs++;if(active&&!waiting&&!muted){if(errs>=2){switchToRec();return;}if(er==="no-speech"){setTimeout(listen,400);return;}setTimeout(listen,600);}};
      $("sp17mic").className="live";st("Escuchando…");rec.start();
      lclear();lwatch=setTimeout(function(){if(active&&!waiting&&!muted&&!got){switchToRec();}},6000);
    }catch(e){switchToRec();}}
  function listenRec(){
    if(!active||waiting||muted||mrBusy||sp25Busy)return;
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||typeof MediaRecorder==="undefined"){finalFail();return;}
    if(!getKey()){st("Sin tu llave de Gemini no puedo escucharte: pégala una vez en Ajustes (engranaje). Mientras tanto, escríbeme por texto en el chat.");$("sp17mic").className="";return;}
    mrBusy=true;mrHeard=false;mrChunks=[];mrAnalyserOn=false;
    if(!mrPermNote){mrPermNote=true;$("sp17note").textContent="Para escucharte por grabación, el iPhone te pedirá permiso para el micrófono una sola vez: toca «Permitir». El micrófono solo se usa dentro de esta llamada.";st("Activando el micrófono…");}
    else st("Escuchando…");
    $("sp17mic").className="live";
    var gumDead=false;
    var gumP=navigator.mediaDevices.getUserMedia({audio:true});
    gumP.then(function(s){if(gumDead){try{s.getTracks().forEach(function(tr){tr.stop();});}catch(e){}}},function(){});
    var gumT=new Promise(function(_,rej){setTimeout(function(){rej(new Error("gum-timeout"));},10000);});
    Promise.race([gumP,gumT]).then(function(stream){
      if(!active||muted){mrBusy=false;try{stream.getTracks().forEach(function(tr){tr.stop();});}catch(e){}return;}
      mrStream=stream;
      var prefs=["audio/mp4","audio/webm;codecs=opus","audio/webm","audio/ogg;codecs=opus","audio/ogg"];
      mrMime="";for(var i=0;i<prefs.length;i++){try{if(MediaRecorder.isTypeSupported(prefs[i])){mrMime=prefs[i];break;}}catch(e){}}
      try{mr=mrMime?new MediaRecorder(stream,{mimeType:mrMime}):new MediaRecorder(stream);}catch(e){try{mr=new MediaRecorder(stream);}catch(e2){mrBusy=false;mrCleanup();finalFail();return;}}
      if(mr.mimeType)mrMime=mr.mimeType;
      mr.ondataavailable=function(ev){if(ev.data&&ev.data.size)mrChunks.push(ev.data);};
      mr.onstop=function(){
        var blob=new Blob(mrChunks,{type:mrMime||"audio/webm"});
        var heard=mrHeard||(!mrAnalyserOn&&blob.size>=4000);
        mrCleanup();
        if(!active||muted){mrBusy=false;return;}
        if(!heard||!blob.size||blob.size<1000){mrBusy=false;finalFail();return;}
        sendAudioTurn(blob);
      };
      try{mr.start(250);}catch(e){mrBusy=false;mrCleanup();finalFail();return;}
      try{
        var AC=window.AudioContext||window.webkitAudioContext;
        if(AC){mrCtx=new AC();if(mrCtx.state==="suspended")mrCtx.resume();
          var src=mrCtx.createMediaStreamSource(stream);mrAnalyser=mrCtx.createAnalyser();mrAnalyser.fftSize=512;src.connect(mrAnalyser);
          var buf=new Uint8Array(mrAnalyser.fftSize);mrSilenceSince=0;var tStart=Date.now();
          mrAnalyserOn=(mrCtx.state==="running");
          var mrCapSet=false;
          mrSilT=setInterval(function(){
            if(!mrAnalyser)return;
            if(mrCtx&&mrCtx.state!=="running"){try{mrCtx.resume();}catch(e){}if(!mrCapSet&&Date.now()-tStart>1500){mrCapSet=true;mrAnalyserOn=false;setTimeout(stopRec,10000);}return;}
            mrAnalyserOn=true;
            mrAnalyser.getByteTimeDomainData(buf);
            var sum=0;for(var j=0;j<buf.length;j++){var v=(buf[j]-128)/128;sum+=v*v;}
            var rms=Math.sqrt(sum/buf.length);
            if(rms>0.03){mrHeard=true;mrSilenceSince=0;}
            else if(mrHeard){mrSilenceSince+=200;if(mrSilenceSince>=1400)stopRec();}
            if(!mrHeard&&Date.now()-tStart>7000)stopRec();
          },200);
        }
      }catch(e){}
      mrMaxT=setTimeout(stopRec,20000);
    }).catch(function(err){mrBusy=false;gumDead=true;var nm=err&&err.name;if(nm==="NotAllowedError"||nm==="SecurityError"){if(sp17InApp()){sp17SafariAviso();return;}st("El iPhone no dio permiso al micrófono.");$("sp17note").textContent="Para permitirlo: toca «aA» en la barra de Safari, luego «Configuración del sitio web», Micrófono, Permitir, y toca el micrófono otra vez. Si estás dentro de otra app, abre MUSA en Safari.";$("sp17mic").className="";return;}if(err&&err.message==="gum-timeout"){if(sp17InApp()){sp17SafariAviso();return;}st("El micrófono no respondió.");$("sp17note").textContent="El micrófono tardó demasiado en activarse. Toca el micrófono para intentarlo de nuevo; si se repite, abre MUSA en Safari.";$("sp17mic").className="";return;}finalFail();});
  }
  function sendAudioTurn(blob){
    waiting=true;sp25Busy=true;$("sp17mic").className="";st("Entendiendo tu voz…");
    var key=getKey();
    var fr=new FileReader();
    fr.onerror=function(){mrBusy=false;sp25Busy=false;waiting=false;finalFail();};
    fr.onload=function(){
      var b64=String(fr.result||"").split(",")[1]||"";
      if(!b64){mrBusy=false;sp25Busy=false;waiting=false;finalFail();return;}
      var mime=(blob.type||mrMime||"audio/webm").split(";")[0];
      var ctx=gHist.filter(function(m){return m.who==="me"||m.who==="Gemini";}).slice(-6).map(function(m){return{role:m.who==="me"?"user":"model",parts:[{text:m.text}]};});
      var instr="Estás en una llamada de voz en vivo dentro de MUSA. El siguiente audio es el dueño hablando (español o inglés). Responde SOLO con un JSON válido con dos campos: \"transcript\": lo que dijo el dueño, palabra por palabra, en su idioma original; \"reply\": tu respuesta conversacional, breve y natural, lista para leerse en voz alta, sin markdown ni listas. Si el historial muestra una sesión de práctica de inglés en curso, sigue como su entrenador de inglés con el método de la casa (v108): reply en spanglish concordante — la frase en inglés que introduzcas es exactamente lo mismo que estás diciendo en español —, una sola frase por turno, corrección suave en una línea, y la frase solo se cierra si él la dice completa; ve contando en voz alta las frases que domina. Si el audio no se entiende, deja transcript vacío y en reply pide amablemente que lo repita.";
      ctx.push({role:"user",parts:[{text:instr},{inlineData:{mimeType:mime,data:b64}}]});
      var SYS="Eres Gemini, asistente del equipo de Crecer Digital. Tu jefa es Muse. Estás en una llamada de voz: respuestas breves, cálidas y directas.";
      var list=models.slice(0,4),idx=0,lastStA=0,lastErrA="";
      var delaysA=[1000,2000,4000],diA=0,mrA=0;
      function fail(stCode){
        mrBusy=false;sp25Busy=false;waiting=false;
        if(stCode===401||stCode===403){st("Google no aceptó la llave guardada. Pégala de nuevo en Ajustes y vuelve a intentarlo.");$("sp17mic").className="";return;}
        if(stCode===400){st("Google no aceptó la llave guardada: no es válida. Pega en Ajustes (engranaje) la llave de Google — empieza con «AIza» — y vuelve a intentarlo.");$("sp17mic").className="";return;}
        if(stCode===-9){st("Tardé demasiado en entenderte: la conexión está lenta. Toca el micrófono para intentarlo de nuevo.");$("sp17mic").className="";return;}
        if(lastStA===429||lastStA===503){st("Gemini está saturado ahora mismo (nivel gratis). Espera un minuto y toca el micrófono otra vez.");$("sp17mic").className="";if(lastErrA)$("sp17note").textContent="Google dijo: "+lastErrA;return;}
        st("Gemini no pudo responder esta vez. Toca el micrófono para intentarlo de nuevo.");$("sp17mic").className="";if(lastErrA)$("sp17note").textContent="Google dijo: "+lastErrA;
      }
      var t0A=Date.now();
      function attempt(){
        if(idx>=list.length){fail(0);return;}
        if(Date.now()-t0A>90000){fail(-9);return;}
        if(idx>0)st("Entendiendo tu voz… (otro intento)");
        var m=list[idx];
        sp24Fetch("https://generativelanguage.googleapis.com/v1beta/models/"+m+":generateContent",{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},body:JSON.stringify({systemInstruction:{parts:[{text:SYS}]},contents:ctx,generationConfig:{responseMimeType:"application/json"}})},30000).then(function(r){
          if(!r.ok){
            lastStA=r.status;
            if(r.status===401||r.status===403){fail(r.status);return;}
            return r.text().then(function(et){
              var em="";try{var ej=JSON.parse(et);em=(ej&&ej.error&&ej.error.message)||"";}catch(e){}
              if(em)lastErrA=em.slice(0,140);
              if(r.status===400){if(/api.?key/i.test(em)||/API_KEY_INVALID/.test(em)){fail(400);return;}idx++;mrA=0;attempt();return;}
              if((r.status===429||r.status===503)&&mrA<3&&diA<delaysA.length&&(Date.now()-t0A)<75000){
                mrA++;var ra=parseInt(r.headers.get("Retry-After")||"0",10);var wms=ra>0?Math.min(ra*1000,15000):Math.round(delaysA[diA]*(1+Math.random()*0.4));diA++;
                st("Gemini saturado ("+m+"). Reintentando…");
                setTimeout(attempt,wms);return;
              }
              idx++;mrA=0;attempt();
            });
          }
          return r.json();
        }).then(function(d){
          if(!d)return;
          var txt="";try{var ps=(d.candidates&&d.candidates[0]&&d.candidates[0].content&&d.candidates[0].content.parts)||[];for(var i=0;i<ps.length;i++)txt+=ps[i].text||"";}catch(e){}
          txt=String(txt||"").replace(/^\s+|\s+$/g,"");
          var transcript="",reply="";
          if(txt){try{var o=JSON.parse(txt);transcript=String(o.transcript||"");reply=String(o.reply||"");}catch(e){reply=txt;}}
          if(!reply&&transcript)reply="Te escuché: "+transcript;
          if(!reply){mrBusy=false;sp25Busy=false;waiting=false;finalFail();return;}
          if(!transcript)transcript="(audio)";
          mrBusy=false;
          gHist.push({who:"me",text:transcript});save(LS_G,gHist);bubble("ai","me",transcript);
          gHist.push({who:"Gemini",text:reply});save(LS_G,gHist);bubble("ai","Gemini",reply);
          sp25Busy=false;
          st("Hablando…");
          sp16Speak(reply);
        }).catch(function(){if(mrA<3&&(Date.now()-t0A)<75000){mrA++;setTimeout(attempt,1500);}else{idx++;mrA=0;attempt();}});
      }
      attempt();
    };
    fr.readAsDataURL(blob);
  }
  window.__sp17after=function(){if(!active)return;waiting=false;setTimeout(listen,300);};
  window.__sp17speak=function(on){speaking=on;try{if(active){scr.className="open"+(on?" speaking":"");if(on)st("Hablando…");}}catch(e){}};
  setInterval(function(){if(active&&waiting&&!muted&&!speaking&&!sp25Busy){waiting=false;setTimeout(listen,400);}},2500);
  function start(){active=true;muted=false;speaking=false;errs=0;lfast=0;route=sp17IOS()?"rec":"sr";mrBusy=false;mrPermNote=false;prevVoice=SP16VOICE;prevMode=mode;SP16VOICE=true;if(mode!=="gemini"){mode="gemini";render();}face();$("sp17note").textContent=(prevMode!=="gemini")?"La conversación en vivo es con Gemini, el miembro en vivo de la casa; Muse y ChatGPT trabajan por el puente de textos. Todo lo hablado queda en el historial del chat.":"Todo lo hablado queda en el historial del chat.";scr.className="open";st("Llamada en vivo");if(sp17VoiceBlocked()){sp17SafariAviso();return;}listen();}
  function end(){lclear();stopRec();mrCleanup();mrBusy=false;active=false;waiting=false;muted=false;speaking=false;route="sr";SP16VOICE=prevVoice;try{if(rec)rec.stop();}catch(e){}try{speechSynthesis.cancel();}catch(e){}scr.className="";$("sp17mic").className="";var mb=$("sp17mute");if(mb)mb.textContent="Silenciar";}
  var pb=document.createElement("button");pb.type="button";pb.className="sp16gear";pb.innerHTML="<svg viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'><path d='M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z'/></svg>";pb.setAttribute("aria-label","Llamada en vivo");
  pb.addEventListener("click",start);head.appendChild(pb);
  $("sp17mic").addEventListener("click",function(){if(!active)return;if(muted){muted=false;$("sp17mute").textContent="Silenciar";}if(mrBusy){stopRec();return;}if(!waiting)listen();});
  $("sp17mute").addEventListener("click",function(){if(!active)return;muted=!muted;if(muted){stopRec();try{if(rec)rec.stop();}catch(e){}try{speechSynthesis.cancel();}catch(e){}$("sp17mic").className="";st("Micrófono en silencio. Toca el micrófono para seguir hablando.");$("sp17mute").textContent="Activar micrófono";}else{$("sp17mute").textContent="Silenciar";if(!waiting)listen();}});
  $("sp17end").addEventListener("click",end);
}catch(e){}})();

/* MUSA v16: hablar igual — dictas, se envía solo, y la respuesta se escucha */
var SP16VOICE=false;try{SP16VOICE=localStorage.getItem("musa_voz_auto")==="1";}catch(e){}
function sp16Speak(t){try{if(!SP16VOICE||!window.speechSynthesis)return;speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(String(t).slice(0,600));u.lang="es-ES";var vs=speechSynthesis.getVoices().filter(function(v){return v.lang&&v.lang.indexOf("es")===0;});if(vs.length)u.voice=vs[0];u.onstart=function(){if(window.__sp17speak)window.__sp17speak(true);};u.onend=function(){if(window.__sp17speak)window.__sp17speak(false);if(window.__sp17after)window.__sp17after();};u.onerror=function(){if(window.__sp17speak)window.__sp17speak(false);if(window.__sp17after)window.__sp17after();};speechSynthesis.speak(u);}catch(e){}}
(function(){try{
  var head=$("sp4chat").querySelector(".sp4head");
  var vb=document.createElement("button");vb.type="button";vb.className="sp16gear";
  var SPKON="<svg viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'><path d='M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.8-1-3.3-2.5-4v8c1.5-.7 2.5-2.2 2.5-4zM14 3.2v2.1c2.9.9 5 3.6 5 6.7s-2.1 5.8-5 6.7v2.1c3.9-1 7-4.6 7-8.8s-3.1-7.8-7-8.8z'/></svg>",SPKOFF="<svg viewBox='0 0 24 24' aria-hidden='true'><path fill='currentColor' d='M3 9v6h4l5 5V4L7 9H3z'/><path d='M16 9.5l5 5.5M21 9.5l-5 5.5' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' fill='none'/></svg>";function paint(){vb.innerHTML=SP16VOICE?SPKON:SPKOFF;vb.style.opacity=SP16VOICE?"1":"0.55";}
  vb.setAttribute("aria-label","Voz automática");
  vb.addEventListener("click",function(){SP16VOICE=!SP16VOICE;try{localStorage.setItem("musa_voz_auto",SP16VOICE?"1":"0");}catch(e){}paint();if(SP16VOICE)sp16Speak("Voz activada.");else try{speechSynthesis.cancel();}catch(e){}});
  head.appendChild(vb);paint();
}catch(e){}})();

/* MUSA v16: hablar con quien tocas — los tres retratos eligen el modo */
(function(){try{
  var chat=$("sp4chat"),head=chat.querySelector(".sp4head");
  var b=head.querySelector("b"),sm=head.querySelector("small");
  if(b)b.style.display="none"; if(sm)sm.style.display="none";
  var trio=document.createElement("div");trio.className="sp16trio";
  var defs=[["Muse","avatar-claude.png","team"],["ChatGPT","avatar-chatgpt.png","team"],["Gemini","avatar-gemini.png","gemini"],["Pollinations","avatar-pollinations.png","pollinations"]];
  function sync(){Array.prototype.forEach.call(trio.children,function(btn,i){btn.className=(defs[i][2]===mode)?"on":"";});}
  defs.forEach(function(d){
    var btn=document.createElement("button");btn.type="button";
    btn.innerHTML='<img src="'+d[1]+'" alt="'+d[0]+'"><span>'+d[0]+'</span>';
    btn.addEventListener("click",function(){mode=d[2];render();sync();});
    trio.appendChild(btn);
  });
  head.appendChild(trio);sync();
  var mG=$("sp4mGem"),mT=$("sp4mTeam");
  if(mG)mG.addEventListener("click",function(){setTimeout(sync,30);});
  if(mT)mT.addEventListener("click",function(){setTimeout(sync,30);});
  var mP=$("sp4mPol");
  if(mP)mP.addEventListener("click",function(){setTimeout(sync,30);});
}catch(e){}})();

/* MUSA v16: panel de ajustes del chat (llave + modo) tras el engranaje */
(function(){try{
  var chat=$("sp4chat"),head=chat.querySelector(".sp4head");
  var panel=document.createElement("div");panel.id="sp16panel";
  var kc=$("sp4keycard"),md=chat.querySelector(".sp4modes");
  head.parentNode.insertBefore(panel,head.nextSibling);
  if(md)panel.appendChild(md);
  if(kc)panel.appendChild(kc);
  var ch=$("sp5chips");if(ch)panel.appendChild(ch);
  var gear=document.createElement("button");gear.type="button";gear.className="sp16gear";gear.innerHTML="<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' aria-hidden='true'><path d='M3 6h9M18 6h3M3 12h3M12 12h9M3 18h11M20 18h1'/><circle cx='15' cy='6' r='2.2'/><circle cx='9' cy='12' r='2.2'/><circle cx='17' cy='18' r='2.2'/></svg>";gear.setAttribute("aria-label","Ajustes del chat");
  gear.addEventListener("click",function(){panel.className=(panel.className==="open")?"":"open";});
  head.appendChild(gear);
  /* v17: el panel nunca se abre solo */
/* MUSA v16: trío selector en la cabecera (tocar un retrato = hablar con esa IA) */
(function(){try{
  var head=document.querySelector("#sp4chat .sp4head");if(!head)return;
  var trio=document.createElement("div");trio.className="sp16trio";
  function syncTrio(){Array.prototype.forEach.call(trio.children,function(b){b.className=(b.getAttribute("data-m")===mode)?"on":"";});}
  function tbtn(img,name,md){var b=document.createElement("button");b.type="button";b.setAttribute("data-m",md);b.innerHTML='<img src="'+img+'" alt=""><span>'+name+'</span>';b.addEventListener("click",function(){mode=md;render();syncTrio();});return b;}
  trio.appendChild(tbtn("avatar-claude.png","Muse","team"));
  trio.appendChild(tbtn("avatar-chatgpt.png","ChatGPT","team"));
  trio.appendChild(tbtn("avatar-gemini.png","Gemini","gemini"));
  trio.appendChild(tbtn("avatar-pollinations.png","Pollinations","pollinations"));
  head.appendChild(trio);syncTrio();
}catch(e){}})();

}catch(e){}})();

$("sp7menu").addEventListener("click",function(){var d=$("sp7drawer");d.className=(d.className==="open")?"":"open";});
$("sp7share").addEventListener("click",function(){var u="https://crecerdigital.github.io/spirit/";if(navigator.share){navigator.share({title:"MUSA",url:u}).catch(function(){});}else{copyText(u);alert("Enlace de MUSA copiado: "+u);}});
Array.prototype.forEach.call(document.querySelectorAll("#sp7drawer button"),function(b){b.addEventListener("click",function(){var go=b.getAttribute("data-go");$("sp7drawer").className="";if(go==="chat")return;$("sp4chat").className="";setTimeout(function(){var s=document.getElementById(go);if(s)s.scrollIntoView({behavior:"smooth"});},60);});});
$("sp6mic").addEventListener("click",function(){var SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){alert("En esta vista, usa el micrófono de tu teclado: toca el campo de texto y luego el micrófono del teclado.");return;}try{var r=new SR();r.lang="es-US";r.interimResults=false;r.onresult=function(ev){var t=ev.results[0][0].transcript;$("sp4input").value=($("sp4input").value+" "+t).trim();$("sp4send").click();};r.start();}catch(e){alert("No pude abrir el micrófono aquí; usa el micrófono del teclado.");}});
  /* v100: indicador discreto de estado de red (auditoria Gemini) */
  (function(){try{
    var net=$("sp100net"),tx=$("sp100netTx");if(!net)return;
    function paintNet(){var on=navigator.onLine!==false;net.className=on?"":"off";if(tx)tx.textContent=on?"En línea":"Sin conexión";}
    window.addEventListener("online",paintNet);window.addEventListener("offline",paintNet);paintNet();
  }catch(e){}})();

  /* MUSA.TaskEngine v1 (v100, entrega ChatGPT adaptada a v73): cola de tareas en
     segundo plano persistente en IndexedDB "musa_tasks_v1", recuperacion de
     tareas interrumpidas al abrir, reintentos con backoff, concurrencia 1,
     estado visible en la UI y notificaciones al terminar.
     LIMITE HONESTO: una PWA no ejecuta con el navegador cerrado; la cola se
     reanuda al volver a abrir MUSA. */
  window.MUSA=window.MUSA||{};
  (function(){
    var DBN="musa_tasks_v1",STORE="tasks";
    var teTasks=[],teRunning=false,teDbP=null;
    function teDb(){if(teDbP)return teDbP;teDbP=new Promise(function(res){try{var r=indexedDB.open(DBN,1);r.onupgradeneeded=function(){try{r.result.createObjectStore(STORE,{keyPath:"id"});}catch(e){}};r.onsuccess=function(){res(r.result);};r.onerror=function(){res(null);};}catch(e){res(null);}});return teDbP;}
    function tePut(t){return teDb().then(function(d){return new Promise(function(res){if(!d){res(false);return;}try{var rq=d.transaction(STORE,"readwrite").objectStore(STORE).put(t);rq.onsuccess=function(){res(true);};rq.onerror=function(){res(false);};}catch(e){res(false);}});});}
    function teDel(id){return teDb().then(function(d){return new Promise(function(res){if(!d){res(false);return;}try{var rq=d.transaction(STORE,"readwrite").objectStore(STORE).delete(id);rq.onsuccess=function(){res(true);};rq.onerror=function(){res(false);};}catch(e){res(false);}});});}
    function teAll(){return teDb().then(function(d){return new Promise(function(res){if(!d){res([]);return;}try{var rq=d.transaction(STORE).objectStore(STORE).getAll();rq.onsuccess=function(){res(rq.result||[]);};rq.onerror=function(){res([]);};}catch(e){res([]);}});});}
    function teSleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
    function teEsc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
    function teStTxt(s){return {pending:"En cola",running:"Ejecutando…",done:"Hecha ✓",failed:"Falló",cancelled:"Cancelada"}[s]||s;}
    function teNotify(title,body){try{if(window.Notification&&Notification.permission==="granted"){new Notification(title,{body:body});}}catch(e){}}
    function teAskPerm(){try{if(window.Notification&&Notification.permission==="default"){var p=Notification.requestPermission();if(p&&p.catch)p.catch(function(){});}}catch(e){}}
    function teRender(){
      var btn=$("sp100tasksBtn"),listEl=$("sp100taskList");
      if(btn){var p=teTasks.filter(function(t){return t.status==="pending"||t.status==="running";}).length;btn.textContent="Tareas en segundo plano"+(p?" ("+p+")":"");}
      if(!listEl)return;
      listEl.innerHTML="";
      if(!teTasks.length){listEl.innerHTML="<p class=\"sp100note\">Sin tareas todavía. Encola una pregunta y Gemini la responde aunque cambies de pantalla dentro de MUSA.</p>";return;}
      teTasks.slice().sort(function(a,b){return b.createdAt-a.createdAt;}).forEach(function(t){
        var d=document.createElement("div");d.className="sp100t";
        var top=document.createElement("div");top.innerHTML="<b>"+teEsc(teStTxt(t.status))+"</b> · "+(t.type==="note"?"Nota":"Pregunta a Gemini");
        var body=document.createElement("div");body.textContent=String(t.text||"").slice(0,160);
        d.appendChild(top);d.appendChild(body);
        if(t.result){var rs=document.createElement("div");rs.className="sp100note";rs.textContent="Resultado: "+String(t.result).slice(0,160);d.appendChild(rs);}
        var meta=document.createElement("div");meta.className="sp100note";meta.textContent="Intentos: "+(t.attempts||0)+(t.error?" · "+t.error:"");
        d.appendChild(meta);
        var acts=document.createElement("div");acts.className="sp100acts";
        function ab(label,fn){var b=document.createElement("button");b.type="button";b.textContent=label;b.addEventListener("click",fn);acts.appendChild(b);}
        if(t.status==="failed"||t.status==="cancelled")ab("Reintentar",function(){t.status="pending";t.error="";tePut(t).then(function(){teRender();tePump();});});
        if(t.status==="pending")ab("Cancelar",function(){t.status="cancelled";tePut(t).then(teRender);});
        ab("Borrar",function(){teTasks=teTasks.filter(function(x){return x.id!==t.id;});teDel(t.id).then(teRender);});
        d.appendChild(acts);listEl.appendChild(d);
      });
    }
    async function teExec(t){
      if(t.type==="note")return "Nota guardada en la cola.";
      if(t.type!=="gemini")throw new Error("Tipo de tarea no soportado: "+t.type);
      if(!getKey())throw new Error("Falta la llave de Gemini en este iPhone.");
      var guard=0;while(sp25Busy&&guard<240){await teSleep(500);guard++;}
      if(sp25Busy)throw new Error("Gemini estaba ocupado demasiado tiempo.");
      gHist.push({who:"me",text:t.text});save(LS_G,gHist);bubble("ai","me",t.text);
      await askGemini(t.text);
      var g2=0;while(sp25Busy&&g2<240){await teSleep(500);g2++;}
      var last=gHist[gHist.length-1];
      if(last&&last.who==="Gemini")return last.text;
      throw new Error("Gemini no dejó respuesta en el historial.");
    }
    async function tePump(){
      if(teRunning)return;
      var t=teTasks.filter(function(x){return x.status==="pending";}).sort(function(a,b){return a.createdAt-b.createdAt;})[0];
      if(!t)return;
      teRunning=true;t.status="running";t.attempts=(t.attempts||0)+1;await tePut(t);teRender();
      try{
        var out=await teExec(t);
        t.status="done";t.result=String(out||"").slice(0,500);t.error="";await tePut(t);teRender();
        teNotify("MUSA: tarea terminada",String(t.text||"").slice(0,80));
      }catch(e){
        t.error=String((e&&e.message)||e).slice(0,160);
        if((t.attempts||0)<3){
          await tePut(t);teRender();
          await teSleep(Math.round(Math.min(8000,2000*Math.pow(2,(t.attempts||1)-1))*(1+Math.random()*0.3)));
          t.status="pending";await tePut(t);teRender();teRunning=false;tePump();return;
        }
        t.status="failed";await tePut(t);teRender();
        teNotify("MUSA: una tarea falló",t.error);
      }
      teRunning=false;tePump();
    }
    function teEnqueue(type,text){
      var t={id:"t"+Date.now().toString(36)+Math.random().toString(36).slice(2,7),type:type||"gemini",text:String(text||""),status:"pending",attempts:0,error:"",result:"",createdAt:Date.now()};
      teTasks.push(t);teAskPerm();tePut(t).then(function(){teRender();tePump();});
      return t;
    }
    window.MUSA.TaskEngine={
      enqueue:teEnqueue,
      list:function(){return teTasks.slice();},
      cancel:function(id){for(var i=0;i<teTasks.length;i++){if(teTasks[i].id===id&&teTasks[i].status==="pending"){teTasks[i].status="cancelled";tePut(teTasks[i]).then(teRender);return true;}}return false;},
      retry:function(id){for(var i=0;i<teTasks.length;i++){if(teTasks[i].id===id&&(teTasks[i].status==="failed"||teTasks[i].status==="cancelled")){teTasks[i].status="pending";teTasks[i].error="";tePut(teTasks[i]).then(function(){teRender();tePump();});return true;}}return false;},
      clearDone:function(){var done=teTasks.filter(function(t){return t.status==="done"||t.status==="cancelled";});teTasks=teTasks.filter(function(t){return t.status!=="done"&&t.status!=="cancelled";});done.forEach(function(t){teDel(t.id);});teRender();},
      pump:tePump,render:teRender
    };
    try{
      var btn2=$("sp100tasksBtn"),panel=$("sp100tasks");
      if(btn2&&panel)btn2.addEventListener("click",function(){panel.className=(panel.className==="open")?"":"open";teRender();});
      var add=$("sp100taskAdd"),inp=$("sp100taskIn");
      if(add&&inp){
        add.addEventListener("click",function(){var v=inp.value.trim();if(!v)return;inp.value="";teEnqueue("gemini",v);if(panel)panel.className="open";});
        inp.addEventListener("keydown",function(ev){if(ev.key==="Enter"){ev.preventDefault();add.click();}});
      }
      var dr=$("sp7drawer");
      if(dr){var db2=document.createElement("button");db2.type="button";db2.textContent="Tareas en segundo plano";db2.addEventListener("click",function(){var d=$("sp7drawer");if(d)d.className="";var c=$("sp4chat");if(c)c.className="open";if(panel)panel.className="open";teRender();});dr.appendChild(db2);}
    }catch(e){}
    teAll().then(function(rows){
      teTasks=(rows||[]).filter(function(t){return t&&t.id;});
      /* Recuperacion: lo que quedo "running" al cerrar la app vuelve a la cola. */
      teTasks.forEach(function(t){if(t.status==="running"){t.status="pending";tePut(t);}});
      teRender();tePump();
    });
  })();
})();

/* MUSA v22: barrido — llamada y voz fuera de la cabecera, tras el engranaje */
(function(){
  function sweep(){
    try{
      var head=document.querySelector("#sp4chat .sp4head"),panel=document.getElementById("sp16panel");
      if(!head||!panel)return;
      Array.prototype.slice.call(head.querySelectorAll("button")).forEach(function(b){
        var al=b.getAttribute("aria-label")||"",tx=b.textContent||"";
        if(al==="Voz autom\u00e1tica"||tx.indexOf("\uD83D\uDD0A")>=0){panel.appendChild(b);} /* v100.2: el boton de llamada se queda VISIBLE en la cabecera (paridad con la app de Muse); solo la voz automatica vive tras el engranaje */
      });
    }catch(e){}
  }
  sweep();
  [300,1000,2500,5000].forEach(function(t){setTimeout(sweep,t);});
  try{
    var head=document.querySelector("#sp4chat .sp4head");
    if(head&&window.MutationObserver){var mo=new MutationObserver(sweep);mo.observe(head,{childList:true});setTimeout(function(){mo.disconnect();},10000);}
  }catch(e){}
})();
