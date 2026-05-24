import crypto from 'crypto';
import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { generateToken, hashPassword, comparePassword } from '../utils/helpers';
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../utils/validators';
import { config } from '../config';

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = signupSchema.parse(req.body);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (existingUser) {
      const field = existingUser.email === data.email ? 'email' : 'username';
      res.status(409).json({ error: `User with this ${field} already exists` });
      return;
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const token = generateToken({ userId: user.id, role: user.role });

    res.status(201).json({
      message: 'Account created successfully',
      user,
      token,
    });
  } catch (error: any) {
    if (error?.issues) {
      res.status(400).json({ error: 'Invalid input', details: error.issues });
      return;
    }
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isValid = await comparePassword(data.password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken({ userId: user.id, role: user.role });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      token,
    });
  } catch (error: any) {
    if (error?.issues) {
      res.status(400).json({ error: 'Invalid input', details: error.issues });
      return;
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { googleId, email, username, avatarUrl } = req.body;

    if (!googleId || !email) {
      res.status(400).json({ error: 'Missing Google profile data' });
      return;
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId }, { email }],
      },
    });

    if (user) {
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, avatarUrl: avatarUrl || user.avatarUrl },
        });
      }
    } else {
      const baseUsername = username || email.split('@')[0];
      let finalUsername = baseUsername;
      let counter = 1;
      while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
        finalUsername = `${baseUsername}${counter}`;
        counter++;
      }

      user = await prisma.user.create({
        data: {
          username: finalUsername,
          email,
          googleId,
          avatarUrl,
        },
      });
    }

    const token = generateToken({ userId: user.id, role: user.role });

    res.json({
      message: 'Google login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      token,
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const discordAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { discordId, email, username, avatarUrl } = req.body;

    if (!discordId || !email) {
      res.status(400).json({ error: 'Missing Discord profile data' });
      return;
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ discordId }, { email }],
      },
    });

    if (user) {
      if (!user.discordId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { discordId, avatarUrl: avatarUrl || user.avatarUrl },
        });
      }
    } else {
      const baseUsername = username || email.split('@')[0];
      let finalUsername = baseUsername;
      let counter = 1;
      while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
        finalUsername = `${baseUsername}${counter}`;
        counter++;
      }

      user = await prisma.user.create({
        data: {
          username: finalUsername,
          email,
          discordId,
          avatarUrl,
        },
      });
    }

    const token = generateToken({ userId: user.id, role: user.role });

    res.json({
      message: 'Discord login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      token,
    });
  } catch (error) {
    console.error('Discord auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        bannerUrl: true,
        role: true,
        points: true,
        kills: true,
        deaths: true,
        matchesPlayed: true,
        wins: true,
        clanId: true,
        clanRole: true,
        clan: {
          select: {
            id: true,
            name: true,
            tag: true,
            logoUrl: true,
          },
        },
        createdAt: true,
      },
    });

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const supabaseAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { supabaseId, email, username, avatarUrl } = req.body;

    if (!supabaseId || !email) {
      res.status(400).json({ error: 'Missing Supabase profile data' });
      return;
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ supabaseId }, { email }],
      },
    });

    if (user) {
      if (!user.supabaseId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { supabaseId, avatarUrl: avatarUrl || user.avatarUrl },
        });
      }
    } else {
      const baseUsername = username || email.split('@')[0];
      let finalUsername = baseUsername;
      let counter = 1;
      while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
        finalUsername = `${baseUsername}${counter}`;
        counter++;
      }

      user = await prisma.user.create({
        data: {
          username: finalUsername,
          email,
          supabaseId,
          avatarUrl,
        },
      });
    }

    const token = generateToken({ userId: user.id, role: user.role });

    res.json({
      message: 'Authentication successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        bannerUrl: user.bannerUrl,
        points: user.points,
        kills: user.kills,
        deaths: user.deaths,
        matchesPlayed: user.matchesPlayed,
        wins: user.wins,
        clanId: user.clanId,
        clanRole: user.clanRole,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error('Supabase auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    const resetUrl = `${config.frontendUrl}/auth/reset-password?token=${resetToken}`;

    if (config.isDev) {
      console.log(`\n🔐 Password reset link for ${email}:`);
      console.log(`   ${resetUrl}\n`);
    }

    res.json({
      message: 'If an account with that email exists, a reset link has been sent.',
      ...(config.isDev && { resetUrl }),
    });
  } catch (error: any) {
    if (error?.issues) {
      res.status(400).json({ error: 'Invalid input', details: error.issues });
      return;
    }
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      res.status(400).json({ error: 'Invalid or expired reset token' });
      return;
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    res.json({ message: 'Password reset successful. You can now sign in with your new password.' });
  } catch (error: any) {
    if (error?.issues) {
      res.status(400).json({ error: 'Invalid input', details: error.issues });
      return;
    }
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, avatarUrl, bannerUrl } = req.body;

    if (username) {
      const existing = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: req.user!.id },
        },
      });
      if (existing) {
        res.status(409).json({ error: 'Username already taken' });
        return;
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(username && { username }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(bannerUrl !== undefined && { bannerUrl }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        bannerUrl: true,
        role: true,
      },
    });

    res.json({ message: 'Profile updated', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
