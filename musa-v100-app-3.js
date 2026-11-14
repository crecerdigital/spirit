
/* MUSA · vigilante de versión: ninguna copia instalada se queda pegada en una versión vieja. */
(function(){try{
  var mine="v100";
  if(sessionStorage.getItem("spirit_watchdog_"+mine))return;
  fetch("index.html?rev="+Date.now(),{cache:"no-store"}).then(function(r){return r.text();}).then(function(t){
    var m=t.match(/<title>MUSA (v[0-9]+)<\/title>/);
    if(m&&m[1]!==mine){
      sessionStorage.setItem("spirit_watchdog_"+mine,"1");
      var jobs=[];
      if(navigator.serviceWorker&&navigator.serviceWorker.getRegistrations){jobs.push(navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(x){x.unregister();});}));}
      if(window.caches&&caches.keys){jobs.push(caches.keys().then(function(ks){ks.forEach(function(k){caches.delete(k);});}));}
      Promise.all(jobs).then(function(){setTimeout(function(){location.replace("index.html?rev="+Date.now());},300);});
    }
  }).catch(function(){});
}catch(e){}})();
