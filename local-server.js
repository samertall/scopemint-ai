'use strict';
// Zero-dependency development server with the same API handlers deployed on Vercel.
const http=require('node:http');const fs=require('node:fs');const path=require('node:path');
const PORT=Number(process.env.PORT)||3000;
const handlers={'/api/status':'./api/status.js','/api/analyze':'./api/analyze.js','/api/create-order':'./api/create-order.js','/api/capture-order':'./api/capture-order.js'};
const publicFiles={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/styles.css':'styles.css','/favicon.svg':'favicon.svg'};
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{
  const route=new URL(req.url,`http://${req.headers.host}`).pathname;
  try{
    if(handlers[route])return await require(handlers[route])(req,res);
    if(publicFiles[route]){
      const p=path.join(__dirname,publicFiles[route]);res.setHeader('Content-Type',mime[path.extname(p)]||'text/plain');res.setHeader('X-Content-Type-Options','nosniff');res.end(fs.readFileSync(p));return;
    }
    res.statusCode=404;res.end('Not found');
  }catch(e){console.error('Request failed:',e.message);res.statusCode=500;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error:'SERVER_ERROR',message:'Unexpected server error.'}));}
}).listen(PORT,()=>console.log(`ScopeMint AI running at http://localhost:${PORT}`));