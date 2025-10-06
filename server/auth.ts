import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "@shared/schema";

// Environment-based admin credentials
const ENV_ADMINS = [
  {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    id: 'env-admin'
  },
  {
    email: process.env.SUPERADMIN_EMAIL,
    password: process.env.SUPERADMIN_PASSWORD,
    role: 'superadmin',
    firstName: 'Super',
    lastName: 'Admin',
    id: 'env-superadmin'
  }
].filter(admin => admin.email && admin.password);

// Middleware to check if user is authenticated
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Check if it's an environment-based admin user
    const envAdmin = ENV_ADMINS.find(admin => admin.id === req.session.userId);
    if (envAdmin) {
      (req as any).user = {
        id: envAdmin.id,
        email: envAdmin.email,
        firstName: envAdmin.firstName,
        lastName: envAdmin.lastName,
        role: envAdmin.role,
        isActive: true
      };
      return next();
    }

    // Fetch user data from database
    const [user] = await db.select().from(users).where(eq(users.id, req.session.userId)).limit(1);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    (req as any).user = user;
    return next();
  } catch (error) {
    console.error("Error fetching user for authentication:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Middleware to check if user has specific role
export const hasRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Check if it's an environment-based admin user first
      const envAdmin = ENV_ADMINS.find(admin => admin.id === req.session.userId);
      if (envAdmin) {
        if (!roles.includes(envAdmin.role)) {
          return res.status(403).json({ message: "Forbidden" });
        }
        req.user = {
          id: envAdmin.id,
          email: envAdmin.email,
          firstName: envAdmin.firstName,
          lastName: envAdmin.lastName,
          role: envAdmin.role,
          isActive: true
        };
        return next();
      }

      // Check database users
      const user = await db.select().from(users).where(eq(users.id, req.session.userId!)).limit(1);
      
      if (!user.length || !roles.includes(user[0].role || '')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      req.user = user[0];
      return next();
    } catch (error) {
      console.error("Error checking user role:", error);
      return res.status(500).json({ message: "Server error" });
    }
  };
};

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

// Compare password
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Check environment-based admin credentials
export const checkEnvAdminCredentials = (email: string, password: string) => {
  const admin = ENV_ADMINS.find(a => a.email === email);
  if (admin && admin.password === password) {
    return {
      id: admin.id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      role: admin.role,
      isActive: true
    };
  }
  return null;
};

// Set up session types
declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}