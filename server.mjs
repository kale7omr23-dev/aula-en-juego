import http from 'node:http';
import { handleRequest } from './app.mjs';
const rooms = new Map();
http.createServer((req,res)=>handleRequest(req,res,rooms)).listen(Number(process.env.PORT)||3001,'0.0.0.0',()=>console.log('Aula en juego disponible en http://localhost:3001'));
setInterval(()=>{for(const [code,room] of rooms)if(Date.now()-room.created>86400000)rooms.delete(code);},3600000).unref();
