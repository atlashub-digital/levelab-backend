import { ForbiddenException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CONTENT_ASSETS } from './access.catalog';

/** ARO V1 is sole authority for commercial access when enabled. */
@Injectable()
export class AroEntitlementsService {
  constructor(private readonly config: ConfigService) {}

  get enabled(): boolean {
    return this.config.get<string>('ARO_ENTITLEMENTS_ENABLED') === 'true';
  }

  async resolve(email: string | null): Promise<Set<string>> {
    if (!email || !email.trim()) throw new ForbiddenException('Verified email is required to resolve ARO access');
    const base=this.config.get<string>('ARO_API_URL');
    const project=this.config.get<string>('ARO_PROJECT_SLUG');
    const key=this.config.get<string>('ARO_SERVER_KEY');
    if(!base||!project||!key||!email) throw new ServiceUnavailableException('ARO is not configured');
    let response:Response;
    try{response=await fetch(base.replace(/\/$/,'')+'/v1/entitlements/resolve',{
      method:'POST',cache:'no-store',
      headers:{'Content-Type':'application/json',Authorization:'Bearer '+key},
      body:JSON.stringify({project,identity:{email}}),
      signal:AbortSignal.timeout(7000)
    });}catch{throw new ServiceUnavailableException('ARO unavailable')}
    if(!response.ok)throw new ServiceUnavailableException('ARO unavailable');
    const result=await response.json() as {entitlements:Array<{
      key:string;status:'ACTIVE'|'REVOKED'|'EXPIRED';starts_at:string;expires_at?:string
    }>};
    const now=Date.now();
    const valid=new Set((result.entitlements??[]).filter(e=>
      e.status==='ACTIVE' && Date.parse(e.starts_at)<=now &&
      (!e.expires_at || Date.parse(e.expires_at)>now)).map(e=>e.key));
    return valid;
  }

  async hasAsset(email:string|null,assetId:string):Promise<boolean>{
    const key=RIGHTS[assetId];if(!key)return false;
    return (await this.resolve(email)).has(key);
  }
  async library(email:string|null):Promise<Array<{id:string;hasAccess:boolean}>>{
    const rights=await this.resolve(email);
    return CONTENT_ASSETS.map(asset=>({id:asset.id,hasAccess:rights.has(RIGHTS[asset.id])}));
  }
}
export const RIGHTS:Record<string,string>={
 'corpo-forte-guia':'levelab:reader:corpo-forte',
 'corpo-forte-workbook':'levelab:reader:corpo-forte-workbook',
 'forca-na-caneta':'levelab:reader:forca-na-caneta'
};
