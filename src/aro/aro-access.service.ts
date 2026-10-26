import { Injectable,ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {fetchActiveAroKeys} from './aro-contract';
@Injectable()
export class AroAccessService{
 constructor(private readonly config:ConfigService){}
 get enabled(){return this.config.get<string>('ARO_ENTITLEMENTS_ENABLED')==='true';}
 /** Fail closed if ARO is configured but not reachable. No paid-entitlement cache. */
 async activeKeys(email:string|null|undefined):Promise<string[]>{
  if(!this.enabled||!email)return [];
  const apiUrl=this.config.get<string>('ARO_API_URL'),project=this.config.get<string>('ARO_PROJECT_SLUG'),serverKey=this.config.get<string>('ARO_SERVER_KEY');
  if(!apiUrl||!project||!serverKey)throw new ServiceUnavailableException('ARO_ENTITLEMENTS_NOT_CONFIGURED');
  try{return await fetchActiveAroKeys({apiUrl,project,serverKey,verifiedEmail:email});}
  catch{throw new ServiceUnavailableException('ARO_ENTITLEMENTS_UNAVAILABLE');}
 }
}
