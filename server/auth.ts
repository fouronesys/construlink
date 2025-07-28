import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "@shared/schema";

// Middleware to check if user is authenticated
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Fetch user data and attach to request
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