'use strict';
const {json,onlyMethod,body}=require('./_common.cjs');
const {configured,postPayPal}=require('./_paypal.cjs');
module.exports=async function handler(req,res){
  if(!onlyMethod(req,res,'POST'))return;
  if(!configured()){json(res,503,{error:'SANDBOX_NOT_CONFIGURED',message:'PayPal sandbox is not configured.'});return;}
  try{
    const input=await body(req);const id=String(input.orderId||'').trim();
    if(!/^[A-Z0-9]{8,30}$/i.test(id)){json(res,400,{error:'INVALID_ORDER_ID',message:'Invalid PayPal order identifier.'});return;}
    const result=await postPayPal(`/v2/checkout/orders/${encodeURIComponent(id)}/capture`,{}, {requestId:`scope-${id}`});
    const capture=result.purchase_units?.[0]?.payments?.captures?.[0];
    json(res,200,{id:result.id,status:result.status,captureId:capture?.id||null,captureStatus:capture?.status||null,amount:capture?.amount?.value||null,currency:capture?.amount?.currency_code||'USD',provider:'PayPal Sandbox'});
  }catch(e){json(res,e.status||500,{error:e.code||'PAYPAL_CAPTURE_FAILED',message:e.message||'Unable to capture the sandbox order.'});}
};