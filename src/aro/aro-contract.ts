/** ARO V1: authoritative access; see atlashub-finance/openapi/aro-v1.yaml. */
export type AroEntitlement = { key:string; status:'ACTIVE'|'REVOKED'|'EXPIRED'; starts_at:string; expires_at?:string; source_order_id?:string };
export async function fetchActiveAroKeys(input:{apiUrl:string;project:string;serverKey:string;verifiedEmail:string;fetchImpl?:typeof fetch;now?:Date}):Promise<string[]>{
 if(!/^https:\/\//i.test(input.apiUrl)&&!/^http:\/\/localhost(?::\d+)?$/i.test(input.apiUrl))throw new Error('ARO_URL_INVALID');
 const response=await(input.fetchImpl??fetch)(input.apiUrl.replace(/\/$/,'')+'/v1/entitlements/resolve',{
  method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+input.serverKey},
  body:JSON.stringify({project:input.project,identity:{email:input.verifiedEmail}}),
  cache:'no-store',signal:AbortSignal.timeout(8000)
 });
 if(!response.ok)throw new Error('ARO_ENTITLEMENTS_UNAVAILABLE');
 const unknownData:unknown=await response.json();
 if(!unknownData||typeof unknownData!=='object')throw new Error('ARO_BAD_RESPONSE');
 const data=unknownData as {project?:unknown;entitlements?:unknown};
 if(data.project!==input.project||!Array.isArray(data.entitlements))throw new Error('ARO_BAD_RESPONSE');
 const now=(input.now??new Date()).getTime();
 const keys=new Set<string>();
 for(const row of data.entitlements){
  if(!row||typeof row!=='object')throw new Error('ARO_BAD_ENTITLEMENT');
  const ent=row as Partial<AroEntitlement>;
  if(typeof ent.key!=='string'||!['ACTIVE','REVOKED','EXPIRED'].includes(String(ent.status)))throw new Error('ARO_BAD_ENTITLEMENT');
  if(ent.status!=='ACTIVE')continue;
  const start=Date.parse(String(ent.starts_at??''));
  if(!Number.isFinite(start)||start>now)continue;
  if(ent.expires_at!==undefined){const end=Date.parse(ent.expires_at);if(!Number.isFinite(end)||end<=now)continue;}
  keys.add(ent.key);
 }
 return [...keys];
}
