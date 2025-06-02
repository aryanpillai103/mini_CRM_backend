/* eslint-disable */
import { Controller, Get, Post, Req, UseGuards, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedRequest } from './auth.interface';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {} // Add this constructor

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(@Req() req: AuthenticatedRequest) {
    return req.user;
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getCurrentUser(@Req() req: AuthenticatedRequest) {
    return req.user;
  }

  @Get('logout')
  logout(@Req() req: AuthenticatedRequest) {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
      }
    });
    return { message: 'Logged out successfully' };
  }

  @Post('google')
  async googleAuth(@Body() body: { token: string }) {
    return this.authService.googleLogin(body.token);
  }
}