// user.types.ts

export const UserRole = {
  Employee: 0,
  TeamLead: 1,
  UnitManager: 2,
  SuperAdmin: 3,
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  title?: string;
  profileImageUrl?: string;
  bio?: string;
  role: UserRole;
  teamId: string;
  teamName: string;
  unitName: string;
  createdAt: string;
  postCount: number;
  commentCount: number;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isCurrentUser: boolean;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  teamId: string;
  role: UserRole;
  title?: string;
}
