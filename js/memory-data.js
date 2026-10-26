/* Local-only library. Media blobs stay in IndexedDB; JSON metadata in localStorage. */
(function () {
  const WH = window.WH, KEY = 'wayhome.memory.v1';
  const clone = x => JSON.parse(JSON.stringify(x));
  const seedPlaces=clone(WH.S.landmarks);
  const D = WH.MemoryData = { media: new Map(), urls: new Map(), persistent: true };
  D.defaults = () => ({version: 1, prefs: {name:'Sprout', language:'en', theme:'sage', voice:true, style:'gentle', favorites:['places'], checkDelay:15,nonurgentDelay:8},
    people:[{id:'sample-mei', name:'Mei', relationshipKey:'mgDaughter', storyKey:'mgMeiStory', moreKey:'mgMeiMore', relatedPlaceId:'l3',relatedMusicId:'sample-music',approved:true, sample:true}],
    places:seedPlaces.map(p => ({guidanceCue:p.name,recognitionCue:`Look for ${p.name}.`,visibility:'day',salience:3,...p, name:p.id === 'l3' ? 'Morning Market' : p.name,nameKey:p.id==='l3'?'mgMarket':null, storyKey:'mgPlaceStory', memoryApproved:true, navigationApproved:true, sample:true, waypoint:{i:p.i,j:p.j}})),
    music:[{id:'sample-music',nameKey:'mgSong',storyKey:'mgNoAudio',approved:true,sample:true}],
    journeys:[{id:'sample-journey',name:'Mei and the Morning Market',personId:'sample-mei',placeId:'l3',musicId:'sample-music',approved:true,sample:true}],
    routines:[{id:'sample-routine',nameKey:'mgOutside',stepsKeys:['mgShoes','mgKeys','mgJacket'],approved:true,sample:true}],
    garden:[{id:'first-tree',kind:'tree',at:0}], events:[], usage:{}, lastActivity:null});
  D.load = function () {
    const fresh=D.defaults();
    try { const raw=localStorage.getItem(KEY); D.state=raw ? JSON.parse(raw) : fresh;
      if(D.state.version!==1 || !['people','places','music','routines','garden','events'].every(k=>Array.isArray(D.state[k]))) throw Error('schema');
      D.state.journeys=Array.isArray(D.state.journeys)?D.state.journeys:fresh.journeys;
      const known=new Set(D.state.places.map(p=>p.id));fresh.places.filter(p=>!known.has(p.id)).forEach(p=>D.state.places.push(p));
      D.state.places=D.state.places.map(p=>({...fresh.places.find(seed=>seed.id===p.id),...p}));
      D.state.prefs={...fresh.prefs,...D.state.prefs}; D.state.usage=D.state.usage||{};
    } catch(e) {D.state=fresh; D.persistent=false;}
    D.applyPrefs(); D.syncPlaces(); return D.state;
  };
  D.save = function () {try {localStorage.setItem(KEY,JSON.stringify(D.state));WH.Backend?.queueState(D.state);return true;} catch(e) {D.persistent=false; return false;} };
  D.syncBackend=async function(){const remote=await WH.Backend?.sync(D.state);if(!remote)return false;const fresh=D.defaults();if(remote.version!==1||!['people','places','music','routines','journeys','garden','events'].every(k=>Array.isArray(remote[k])))return false;const known=new Set(remote.places.map(p=>p.id));const places=remote.places.map(p=>({...fresh.places.find(seed=>seed.id===p.id),...p})).concat(fresh.places.filter(p=>!known.has(p.id)));D.state={...remote,places,prefs:{...fresh.prefs,...remote.prefs},usage:remote.usage||{}};D.applyPrefs();D.syncPlaces();D.save();D.refresh();return true;};
  D.applyPrefs=()=>{const p=D.state.prefs; WH.S.assistant.name=p.name; WH.S.voiceOn=p.voice;};
  D.hasPosition=p=>Number.isInteger(p.i)&&Number.isInteger(p.j)&&p.i>=0&&p.i<=12&&p.j>=0&&p.j<=12;
  D.navigationPlaces=()=>D.state.places.filter(p=>p.navigationApproved===true&&D.hasPosition(p));
  D.approved=kind=>D.state[kind].filter(p=>kind==='places'?p.memoryApproved===true:p.approved===true);
  D.syncPlaces=function(){WH.S.landmarks=D.state.places.filter(D.hasPosition).map(p=>({...p,sx:p.sx||1,sz:p.sz||-1,photo:D.url(p.photoId)||p.photo||null}));};
  D.refresh=function(){D.syncPlaces(); (WH.worlds||[]).forEach(w=>w.rebuildLandmarks()); WH.MemorySafety&&WH.MemorySafety.libraryChanged();};
  D.upsert=function(kind,record){if(!['people','places','music','routines','journeys'].includes(kind))throw Error('kind'); const list=D.state[kind];const old=list.find(x=>x.id===record.id); const item={...old,...record,id:record.id||('m-'+Date.now()+'-'+Math.random().toString(36).slice(2,8))}; if(kind==='places'&&item.navigationApproved&&!D.hasPosition(item))throw Error('position');if(old)list.splice(list.indexOf(old),1,item);else list.push(item);D.save();D.refresh();return item;};
  D.remove=function(kind,id){const list=D.state[kind], item=list.find(x=>x.id===id);D.state[kind]=list.filter(x=>x.id!==id);D.save();D.refresh();if(item)['photoId','audioId'].forEach(k=>{if(item[k])D.deleteMedia(item[k]);});};
  D.event=function(type,detail){D.state.events.push({type,detail:detail||'',at:new Date().toISOString()});D.state.events=D.state.events.slice(-300);D.save();};
  D.grow=function(kind='flower'){if(!['flower','tree','butterfly'].includes(kind))return;D.state.garden.push({id:'g-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),kind,at:Date.now()});D.save();};
  D.complete=function(kind){D.state.usage[kind]=(D.state.usage[kind]||0)+1;D.state.lastActivity=kind;D.grow();D.event('activity',kind);};
  D.recommend=function(){return ['journey','people','places','music','routines','garden'].filter(k=>k!==D.state.lastActivity).sort((a,b)=>((D.state.usage[b]||0)+(D.state.prefs.favorites.includes(b)?3:0))-((D.state.usage[a]||0)+(D.state.prefs.favorites.includes(a)?3:0)))[0];};
  D.url=id=>id?D.urls.get(id)||WH.Backend?.mediaUrl(id)||'':'';
  D.openDB=function(){return new Promise((resolve,reject)=>{if(!window.indexedDB)return reject(Error('storage'));const q=indexedDB.open('wayhome-media',1);q.onupgradeneeded=()=>q.result.createObjectStore('media');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});};
  D.hydrate=async function(){try{D.db=await D.openDB();await new Promise((resolve,reject)=>{const tx=D.db.transaction('media');const q=tx.objectStore('media').openCursor();q.onsuccess=()=>{const c=q.result;if(c){D.urls.set(c.key,URL.createObjectURL(c.value));c.continue();}else resolve();};q.onerror=()=>reject(q.error);});D.refresh();}catch(e){D.mediaUnavailable=true;}};
  D.putMedia=async function(file,kind){const allowed=kind==='audio'?/^audio\//:/^image\/(jpeg|png|webp|gif)$/;if(!allowed.test(file.type)||file.size>(kind==='audio'?25:5)*1024*1024)throw Error('file');if(!D.db)D.db=await D.openDB();const id='media-'+Date.now()+'-'+Math.random().toString(36).slice(2);await new Promise((resolve,reject)=>{const tx=D.db.transaction('media','readwrite');tx.objectStore('media').put(file,id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});D.urls.set(id,URL.createObjectURL(file));await WH.Backend?.putMedia(id,file);return id;};
  D.deleteMedia=function(id){if(D.urls.has(id)){URL.revokeObjectURL(D.urls.get(id));D.urls.delete(id);}if(D.db){const tx=D.db.transaction('media','readwrite');tx.objectStore('media').delete(id);}WH.Backend?.deleteMedia(id);};
  D.text=(item,key='name')=>item[key+'Key']?WH.t(item[key+'Key']):item[key]||'';
  D.snapshot=()=>clone(D.state);
  D.clear=async function(){if(!D.db)D.db=await D.openDB();await new Promise((resolve,reject)=>{const tx=D.db.transaction('media','readwrite');tx.objectStore('media').clear();tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});await WH.Backend?.clearMedia();D.urls.forEach(url=>URL.revokeObjectURL(url));D.urls.clear();D.state=D.defaults();D.state.garden=[];D.state.people=[];D.state.places=[];D.state.music=[];D.state.routines=[];D.state.journeys=[];D.persistent=true;D.save();D.applyPrefs();D.refresh();};
  D.load();
})();
