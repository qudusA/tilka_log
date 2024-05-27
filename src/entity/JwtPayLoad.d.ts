export interface JwtPayload {
  userId: string;
  email: string;
  isUserVerified: boolean;
  role: string;
}
