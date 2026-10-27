'use strict';
const {json,onlyMethod}=require('./_common.cjs');
const {configured}=require('./_paypal.cjs');
module.exports=async function handler(req,res){if(!onlyMethod(req,res,'GET'))return;json(res,200,{app:'ScopeMint AI',paypalSandbox:configured(),aiMode:process.env.OPENAI_API_KEY?'openai-and-built-in-ml':'built-in-ml',livePayments:false,environment:'sandbox-only'});};