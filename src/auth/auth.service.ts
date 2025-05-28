import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async validateUser(profile: any) {
    const { id, emails, displayName } = profile;
    const email = emails[0].value;

    let user = await this.prisma.user.findUnique({ where: { googleId: id } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          googleId: id,
          email,
          name: displayName,
        },
      });
    }

    return user;
  }
}