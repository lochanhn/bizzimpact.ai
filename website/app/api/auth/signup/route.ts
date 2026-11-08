import { loggedRoute } from '@/lib/server/http';
import { signup } from '@/lib/auth/handlers';
export const POST=loggedRoute('/api/auth/signup',signup);
