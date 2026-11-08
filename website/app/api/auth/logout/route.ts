import { loggedRoute } from '@/lib/server/http';
import { logout } from '@/lib/auth/handlers';
export const POST=loggedRoute('/api/auth/logout',logout);
