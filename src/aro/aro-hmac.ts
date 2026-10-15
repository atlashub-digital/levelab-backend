import {createHmac,timingSafeEqual} from 'node:crypto';
/** Verify exact raw body and timestamp; never trust parsed/restringified JSON. */
export function verifyAroSignature(input:{body:Buffer;timestamp:string;signatureHeader:string;secret:string;nowSeconds?:number;toleranceSeconds?:number}):boolean{
 if(!/^\d{10,13}$/.test(input.timestamp))return false;
 const timestamp=Number(input.timestamp);
 if(!Number.isSafeInteger(timestamp)||Math.abs((input.nowSeconds??Date.now()/1000)-timestamp)>(input.toleranceSeconds??300))return false;
 const found=input.signatureHeader.split(',').map(s=>s.trim()).find(s=>/^v1=[a-f\d]{64}$/i.test(s));
 if(!found)return false;
 const expected=createHmac('sha256',input.secret).update(input.timestamp+'.').update(input.body).digest();
 const received=Buffer.from(found.slice(3),'hex');
 return expected.length===received.length&&timingSafeEqual(expected,received);
}
