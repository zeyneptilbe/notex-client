// user.types.ts

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  title?: string;
  profileImageUrl?: string;
  bio?: string;
  roleId: string;
  roleName: string;
  teamId?: string | null;
  teamName?: string | null;
  unitName: string;
  unitId: string;
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
  teamId?: string;
  unitId?: string;
  roleId: string;
  title?: string;
}
