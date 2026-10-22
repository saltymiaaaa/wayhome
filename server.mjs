import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createStore} from './backend/store.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT||8765),host=process.env.HOST||'127.0.0.1';
const store=createStore(process.env.WAYHOME_DATA_DIR||path.join(root,'backend','data'));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.mp3':'audio/mpeg','.wav':'audio/wav'};
const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
const body=async(req,limit)=>{const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>limit)throw Object.assign(Error('too large'),{status:413});chunks.push(chunk);}return Buffer.concat(chunks);};

const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/health'&&req.method==='GET')return json(res,200,{ok:true,service:'wayhome',version:1});
  if(url.pathname==='/api/state'&&req.method==='GET')return json(res,200,{state:await store.readState()});
  if(url.pathname==='/api/state'&&req.method==='PUT'){const state=JSON.parse((await body(req,2*1024*1024)).toString('utf8'));await store.writeState(state);return json(res,200,{ok:true});}
  if(url.pathname==='/api/media'&&req.method==='DELETE'){await store.clearMedia();res.writeHead(204);return res.end();}
  const media=url.pathname.match(/^\/api\/media\/([^/]+)$/);
  if(media){const id=decodeURIComponent(media[1]);if(req.method==='PUT'){const type=String(req.headers['content-type']||''),image=/^image\/(jpeg|png|webp|gif)$/.test(type),audio=/^audio\//.test(type);if(!image&&!audio)return json(res,415,{error:'unsupported media type'});await store.writeMedia(id,await body(req,(image?5:25)*1024*1024),type);return json(res,201,{ok:true,id});}if(req.method==='GET'){const item=await store.readMedia(id);if(!item)return json(res,404,{error:'not found'});res.writeHead(200,{'Content-Type':item.type,'Cache-Control':'private, max-age=300'});return res.end(item.body);}if(req.method==='DELETE'){await store.deleteMedia(id);res.writeHead(204);return res.end();}}
  if(url.pathname.startsWith('/api/'))return json(res,404,{error:'not found'});
  const requested=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname.slice(1));
  const file=path.resolve(root,requested);if(file!==root&&!file.startsWith(root+path.sep))return json(res,403,{error:'forbidden'});
  try{const content=await fs.readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file).toLowerCase()]||'application/octet-stream'});res.end(content);}catch(error){json(res,error.code==='ENOENT'?404:500,{error:error.code==='ENOENT'?'not found':'server error'});}
 }catch(error){json(res,error.status||400,{error:error.status===413?'request too large':'invalid request'});}
});

server.listen(port,host,()=>console.log(`WayHome running at http://${host}:${port}/`));
