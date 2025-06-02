/* eslint-disable */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { Profile } from 'passport'; // Make sure to import the correct Profile type

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(private prisma: PrismaService) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async validateUser(profile: Profile) {
    // For Google OAuth, the profile might contain the following:
    const { id: googleId, emails, displayName: name, photos } = profile;

    if (!googleId || !emails?.[0]?.value) {
      throw new Error('Missing required user information from Google');
    }

    const email = emails[0].value;
    const picture = photos?.[0]?.value;

    let user = await this.prisma.user.findUnique({ 
      where: { googleId } 
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          googleId,
          email,
          name: name || '',
          ...(picture && { avatar: picture }),
        },
      });
    }

    return user;
  }

  async googleLogin(token: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      
      if (!payload) {
        throw new Error('Invalid token payload');
      }

      // Type-safe destructuring
      const { sub: googleId, email, name, picture } = payload as TokenPayload & {
        sub: string;
        email: string;
        name?: string;
        picture?: string;
      };

      if (!googleId || !email) {
        throw new Error('Missing required user information from Google');
      }

      let user = await this.prisma.user.findUnique({ 
        where: { googleId } 
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            googleId,
            email,
            name: name || '',
            ...(picture && { avatar: picture }),
          },
        });
      }

      return user;
    } catch (error) {
      throw new Error(`Google authentication failed: ${error.message}`);
    }
  }
}