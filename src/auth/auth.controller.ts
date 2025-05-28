import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedRequest } from './auth.interface'; // Adjust the import path

@Controller('auth')
export class AuthController {
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
        // Handle error if needed
        console.error('Logout error:', err);
      }
    });
    return { message: 'Logged out successfully' };
  }
}