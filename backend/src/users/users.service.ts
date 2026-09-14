import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toPublicProfile(user);
  }

  async search(query: string, excludeUserId: string) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: {
        id: { not: excludeUserId },
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { fullName: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });

    return users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      avatarUrl: u.avatarUrl,
      email: this.maskEmail(u.email),
    }));
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain || local.length <= 2) return email;
    return `${local.slice(0, 2)}***@${domain}`;
  }

  private toPublicProfile(user: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    avatarUrl: string | null;
    role: string;
    walletBalance: unknown;
    heldBalance: unknown;
    createdAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      walletBalance: user.walletBalance,
      heldBalance: user.heldBalance,
      createdAt: user.createdAt,
    };
  }
}
