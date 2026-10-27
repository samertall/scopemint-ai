'use strict';
const {json,onlyMethod,body}=require('./_common.cjs');
const {configured,amountUSD,postPayPal}=require('./_paypal.cjs');
function originForRequest(req){
  const configuredOrigin=process.env.APP_URL;
  if(configuredOrigin){const url=new URL(configuredOrigin);if(url.protocol!=='https:'&&url.hostname!=='localhost')throw new Error('APP_URL must use HTTPS');return url.origin;}
  const host=String(req.headers['x-forwarded-host']||req.headers.host||'localhost:3000').split(',')[0].trim();
  if(!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)&&!/^[a-z0-9.-]+\.vercel\.app$/.test(host))throw Object.assign(new Error('Set APP_URL to the deployed HTTPS app origin.'),{status:400});
  return `${host.startsWith('localhost')||host.startsWith('127.')?'http':'https'}://${host}`;
}
module.exports=async function handler(req,res){
  if(!onlyMethod(req,res,'POST'))return;
  if(!configured()){json(res,503,{error:'SANDBOX_NOT_CONFIGURED',message:'PayPal sandbox checkout needs a developer client ID and secret. Use the clearly labeled demo simulation or follow README setup.'});return;}
  try{
    const b=await body(req);const value=amountUSD(b.amount);
    const title=String(b.title||'Project milestone').replace(/[<>]/g,'').slice(0,120).trim();
    if(title.length<3)throw Object.assign(new Error('Please provide a milestone title.'),{status:400});
    const origin=originForRequest(req);
    const order=await postPayPal('/v2/checkout/orders',{intent:'CAPTURE',purchase_units:[{reference_id:'scope-milestone',description:title,amount:{currency_code:'USD',value}}],payment_source:{paypal:{experience_context:{brand_name:'ScopeMint AI',user_action:'PAY_NOW',shipping_preference:'NO_SHIPPING',return_url:`${origin}/?paypal=return`,cancel_url:`${origin}/?paypal=cancel`}}}}, {requestId:crypto.randomUUID()});
    const payerAction=order.links?.find(link=>['payer-action','approve'].includes(link.rel))?.href;
    if(!payerAction||!payerAction.startsWith('https://www.sandbox.paypal.com/'))throw Object.assign(new Error('Sandbox approval link was not returned.'),{status:502});
    json(res,200,{id:order.id,status:order.status,approvalUrl:payerAction,amount:value,currency:'USD',provider:'PayPal Sandbox'});
  }catch(e){json(res,e.status||500,{error:e.code||'PAYPAL_ORDER_FAILED',message:e.message||'Unable to create a sandbox order.'});}
};