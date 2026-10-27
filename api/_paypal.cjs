'use strict';
const ROOT='https://api-m.sandbox.paypal.com';
function configured(){return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);}
async function getToken(fetcher=fetch){
  if(!configured())throw Object.assign(new Error('PayPal sandbox credentials are not configured.'),{status:503});
  const auth=Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response=await fetcher(`${ROOT}/v1/oauth2/token`,{method:'POST',headers:{'Authorization':`Basic ${auth}`,'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',signal:AbortSignal.timeout(12000)});
  const data=await response.json();
  if(!response.ok||!data.access_token)throw Object.assign(new Error('PayPal sandbox authentication failed.'),{status:502});
  return data.access_token;
}
async function postPayPal(path,payload,{requestId,fetcher=fetch}={}){
  const token=await getToken(fetcher);
  const response=await fetcher(`${ROOT}${path}`,{method:'POST',headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json','PayPal-Request-Id':requestId||crypto.randomUUID(),'Prefer':'return=representation'},body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});
  const data=await response.json();
  if(!response.ok)throw Object.assign(new Error('PayPal could not process this sandbox request.'),{status:502,code:data?.name||'PAYPAL_ERROR',details:data?.details?.map(e=>e.issue).slice(0,3)||[]});
  return data;
}
function amountUSD(value){const num=Number(value); if(!Number.isFinite(num)||num<1||num>10000||Math.round(num*100)/100!==num)throw Object.assign(new Error('Amount must be between $1 and $10,000 with at most two decimal places.'),{status:400});return num.toFixed(2);}
module.exports={ROOT,configured,getToken,postPayPal,amountUSD};