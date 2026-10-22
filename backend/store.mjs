import fs from 'node:fs/promises';
import path from 'node:path';

const safeId=id=>/^[a-zA-Z0-9._-]{1,160}$/.test(id);
const validState=state=>state&&state.version===1&&state.prefs&&typeof state.prefs==='object'&&['people','places','music','routines','journeys','garden','events'].every(key=>Array.isArray(state[key]));

export function createStore(root){
 const dataDir=path.resolve(root),mediaDir=path.join(dataDir,'media'),stateFile=path.join(dataDir,'state.json');
 const init=()=>Promise.all([fs.mkdir(dataDir,{recursive:true}),fs.mkdir(mediaDir,{recursive:true})]);
 return {
  async readState(){await init();try{return JSON.parse(await fs.readFile(stateFile,'utf8'));}catch(error){if(error.code==='ENOENT')return null;throw error;}},
  async writeState(state){await init();if(!validState(state))throw Error('invalid state');const temp=stateFile+'.tmp';await fs.writeFile(temp,JSON.stringify(state,null,2));await fs.rename(temp,stateFile);return state;},
  async writeMedia(id,buffer,type){await init();if(!safeId(id))throw Error('invalid id');await fs.writeFile(path.join(mediaDir,id),buffer);await fs.writeFile(path.join(mediaDir,id+'.json'),JSON.stringify({type:type||'application/octet-stream'}));},
  async readMedia(id){await init();if(!safeId(id))return null;try{const [body,raw]=await Promise.all([fs.readFile(path.join(mediaDir,id)),fs.readFile(path.join(mediaDir,id+'.json'),'utf8')]);return{body,type:JSON.parse(raw).type};}catch(error){if(error.code==='ENOENT')return null;throw error;}},
  async deleteMedia(id){await init();if(!safeId(id))return;await Promise.all([fs.rm(path.join(mediaDir,id),{force:true}),fs.rm(path.join(mediaDir,id+'.json'),{force:true})]);}
  ,async clearMedia(){await fs.rm(mediaDir,{recursive:true,force:true});await fs.mkdir(mediaDir,{recursive:true});}
 };
}
