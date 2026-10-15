import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createHmac} from 'node:crypto';
import {fetchActiveAroKeys} from '../src/aro/aro-contract.ts';
import {verifyAroSignature} from '../src/aro/aro-hmac.ts';
test('ARO ACTIVE permits; revoked and expired deny',async()=>{
 const f=(async()=>new Response(JSON.stringify({project:'levelab',entitlements:[
 {key:'content:corpo-forte',status:'ACTIVE',starts_at:'2026-01-01T00:00:00Z'},
 {key:'content:forca-na-caneta',status:'REVOKED',starts_at:'2026-01-01T00:00:00Z'},
 {key:'premium',status:'ACTIVE',starts_at:'2026-01-01T00:00:00Z',expires_at:'2026-02-01T00:00:00Z'}
 ]}),{status:200})) as typeof fetch;
 const got=await fetchActiveAroKeys({apiUrl:'https://aro-preview.atlashub.si',project:'levelab',serverKey:'test',verifiedEmail:'user@example.com',fetchImpl:f,now:new Date('2026-10-15T12:00:00Z')});
 assert.deepEqual(got,['content:corpo-forte']);
});
test('ARO fails closed on unavailable or malformed response',async()=>{
 const input={apiUrl:'https://aro-preview.atlashub.si',project:'levelab',serverKey:'test',verifiedEmail:'user@example.com'};
 await assert.rejects(fetchActiveAroKeys({...input,fetchImpl:(async()=>new Response('{}',{status:503})) as typeof fetch}));
 await assert.rejects(fetchActiveAroKeys({...input,fetchImpl:(async()=>new Response('{}',{status:200})) as typeof fetch}));
});
test('HMAC valid, tampered or replayed rejected',()=>{
 const now=1792065600,timestamp=String(now),body=Buffer.from('{"id":"abc"}'),secret='mock_only';
 const signatureHeader='v1='+createHmac('sha256',secret).update(timestamp+'.').update(body).digest('hex');
 const input={nowSeconds:now,body,timestamp,signatureHeader,secret};
 assert.equal(verifyAroSignature(input),true);
 assert.equal(verifyAroSignature({...input,body:Buffer.from('changed')}),false);
 assert.equal(verifyAroSignature({...input,nowSeconds:now+301}),false);
});
