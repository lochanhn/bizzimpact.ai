import { loggedRoute } from '@/lib/server/http';
import { login } from '@/lib/auth/handlers';
export const POST=loggedRoute('/api/auth/login',login);
