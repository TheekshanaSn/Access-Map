import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User, IUserDocument, UserRole } from '../models/user.model';
import { isDatabaseConnected } from '../config/database';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
  toJSON(): { id: string; name: string; email: string; role: UserRole; createdAt: Date };
}

// Preserve default Mongoose model methods to detect test stubs
export const defaultUserFindOne = User.findOne;
export const defaultUserCreate = User.create;
export const defaultUserFindById = User.findById;

// In-Memory Development User Store (active whenever MongoDB is offline)
const inMemoryUsers: UserRecord[] = [];

// Seed default accounts for instant local testing without DB
const defaultSeedAccounts = [
  {
    name: 'AccessMap Administrator',
    email: 'admin@accessmap.org',
    password: 'AdminPassword123!',
    role: 'admin' as UserRole,
  },
  {
    name: 'Accessibility Moderator',
    email: 'moderator@accessmap.org',
    password: 'ModeratorPassword123!',
    role: 'moderator' as UserRole,
  },
  {
    name: 'Sample Community User',
    email: 'user@accessmap.org',
    password: 'UserPassword123!',
    role: 'user' as UserRole,
  },
];

let seedPromise: Promise<void> | null = null;
export const ensureSeeded = async (): Promise<void> => {
  if (!seedPromise) {
    seedPromise = (async () => {
      for (const acc of defaultSeedAccounts) {
        const hash = await bcrypt.hash(acc.password, 10);
        createUserRecord({
          id: `dev-user-${inMemoryUsers.length + 1}`,
          name: acc.name,
          email: acc.email,
          passwordHash: hash,
          role: acc.role,
        });
      }
    })();
  }
  return seedPromise;
};

// Start background seeding
ensureSeeded().catch(console.error);

function createUserRecord(data: {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}): UserRecord {
  const record: UserRecord = {
    id: data.id,
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    role: data.role,
    createdAt: new Date(),
    updatedAt: new Date(),
    async comparePassword(candidate: string): Promise<boolean> {
      return bcrypt.compare(candidate, this.passwordHash);
    },
    toJSON() {
      return {
        id: this.id,
        name: this.name,
        email: this.email,
        role: this.role,
        createdAt: this.createdAt,
      };
    },
  };
  inMemoryUsers.push(record);
  return record;
}

export const findUserByEmail = async (email: string): Promise<UserRecord | IUserDocument | null> => {
  // If DB is connected or User.findOne was stubbed in tests:
  if (isDatabaseConnected() || User.findOne !== defaultUserFindOne) {
    try {
      const query: any = User.findOne({ email });
      const result = query && typeof query.select === 'function' ? await query.select('+passwordHash') : await query;
      return result || null;
    } catch (err: any) {
      console.warn('[UserStore] Database findOne query failed or timed out. Falling back to in-memory store:', err?.message || err);
    }
  }

  // Fallback to in-memory development store
  await ensureSeeded();
  const normalized = email.toLowerCase().trim();
  const found = inMemoryUsers.find((u) => u.email.toLowerCase() === normalized);
  return found || null;
};

export const findUserById = async (id: string): Promise<UserRecord | IUserDocument | null> => {
  if (isDatabaseConnected() || User.findById !== defaultUserFindById) {
    try {
      const result = await User.findById(id);
      return result || null;
    } catch (err: any) {
      console.warn('[UserStore] Database findById query failed or timed out. Falling back to in-memory store:', err?.message || err);
    }
  }

  await ensureSeeded();
  const found = inMemoryUsers.find((u) => u.id === id);
  return found || null;
};

export const createUser = async (data: {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}): Promise<UserRecord | IUserDocument> => {
  if (isDatabaseConnected() || User.create !== defaultUserCreate) {
    try {
      return await User.create(data);
    } catch (err: any) {
      console.warn('[UserStore] Database create failed or timed out. Falling back to in-memory store:', err?.message || err);
    }
  }

  await ensureSeeded();
  const newId = new mongoose.Types.ObjectId().toString();
  return createUserRecord({
    id: newId,
    name: data.name,
    email: data.email.toLowerCase().trim(),
    passwordHash: data.passwordHash,
    role: data.role,
  });
};

export const findUsersInStore = async (
  options: { page?: number; limit?: number; search?: string } = {}
): Promise<{ users: any[]; total: number; page: number; totalPages: number }> => {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(options.limit) || 20));
  const skip = (page - 1) * limit;

  if (isDatabaseConnected()) {
    try {
      const query: any = {};
      if (options.search) {
        query.$or = [
          { name: { $regex: options.search, $options: 'i' } },
          { email: { $regex: options.search, $options: 'i' } },
        ];
      }
      const [users, total] = await Promise.all([
        User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
        User.countDocuments(query),
      ]);
      return {
        users: users.map((u) => u.toJSON()),
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
      };
    } catch {
      // Fallback
    }
  }

  await ensureSeeded();
  let results = [...inMemoryUsers];
  if (options.search) {
    const s = options.search.toLowerCase();
    results = results.filter((u) => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
  }

  results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const total = results.length;
  const paginated = results.slice(skip, skip + limit);

  return {
    users: paginated.map((u) => u.toJSON()),
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const countUsersInStore = async (): Promise<number> => {
  if (isDatabaseConnected()) {
    try {
      return await User.countDocuments();
    } catch {
      // Fallback
    }
  }

  await ensureSeeded();
  return inMemoryUsers.length;
};

export const updateUserRoleInStore = async (
  userId: string,
  newRole: UserRole
): Promise<UserRecord | IUserDocument | null> => {
  if (isDatabaseConnected()) {
    try {
      const user = await User.findByIdAndUpdate(userId, { role: newRole }, { new: true });
      if (user) return user;
    } catch {
      // Fallback
    }
  }

  await ensureSeeded();
  const user = inMemoryUsers.find((u) => u.id === userId);
  if (!user) return null;
  user.role = newRole;
  user.updatedAt = new Date();
  return user;
};
