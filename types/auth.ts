// Authentication types
export type UserRole = 'PM' | 'TA' | 'Dev' | 'QA' | 'Stakeholder';

export interface User {
  _id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
  token: string;
}
