
/* MUSA v20: un solo trio de retratos en la cabecera del chat */
(function(){function one(){try{var head=document.querySelector("#sp4chat .sp4head");if(!head)return;var t=head.querySelectorAll(".sp16trio");for(var i=1;i<t.length;i++){t[i].remove();}var o=head.querySelectorAll(".sp6trio");for(var j=0;j<o.length;j++){o[j].remove();}}catch(e){}}
one();setTimeout(one,700);setTimeout(one,2000);setTimeout(one,4500);})();
