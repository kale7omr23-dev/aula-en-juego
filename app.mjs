import {readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
const token = () => randomBytes(16).toString('hex');
const send = (res,status,value) => {res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
export async function handleRequest(req,res,rooms){
 try {
 const url = new URL(req.url,'http://localhost');
 if(url.pathname==='/api'){
 let body='';for await(const part of req){body+=part;if(body.length>12000){send(res,413,{error:'Mensaje demasiado largo'});return;}}
 const data=body?JSON.parse(body):{};
 if(data.action==='create'){
 let code;do{code=randomBytes(3).toString('hex').toUpperCase();}while(rooms.has(code));
 const key=token();rooms.set(code,{key,topic:String(data.topic||'Nuestra prÃ³xima clase').slice(0,120),phase:'vote',options:[0,1,2],members:{},winner:null,notes:[],created:Date.now()});send(res,200,{code,key});return;
 }
 const code=url.searchParams.get('code')||data.code;const room=rooms.get(code);
 if(!room){send(res,404,{error:'No encontramos esa sala. Revisa el cÃ³digo.'});return;}
 if(data.action==='join'){const id=token();room.members[id]={vote:null,mood:null,feedback:null};send(res,200,{id});return;}
 const isTeacher=(url.searchParams.get('key')||data.key)===room.key;
 const member=room.members[url.searchParams.get('id')||data.id];
 if(!isTeacher&&!member){send(res,403,{error:'Vuelve a entrar a la sala.'});return;}
 if(data.action==='vote'){if(!member||room.phase!=='vote'||!room.options.includes(data.vote))throw Error('La votaciÃ³n no estÃ¡ disponible.');member.vote=data.vote;}
 if(data.action==='mood'){if(!member||![0,1,2].includes(data.mood))throw Error('Selecciona cÃ³mo te sientes.');member.mood=data.mood;}
 if(data.action==='note'){if(!member||room.phase!=='play')throw Error('Espera a que comience la misiÃ³n.');const text=String(data.text||'').trim().slice(0,600);if(text)room.notes.push(text);}
 if(data.action==='feedback'){if(!member||room.phase!=='end')throw Error('Espera al cierre.');member.feedback=String(data.text||'').slice(0,600);}
 if(data.action==='advance'){
 if(!isTeacher)throw Error('Solo el docente puede avanzar.');
 if(room.phase==='vote'){
 const counts=room.options.map(i=>Object.values(room.members).filter(m=>m.vote===i).length);const max=Math.max(...counts);if(!max)throw Error('Hace falta al menos un voto.');
 const tied=room.options.filter((_,i)=>counts[i]===max);
 if(tied.length>1){room.options=tied;Object.values(room.members).forEach(m=>m.vote=null);send(res,200,{message:'Empate. Se abriÃ³ una nueva votaciÃ³n entre las opciones empatadas.'});return;}
 room.winner=tied[0];room.phase='play';
 }else if(room.phase==='play')room.phase='end';
 }
 const members=Object.values(room.members);
 send(res,200,{topic:room.topic,phase:room.phase,options:room.options,winner:room.winner,count:members.length,votes:[0,1,2].map(i=>members.filter(m=>m.vote===i).length),moods:[0,1,2].map(i=>members.filter(m=>m.mood===i).length),myVote:member?.vote,myMood:member?.mood,notes:room.notes,feedback:isTeacher?members.map(m=>m.feedback).filter(Boolean):[]});return;
 }
 if(url.pathname!=='/'){res.writeHead(404);res.end();return;}
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(await readFile(new URL('./public/index.html',import.meta.url)));
 }catch(error){send(res,400,{error:error.message});}
}
