import {
  IsEmail,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ResolveMemberDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phoneE164?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  locale?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  timezone?: string;
}

export class UpdateWellnessProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  primaryGoal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  routineSummary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  movementLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  sleepPattern?: string;

  @IsOptional()
  @IsObject()
  foodPreferences?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  barriers?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  communicationPrefs?: Record<string, unknown>;
}

export class RecordCheckinDto {
  @IsString()
  localDate!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  energy?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  sleep?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  movement?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  hydration?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  wellbeing?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  note?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
