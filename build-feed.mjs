#!/usr/bin/env node
import {readFile, stat, mkdir, open, rename, unlink} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash, randomUUID} from 'node:crypto';
import {dirname, basename, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const prefix = 'https://github.com/rset7/neuromax-desktop-releases/releases/download/';
const limit = 2 * 1024 ** 3;
const versionParts = v => {
  if (typeof v !== 'string' || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(v)) throw Error('Versão estável inválida');
  const parts = v.split('.').map(Number);
  if (!parts.every(Number.isSafeInteger)) throw Error('Versão excede o limite numérico');
  return parts;
};
const compare = (a,b) => {
  const aa=versionParts(a), bb=versionParts(b);
  for(let i=0;i<3;i++) if(aa[i]!==bb[i]) return aa[i]>bb[i]?1:-1;
  return 0;
};
const keys = (v, allowed) => v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).every(k=>allowed.includes(k));
function validate(feed) {
  if(!keys(feed,['currentRelease','releases'])) throw Error('Feed inválido');
  versionParts(feed.currentRelease);
  if(!Array.isArray(feed.releases) || !feed.releases.length || feed.releases.length>100) throw Error('Lista de versões inválida');
  const seen=new Set();
  for(const r of feed.releases) {
    if(!keys(r,['version','updateTo'])) throw Error('Entrada inválida');
    versionParts(r.version);
    if(seen.has(r.version)) throw Error('Versão duplicada');
    seen.add(r.version);
    const t=r.updateTo;
    if(!keys(t,['version','name','notes','pub_date','url','sha256','size']) || t.version!==r.version ||
       typeof t.name!=='string' || !t.name.trim() || t.name.length>200 ||
       typeof t.notes!=='string' || t.notes.length>8000 ||
       typeof t.pub_date!=='string' || !Number.isFinite(Date.parse(t.pub_date)) ||
       typeof t.sha256!=='string' || !/^[a-f0-9]{64}$/i.test(t.sha256) ||
       !Number.isSafeInteger(t.size) || t.size<1 || t.size>=limit) throw Error('Metadados inválidos');
    const expected=prefix+'v'+r.version+'/';
    if(typeof t.url!=='string' || !t.url.startsWith(expected) || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,159}\.zip$/.test(t.url.slice(expected.length))) throw Error('URL de pacote inválida');
    if(compare(r.version,feed.currentRelease)>0) throw Error('currentRelease não é a versão mais recente');
  }
  if(!seen.has(feed.currentRelease)) throw Error('Versão atual ausente');
}
async function main() {
  const [version,zipArg,outputArg,...extra]=process.argv.slice(2);
  if(!version || !zipArg || extra.length) throw Error('Uso: node build-feed.mjs VERSÃO ZIP [FEED_DE_SAÍDA]');
  versionParts(version);
  const zip=resolve(zipArg), name=basename(zip), output=resolve(outputArg ?? `${root}/darwin/arm64/releases.json`);
  if(zip===output || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,159}\.zip$/.test(name)) throw Error('Nome/caminho do ZIP inválido');
  const info=await stat(zip);
  if(!info.isFile() || info.size<4 || info.size>=limit) throw Error('Tamanho do ZIP inválido');
  const handle=await open(zip,'r');
  try {
    const signature=Buffer.alloc(4);await handle.read(signature,0,4,0);
    if(!signature.equals(Buffer.from([0x50,0x4b,0x03,0x04]))) throw Error('Arquivo sem cabeçalho ZIP');
  } finally { await handle.close(); }
  let previous;
  try {
    if((await stat(output)).size>128*1024) throw Error('Feed existente excede 128 KiB');
    previous=JSON.parse(await readFile(output,'utf8'));validate(previous);
  } catch(error) { if(error.code!=='ENOENT') throw error; }
  if(previous && compare(version,previous.currentRelease)<=0) throw Error('A nova versão precisa ser maior que a versão atual; entradas publicadas são imutáveis');
  const notes=await readFile(`${root}/notes/${version}.md`,'utf8');
  const hash=createHash('sha256');
  for await(const chunk of createReadStream(zip)) hash.update(chunk);
  const after=await stat(zip);
  if(after.size!==info.size || after.mtimeMs!==info.mtimeMs || after.ino!==info.ino) throw Error('ZIP mudou durante o cálculo');
  const entry={version,updateTo:{version,name:`Neuromax ${version}`,notes,pub_date:new Date().toISOString(),url:prefix+`v${version}/`+name,sha256:hash.digest('hex'),size:info.size}};
  const feed={currentRelease:version,releases:[entry,...(previous?.releases ?? [])]};
  validate(feed);
  const content=JSON.stringify(feed,null,2)+'\n';
  if(Buffer.byteLength(content)>128*1024) throw Error('Feed excede o limite de 128 KiB');
  await mkdir(dirname(output),{recursive:true});
  const temp=output+'.'+randomUUID()+'.tmp';
  try {
    const target=await open(temp,'wx',0o644);
    try { await target.writeFile(content,'utf8');await target.sync(); } finally { await target.close(); }
    await rename(temp,output);
  } finally { await unlink(temp).catch(error=>{if(error.code!=='ENOENT')throw error;}); }
  console.log(`Feed local preparado: ${output}\nVersão ${version}; ${info.size} bytes; SHA-256 ${entry.updateTo.sha256}`);
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
