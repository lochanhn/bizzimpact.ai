import { loggedRoute } from '@/lib/server/http';
import { getProfile,saveProfile } from '@/lib/auth/handlers';
export const GET=loggedRoute('/api/account/profile',getProfile);
export const PUT=loggedRoute('/api/account/profile',saveProfile);
