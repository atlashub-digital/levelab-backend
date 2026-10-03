import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type Member } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import {
  RecordCheckinDto,
  ResolveMemberDto,
  UpdateWellnessProfileDto,
} from './internal-lia.dto';

@Injectable()
export class InternalLiaService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveMember(input: ResolveMemberDto): Promise<Member> {
    if (!input.phoneE164 && !input.email) {
      throw new BadRequestException('phoneE164 or email is required.');
    }

    const member = await this.prisma.member.findFirst({
      where: {
        OR: [
          ...(input.phoneE164 ? [{ phoneE164: input.phoneE164 }] : []),
          ...(input.email ? [{ email: input.email }] : []),
        ],
      },
    });

    if (member) {
      return this.prisma.member.update({
        where: { id: member.id },
        data: {
          ...(input.displayName ? { displayName: input.displayName } : {}),
          ...(input.locale ? { locale: input.locale } : {}),
          ...(input.country ? { country: input.country.toUpperCase() } : {}),
          ...(input.timezone ? { timezone: input.timezone } : {}),
        },
      });
    }

    return this.prisma.member.create({
      data: {
        phoneE164: input.phoneE164,
        email: input.email?.toLowerCase(),
        displayName: input.displayName,
        locale: input.locale ?? 'pt-BR',
        country: input.country?.toUpperCase(),
        timezone: input.timezone,
      },
    });
  }

  async getContext(memberId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      include: {
        profile: true,
        enrollments: {
          where: { status: 'ACTIVE' },
          include: { program: true },
          orderBy: { updatedAt: 'desc' },
          take: 3,
        },
        checkins: {
          orderBy: { localDate: 'desc' },
          take: 7,
        },
      },
    });

    if (!member) throw new NotFoundException('Member not found.');

    return {
      member: {
        id: member.id,
        displayName: member.displayName,
        locale: member.locale,
        country: member.country,
        timezone: member.timezone,
        status: member.status,
      },
      profile: member.profile,
      activePrograms: member.enrollments.map((enrollment) => ({
        enrollmentId: enrollment.id,
        programId: enrollment.programId,
        slug: enrollment.program.slug,
        name: enrollment.program.name,
        currentDay: enrollment.currentDay,
        startedAt: enrollment.startedAt,
      })),
      recentCheckins: member.checkins,
    };
  }

  async updateProfile(memberId: string, input: UpdateWellnessProfileDto) {
    await this.assertMember(memberId);

    const data: Prisma.WellnessProfileUncheckedUpdateInput = {
      ...(input.primaryGoal !== undefined ? { primaryGoal: input.primaryGoal } : {}),
      ...(input.routineSummary !== undefined ? { routineSummary: input.routineSummary } : {}),
      ...(input.movementLevel !== undefined ? { movementLevel: input.movementLevel } : {}),
      ...(input.sleepPattern !== undefined ? { sleepPattern: input.sleepPattern } : {}),
      ...(input.foodPreferences !== undefined
        ? { foodPreferences: input.foodPreferences as Prisma.InputJsonValue }
        : {}),
      ...(input.barriers !== undefined
        ? { barriers: input.barriers as Prisma.InputJsonValue }
        : {}),
      ...(input.communicationPrefs !== undefined
        ? { communicationPrefs: input.communicationPrefs as Prisma.InputJsonValue }
        : {}),
    };

    return this.prisma.wellnessProfile.upsert({
      where: { memberId },
      update: data,
      create: {
        ...(data as Prisma.WellnessProfileUncheckedCreateInput),
        memberId,
      },
    });
  }

  async recordCheckin(memberId: string, input: RecordCheckinDto) {
    await this.assertMember(memberId);

    const localDate = new Date(`${input.localDate}T00:00:00.000Z`);
    if (Number.isNaN(localDate.getTime())) {
      throw new BadRequestException('localDate must be YYYY-MM-DD.');
    }

    const data = {
      energy: input.energy,
      sleep: input.sleep,
      movement: input.movement,
      hydration: input.hydration,
      wellbeing: input.wellbeing,
      note: input.note,
      payload: input.payload as Prisma.InputJsonValue | undefined,
    };

    return this.prisma.dailyCheckin.upsert({
      where: {
        memberId_localDate: {
          memberId,
          localDate,
        },
      },
      update: data,
      create: {
        memberId,
        localDate,
        ...data,
      },
    });
  }

  private async assertMember(memberId: string): Promise<void> {
    const found = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true },
    });
    if (!found) throw new NotFoundException('Member not found.');
  }
}
