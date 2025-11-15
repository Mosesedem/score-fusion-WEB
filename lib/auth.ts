/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./db";
import { getAuthenticatedUserFromSession } from "./session";
import { sessionStore, rateLimit } from "./redis";
import { v4 as uuidv4 } from "uuid";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

export interface AppJWTPayload {
  userId: string;
  email?: string;
  isAdmin: boolean;
  guest: boolean;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface AuthResult {
  success: boolean;
  user?: any;
  token?: string;
  error?: string;
  sessionId?: string;
}

export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = "AuthError";
  }
}

// JWT Token management
export class TokenManager {
  static async generateToken(
    payload: Omit<AppJWTPayload, "iat" | "exp">
  ): Promise<string> {
    return new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(payload.guest ? "24h" : "7d")
      .sign(JWT_SECRET);
  }

  static async verifyToken(token: string): Promise<AppJWTPayload> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      return payload as unknown as AppJWTPayload;
    } catch (error) {
      throw new AuthError("Invalid or expired token", 401);
    }
  }
}

// Password utilities
export class PasswordManager {
  static async hash(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static validateStrength(password: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }

    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// User authentication
export class AuthService {
  // Sign up new user
  static async signup(data: {
    email: string;
    password: string;
    displayName: string;
    country?: string;
    dob?: Date;
    consents?: Record<string, boolean>;
  }): Promise<AuthResult> {
    try {
      // Rate limiting
      const rateLimitResult = await rateLimit.check(
        `signup:${data.email}`,
        5,
        3600000
      ); // 5 per hour
      if (!rateLimitResult.allowed) {
        throw new AuthError(
          "Too many signup attempts. Please try again later.",
          429
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new AuthError("Invalid email address", 400);
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });

      if (existingUser) {
        throw new AuthError("Email already registered", 400);
      }

      // Validate password strength
      const passwordValidation = PasswordManager.validateStrength(
        data.password
      );
      if (!passwordValidation.valid) {
        throw new AuthError(passwordValidation.errors.join(", "), 400);
      }

      // Age verification (at least 18 years old)
      if (data.dob) {
        const ageMs = Date.now() - data.dob.getTime();
        const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);
        if (ageYears < 18) {
          throw new AuthError(
            "You must be at least 18 years old to register",
            400
          );
        }
      }

      // Hash password
      const passwordHash = await PasswordManager.hash(data.password);
      // const isAdmin = user.role === "ADMIN";

      // Create user
      const user = await prisma.user.create({
        data: {
          email: data.email.toLowerCase(),
          passwordHash,
          displayName: data.displayName,
          profile: {
            create: {
              country: data.country,
              dob: data.dob,
              consents: data.consents,
            },
          },
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          profile: true,
        },
      });
      // Create session
      const sessionId = uuidv4();
      const isAdmin = user.role === "ADMIN";
      const sessionData = {
        userId: user.id,
        email: user.email,
        isAdmin,
        guest: false,
        loginTime: new Date().toISOString(),
        ipAddress: "", // Will be set in API route
        userAgent: "", // Will be set in API route
      };

      await sessionStore.setSession(sessionId, sessionData);

      // Generate JWT
      const token = await TokenManager.generateToken({
        userId: user.id,
        email: user.email || undefined,
        isAdmin,
        guest: false,
        sessionId,
      });

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date(), loginAttempts: 0 },
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          isAdmin,
          profile: user.profile,
        },
        token,
        sessionId,
      };
    } catch (error) {
      if (error instanceof AuthError) {
        return { success: false, error: error.message };
      }
      console.error("Signup error:", error);
      return { success: false, error: "Internal server error" };
    }
  }

  // Login user
  static async login(data: {
    email: string;
    password: string;
    rememberMe?: boolean;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuthResult> {
    try {
      // Rate limiting
      const rateLimitResult = await rateLimit.check(
        `login:${data.email}`,
        10,
        900000
      ); // 10 per 15 min
      if (!rateLimitResult.allowed) {
        throw new AuthError(
          "Too many login attempts. Please try again later.",
          429
        );
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
        include: { profile: true },
      });

      if (!user || !user.passwordHash) {
        throw new AuthError("Invalid email or password", 401);
      }

      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new AuthError(
          "Account temporarily locked. Please try again later.",
          423
        );
      }

      // Check if account is soft deleted
      if (user.deletedAt) {
        throw new AuthError("Account not found", 404);
      }

      // Verify password
      const isPasswordValid = await PasswordManager.verify(
        data.password,
        user.passwordHash
      );
      if (!isPasswordValid) {
        // Increment failed attempts
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            loginAttempts: { increment: 1 },
            lockedUntil:
              user.loginAttempts >= 4
                ? new Date(Date.now() + 15 * 60 * 1000)
                : undefined, // 15 min lock
          },
        });

        if (updatedUser.loginAttempts >= 5) {
          throw new AuthError(
            "Account locked due to too many failed attempts",
            423
          );
        }

        throw new AuthError("Invalid email or password", 401);
      }

      // Create session
      const sessionId = uuidv4();
      const sessionTTL = data.rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 24 hours
      const isAdmin = user.role === "ADMIN";
      const sessionData = {
        userId: user.id,
        email: user.email,
        isAdmin,
        guest: false,
        loginTime: new Date().toISOString(),
        ipAddress: data.ipAddress || "",
        userAgent: data.userAgent || "",
      };

      await sessionStore.setSession(sessionId, sessionData, sessionTTL);

      // Generate JWT
      const token = await TokenManager.generateToken({
        userId: user.id,
        email: user.email || undefined,
        isAdmin,
        guest: false,
        sessionId,
      });

      // Update last login and reset failed attempts
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          loginAttempts: 0,
          lockedUntil: null,
        },
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          isAdmin,
          profile: user.profile,
        },
        token,
        sessionId,
      };
    } catch (error) {
      if (error instanceof AuthError) {
        return { success: false, error: error.message };
      }
      console.error("Login error:", error);
      return { success: false, error: "Internal server error" };
    }
  }

  // Create guest session
  static async createGuestSession(data?: {
    deviceId?: string;
    platform?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuthResult> {
    try {
      const sessionId = uuidv4();
      const guestId = uuidv4();

      // Create guest user (not stored in database, only in session)
      const sessionData = {
        guestId,
        sessionId,
        guest: true,
        deviceId: data?.deviceId || "",
        platform: data?.platform || "",
        loginTime: new Date().toISOString(),
        ipAddress: data?.ipAddress || "",
        userAgent: data?.userAgent || "",
      };

      await sessionStore.setSession(sessionId, sessionData);

      // Generate JWT with shorter expiry for guests
      const token = await TokenManager.generateToken({
        userId: guestId,
        guest: true,
        isAdmin: false,
        sessionId,
      });

      return {
        success: true,
        user: {
          id: guestId,
          guest: true,
          displayName: "Guest",
        },
        token,
        sessionId,
      };
    } catch (error) {
      console.error("Guest session creation error:", error);
      return { success: false, error: "Failed to create guest session" };
    }
  }

  // Logout user
  static async logout(
    sessionId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await sessionStore.deleteSession(sessionId);
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: "Failed to logout" };
    }
  }

  // Get user from session
  static async getSession(sessionId: string): Promise<any | null> {
    try {
      return await sessionStore.getSession(sessionId);
    } catch (error) {
      console.error("Get session error:", error);
      return null;
    }
  }

  // Refresh session
  static async refreshSession(
    sessionId: string,
    ttl: number = 86400
  ): Promise<void> {
    try {
      await sessionStore.refreshSession(sessionId, ttl);
    } catch (error) {
      console.error("Refresh session error:", error);
    }
  }
}

