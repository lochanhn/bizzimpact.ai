import { loggedRoute } from '@/lib/server/http';
import { session } from '@/lib/auth/handlers';
export const GET=loggedRoute('/api/auth/session',session);
