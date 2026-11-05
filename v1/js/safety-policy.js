/* One policy engine for every safety incident. It owns timing, reasons and allowed stages. */
(function(){
 const WH=window.WH,S=WH.S,T=WH.t,E=WH.esc;
 const P=WH.SafetyPolicy={incident:null,elapsed:0,index:0,timer:null};
 const DEFINITIONS={
  geofence:{reason:'outside',allowEmergency:true},
  'unanswered-checkin':{reason:'unanswered',allowEmergency:false},
  stopped:{reason:'stopped',allowEmergency:false},
  'route-divergence':{reason:'divergence',allowEmergency:false},
  'immediate-emergency':{reason:'emergency',allowEmergency:true}
 };
 P.definition=kind=>DEFINITIONS[kind]||{reason:kind,allowEmergency:false};
 P.reasonKey=reason=>({outside:'mgReasonOutside',stopped:'mgReasonStopped',help:'mgReasonHelp',caregiver:'mgReasonCaregiver',unanswered:'mgReasonUnanswered',divergence:'mgReasonDivergence',gps:'mgReasonGps',removed:'mgReasonRemoved'}[reason]||'mgReasonCaregiver');
 P.reasonText=reason=>P.incident?.reason===reason&&P.incident?.detail?.label||T(P.reasonKey(reason));
 P.stages=function(kind){const def=P.definition(kind);return S.esc.filter(r=>def.allowEmergency||!r.how.includes('emergency')).map(r=>({...r}));};
 P.begin=function(kind,detail){const def=P.definition(kind);if(P.incident?.kind===kind)return P.incident;if(P.incident?.status==='active'&&P.incident.allowEmergency&&!def.allowEmergency){WH.MemoryData?.event('safety-observation',kind+':'+(detail?.reason||def.reason));return P.incident;}clearTimeout(P.timer);P.incident={id:'safety-'+Date.now(),kind,reason:detail?.reason||def.reason,detail:detail||{},allowEmergency:def.allowEmergency,startedAt:new Date().toISOString(),status:'active',stage:0};P.elapsed=0;P.index=0;WH.MemoryData?.event('safety-start',kind+':'+P.incident.reason);P.visible('blue');return P.incident;};
 P.emergency=function(reason){const key=T('r_'+reason),label=key==='r_'+reason?T('mgReasonEmergency'):key;clearTimeout(P.timer);P.incident={id:'safety-'+Date.now(),kind:'immediate-emergency',reason,detail:{label},allowEmergency:true,startedAt:new Date().toISOString(),status:'emergency',stage:1};WH.MemoryData?.event('safety-emergency',reason);WH.famBanner({ic:'siren',tone:'red',title:T('mgPolicyEmergency',{reason:label}),body:T('mgSimulation')});P.render();};
 P.resolve=function(reason){if(!P.incident)return;clearTimeout(P.timer);P.timer=null;WH.MemoryData?.event('safety-resolved',P.incident.kind+':'+reason);P.incident.status='resolved';P.incident=null;P.elapsed=0;P.index=0;P.render();};
 P.schedule=function(kind,detail){P.begin(kind,detail);const stages=P.stages(kind);const run=()=>{if(!P.incident||P.incident.kind!==kind||S.sosActive||P.index>=stages.length)return;P.apply(stages[P.index],P.index);P.index++;P.render();if(P.index<stages.length){const wait=Math.max(1,stages[P.index].min-stages[P.index-1].min)*1000/2.6;P.timer=setTimeout(run,wait);}};if(stages.length)P.timer=setTimeout(run,Math.max(1,stages[0].min)*1000/2.6);return P.timer;};
 P.tick=function(dt){const x=P.incident;if(!x||x.status!=='active'||S.sosActive||S.guiding)return;P.elapsed+=dt*2.6;const stages=P.stages(x.kind);while(P.index<stages.length&&P.elapsed>=stages[P.index].min){P.apply(stages[P.index],P.index);P.index++;if(S.sosActive)break;}P.render();};
 P.apply=function(rule,index){const x=P.incident;if(!x)return;x.stage=index+1;const methods=rule.how||[];const emergency=methods.includes('emergency');const contact=rule.who>=0?WH.contact(rule.who):null;const detail=`${P.reasonText(x.reason)} · ${methods.join(' / ')}`;WH.MemoryData?.event('safety-stage',x.kind+':'+detail);
  if(emergency){WH.sysLog(T('mgPolicyEmergency',{reason:P.reasonText(x.reason)}),'bad');WH.Sim.sos(x.kind==='geofence'?'zone':'policy');return;}
  WH.famBanner({ic:methods.includes('call')?'phone':'bell',tone:index?'red':'amber',title:T('mgPolicyNotice',{reason:P.reasonText(x.reason)}),body:(contact?E(contact.name)+' · ':'')+methods.join(' / ')});
  WH.feed(T('mgPolicyFeed',{reason:P.reasonText(x.reason),method:methods.join(' / ')}),index?'red':'amber',methods.includes('call')?'phone':'bell');WH.sysLog(detail,index?'bad':'warn');
 };
 P.visible=function(tone){if(!P.incident)return;WH.famBanner({ic:'shield',tone:tone||'blue',title:T('mgPolicyReason'),body:P.reasonText(P.incident.reason),ms:5000});};
 P.render=function(){const box=document.querySelector('#pLadder');if(!box)return;if(!P.incident){box.innerHTML=`<div class="lad idle">${ic('shield',20)}<span>${T('ladIdle',{r:WH.effRadiusKm().toFixed(2)})}</span></div>`;return;}const x=P.incident,stages=P.stages(x.kind);box.innerHTML=`<div class="lad ${S.guiding?'guiding':''}"><div class="lad-h"><b>${ic('ladder',16)} ${T('ladTitle')}</b><span>${E(P.reasonText(x.reason))}</span></div><div class="safety-reason">${T('mgPolicyWhy')}: ${E(P.reasonText(x.reason))}</div><div class="lad-steps"><div class="ls done"><i>${ic('check',14)}</i><b>${T('mgPolicyObserved')}</b><span>${Math.floor(P.elapsed)} min</span></div>${stages.map((r,i)=>`<div class="ls ${P.index>i?'done':P.index===i?'next':''}"><i>${P.index>i?ic('check',14):i+2}</i><b>${E(r.how.join(' / '))}</b><span>+${r.min} min</span></div>`).join('')}</div></div>`;};
 P.reset=function(){clearTimeout(P.timer);P.timer=null;P.incident=null;P.elapsed=0;P.index=0;P.render();};
})();
