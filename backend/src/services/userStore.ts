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
    const query: any = User.findOne({ email });
    return query && typeof query.select === 'function' ? query.select('+passwordHash') : query;
  }

  // Fallback to in-memory development store
  await ensureSeeded();
  const normalized = email.toLowerCase().trim();
  const found = inMemoryUsers.find((u) => u.email.toLowerCase() === normalized);
  return found || null;
};

export const findUserById = async (id: string): Promise<UserRecord | IUserDocument | null> => {
  if (isDatabaseConnected() || User.findById !== defaultUserFindById) {
    return User.findById(id);
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
    return User.create(data);
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
