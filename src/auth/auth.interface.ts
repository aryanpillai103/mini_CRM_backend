/* eslint-disable */
import { Request } from 'express';

export interface User {
  id: string;
  email: string;
  name?: string;
  // Add other user properties as needed
}

export interface AuthenticatedRequest extends Request {
  user: User;
  // logout is already properly typed in the parent Request interface
}