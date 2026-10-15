import {BadRequestException,Controller,Headers,HttpCode,Post,RawBodyRequest,Req,ServiceUnavailableException,UnauthorizedException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {Prisma} from '@prisma/client';
import type {Request} from 'express';
import {PrismaService} from '../database/prisma.service';
import {verifyAroSignature} from './aro-hmac';
/** ARO events notify only. The project never grants purchased rights from webhook data. */
@Controller('aro')
export class AroWebhookController{
 constructor(private readonly prisma:PrismaService,private readonly config:ConfigService){}
 @Post('webhook') @HttpCode(204)
 async receive(@Req() req:RawBodyRequest<Request>,@Headers('x-aro-event-id') eventId?:string,@Headers('x-aro-timestamp') timestamp?:string,@Headers('x-aro-signature') signature?:string):Promise<void>{
  const secret=this.config.get<string>('ARO_WEBHOOK_SECRET'),project=this.config.get<string>('ARO_PROJECT_SLUG');
  if(!secret||!project)throw new ServiceUnavailableException('ARO_WEBHOOK_NOT_CONFIGURED');
  if(!req.rawBody||!eventId||!timestamp||!signature)throw new BadRequestException('Missing ARO webhook fields');
  if(!verifyAroSignature({body:req.rawBody,timestamp,signatureHeader:signature,secret}))throw new UnauthorizedException('Invalid ARO signature');
  const body=req.body as {id?:unknown;type?:unknown;project?:unknown}|undefined;
  if(!body||body.project!==project||body.id!==eventId||typeof body.type!=='string'||!/^[a-z]+\.[a-z]+$/.test(body.type)||!/^[a-f\d-]{36}$/i.test(eventId))throw new BadRequestException('Invalid ARO event');
  try{await this.prisma.aroWebhookEvent.create({data:{id:eventId,type:body.type}});}
  catch(e){if(e instanceof Prisma.PrismaClientKnownRequestError&&e.code==='P2002')return;throw e;}
  // Protected content always re-resolves ARO entitlement by verified identity.
 }
}
