'use strict';
function json(res,code,payload){res.statusCode=code;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.end(JSON.stringify(payload));}
function onlyMethod(req,res,method){if(req.method!==method){res.setHeader('Allow',method);json(res,405,{error:'METHOD_NOT_ALLOWED',message:`Use ${method}.`});return false;}return true;}
async function body(req){if(req.body!==undefined) return typeof req.body==='string'?JSON.parse(req.body):req.body; let d='';for await(const ch of req){d+=ch;if(d.length>20000)throw new Error('Payload too large');}return d?JSON.parse(d):{};}
module.exports={json,onlyMethod,body};