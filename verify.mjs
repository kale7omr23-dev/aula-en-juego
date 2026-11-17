import {spawn} from 'node:child_process';
const child=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'3019'},stdio:'pipe'});
try{
await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',()=>reject(Error('Servidor detenido')));});
const api=async data=>{const r=await fetch('http://localhost:3019/api',{method:'POST',body:JSON.stringify(data)});const j=await r.json();if(!r.ok)throw Error(j.error);return j;};
const room=await api({action:'create',topic:'Prueba compartida'});
const student=await api({action:'join',code:room.code});
await api({...room,...student,key:undefined,action:'vote',vote:1});
let state=await api(room);if(state.votes[1]!==1)throw Error('Voto no compartido');
await api({...room,action:'advance'});
state=await api({code:room.code,...student});if(state.winner!==1||state.phase!=='play')throw Error('Misión incorrecta');
await api({code:room.code,...student,action:'note',text:'Nuestra idea'});
state=await api(room);if(state.notes[0]!=='Nuestra idea')throw Error('Mural no compartido');
await api({...room,action:'advance'});
await api({code:room.code,...student,action:'feedback',text:'Más tiempo para pensar'});
state=await api(room);if(state.feedback.length!==1)throw Error('Reflexión no recibida');
console.log('Verificado: crear sala, entrar, votar, seleccionar misión, compartir mural y recibir reflexión.');
}finally{child.kill();}
