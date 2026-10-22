const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');

test('backend store persists caregiver state and media safely',async()=>{
 const {createStore}=await import('../backend/store.mjs');
 const tempRoot=path.join(__dirname,'.tmp');await fs.mkdir(tempRoot,{recursive:true});
 const dir=await fs.mkdtemp(path.join(tempRoot,'wayhome-store-'));
 try{
  const store=createStore(dir),state={version:1,prefs:{name:'Moss'},people:[],places:[{id:'landmark'}],music:[],routines:[],journeys:[],garden:[],events:[]};
  assert.equal(await store.readState(),null);
  await store.writeState(state);
  assert.deepEqual(await store.readState(),state);
  await assert.rejects(()=>store.writeState({version:1,prefs:{}}),/invalid state/);
  await store.writeMedia('photo-1',Buffer.from('image bytes'),'image/png');
  const media=await store.readMedia('photo-1');
  assert.equal(media.type,'image/png');
  assert.equal(media.body.toString(),'image bytes');
  await store.clearMedia();
  assert.equal(await store.readMedia('photo-1'),null);
  await store.writeMedia('photo-1',Buffer.from('image bytes'),'image/png');
  await store.deleteMedia('photo-1');
  assert.equal(await store.readMedia('photo-1'),null);
  await assert.rejects(()=>store.writeMedia('../escape',Buffer.from('x'),'text/plain'),/invalid id/);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