// Middleware helper for API routes
export async function getAuthenticatedUser(request: Request): Promise<{
  user?: any;
  session?: any;
  error?: string;
}> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // Fallback to NextAuth session
      const sessionResult = await getAuthenticatedUserFromSession();
      if (sessionResult.user) {
        return sessionResult;
      }
      return { error: "No authorization header" };
    }

    const token = authHeader.substring(7);
    const payload = await TokenManager.verifyToken(token);

    // Get session
    const session = await AuthService.getSession(payload.sessionId);
    if (!session) {
      return { error: "Session not found" };
    }

    // For guest users, return session data
    if (payload.guest) {
      return {
        user: {
          id: payload.userId,
          guest: true,
          displayName: "Guest",
        },
        session,
      };
    }

    // For registered users, get from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { profile: true },
    });

    if (!user || user.deletedAt) {
      return { error: "User not found" };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        isAdmin: user.role === "ADMIN",
        profile: user.profile,
      },
      session,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return { error: "Authentication failed" };
  }
}

// Admin authentication check
export async function requireAdmin(request: Request): Promise<{
  user?: any;
  session?: any;
  error?: string;
}> {
  const result = await getAuthenticatedUser(request);

  if (result.error) {
    return result;
  }

  if (!result.user?.isAdmin) {
    return { error: "Admin access required" };
  }

  return result;
}
