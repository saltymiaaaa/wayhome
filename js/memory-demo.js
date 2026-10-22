/* Presenter-directed simulation; steps never grant library permissions. */
(function(){
 const WH=window.WH,D=WH.MemoryData,S=WH.S,T=WH.t;
 const P=WH.MemoryDemo={active:false,step:0,grown:false};
 P.stop=function(){P.active=false;document.body.classList.remove('memory-presenting');P.render();};
 P.reset=function(){WH.Sim.reset();P.step=0;P.grown=false;P.active=true;document.body.classList.add('memory-presenting');WH.enterStage('both');WH.Memory.open();P.render();};
 P.start=function(){if(S.sosActive)return;P.reset();};
 P.market=()=>D.state.places.find(p=>p.id==='l3'&&p.memoryApproved&&p.navigationApproved&&D.hasPosition(p));
 P.route=function(){const market=P.market();if(!market){WH.toast(T('mgDemoMissing'),'warn');return false;}const G=WH.Guide;
   // Find a real grid route containing the approved landmark, never inject a photo into a route.
   let candidate=null;
   for(let i=1;i<=11;i++)for(let j=1;j<=11;j++){const p=WH.node(i,j),r=G.buildRoute(p);if(G.buildSteps(r).some(st=>st.lm?.id===market.id)&&(!candidate||r.total<candidate.total))candidate={p,total:r.total};}
   if(!candidate){WH.toast(T('mgDemoMissing'),'warn');return false;}
   WH.closePrompt(true);WH.Sim.abortCall();WH.famLayer(null);S.gpsLost=false;WH.MemorySafety.lastKnown=null;
   WH.setAvatar(candidate.p.x,candidate.p.z,0,false);G.start();G.paused=true;return true;
 };
 P.landmark=function(){if(!P.route())return false;const G=WH.Guide;G.idx=G.steps.findIndex(st=>st.lm?.id===P.market().id);G.s=G.cur().s;const p=G.posAt(G.route,G.s);WH.setAvatar(p.x,p.z,undefined,false);G.paused=false;G.enter(G.cur());return true;};
 P.go=function(step){if(S.sosActive)return;step=Math.max(0,Math.min(8,step));WH.MemorySafety.clear();WH.Sim.abortCall();WH.famLayer(null);WH.closePrompt(true);
   if(step<4){WH.Sim.reset();WH.enterStage('both');}
   P.step=step;
   if(step===0)WH.Memory.open();
   if(step===1){const market=P.market();if(market){WH.Memory.open();WH.Memory.activity('places',market.id);}else WH.toast(T('mgDemoMissing'),'warn');}
   if(step===2){WH.Memory.open();const market=P.market();if(market&&!P.grown){WH.Memory.activity('places',market.id);WH.Memory.finish();P.grown=true;}WH.Memory.garden();}
   if(step===3){WH.Memory.open();WH.MemorySafety.check();}
   if(step===4){if(P.route()){WH.Guide.paused=true;WH.MemorySafety.offer();}}
   if(step===5)P.landmark();
   if(step===6&&P.landmark()){WH.Guide.answerNo();WH.closePrompt(true);WH.Guide.answerNo();}
   if(step===7&&P.route()){S.gpsLost=true;WH.MemorySafety.low();}
   if(step===8){WH.Memory.pause();if(WH.Guide.active)WH.Guide.stop(true);WH.enterStage('family');WH.MemorySafety.handover();}
   P.render();
 };
 P.render=function(){const root=document.querySelector('#memoryPresenter');if(!root)return;root.hidden=!P.active;if(!P.active)return;root.innerHTML=`<b>${T('mgDemo')} · ${P.step+1}/9</b><p aria-live="polite">${T('mgDemo'+(P.step+1))}</p><nav><button class="mg-button" data-demo="back" ${P.step===0?'disabled':''}>${T('mgBack')}</button><button class="mg-button" data-demo="next" ${P.step===8?'disabled':''}>${T('mgNext')}</button><button class="mg-button" data-demo="reset">${T('mgReset')}</button><button class="mg-button" data-demo="exit">${T('mgExit')}</button></nav>`;};
 P.init=function(){const root=document.createElement('aside');root.id='memoryPresenter';root.hidden=true;root.setAttribute('aria-label',T('mgDemo'));document.body.append(root);root.onclick=e=>{const a=e.target.closest('[data-demo]')?.dataset.demo;if(a==='next')P.go(P.step+1);if(a==='back')P.go(P.step-1);if(a==='reset')P.reset();if(a==='exit')P.stop();};};
})();
