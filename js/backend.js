/* Optional same-origin backend. The static prototype keeps working when it is unavailable. */
(function(){
 const WH=window.WH=window.WH||{};
 const B=WH.Backend={online:false,available:null,timer:null,pending:null};
 B.request=async function(path,options={}){try{const response=await fetch('/api'+path,{...options,headers:{...(typeof Blob!=='undefined'&&options.body instanceof Blob?{'Content-Type':options.body.type}:{}),...(options.headers||{})}});if(!response.ok)throw Error(String(response.status));B.online=true;B.available=true;return response.status===204?null:response.json();}catch(error){B.online=false;B.available=false;return null;}};
 B.sync=async function(localState){const result=await B.request('/state');if(result?.state)return result.state;const saved=await B.request('/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(localState)});return saved?localState:null;};
 B.queueState=function(state){if(B.available===false)return;B.pending=JSON.parse(JSON.stringify(state));clearTimeout(B.timer);B.timer=setTimeout(async()=>{const body=B.pending;B.pending=null;await B.request('/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});},350);};
 B.putMedia=async(id,file)=>{if(!B.online)return null;return B.request('/media/'+encodeURIComponent(id),{method:'PUT',body:file});};
 B.deleteMedia=id=>{if(B.online)B.request('/media/'+encodeURIComponent(id),{method:'DELETE'});};
 B.clearMedia=()=>B.online?B.request('/media',{method:'DELETE'}):null;
 B.mediaUrl=id=>B.online?'/api/media/'+encodeURIComponent(id):'';
})();
