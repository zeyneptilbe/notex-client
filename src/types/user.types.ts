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
  roleId: string;
  title?: string;
}
