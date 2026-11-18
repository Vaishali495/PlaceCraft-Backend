import type { UserRole } from "../utils/enums.js";

export interface AuthUserPayload {
  id: string;
  role: UserRole;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}