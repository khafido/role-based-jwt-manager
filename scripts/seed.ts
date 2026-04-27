import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User, { Role, RoleType } from '../src/models/user.model.js';
import logger from '../src/utils/logger.js';

// Load environment variables
dotenv.config();

/**
 * Seed users for testing and development
 */
interface SeedUser {
  email: string;
  password: string;
  role: RoleType;
}

/**
 * Default seed users
 */
const defaultSeedUsers: SeedUser[] = [
  {
    email: 'admin@example.com',
    password: 'Admin@123456',
    role: Role.ADMIN
  },
  {
    email: 'user@example.com',
    password: 'User@123456',
    role: Role.USER
  },
  {
    email: 'mentor@example.com',
    password: 'Mentor@123456',
    role: Role.MENTOR
  },
  {
    email: 'test@example.com',
    password: 'Test@123456',
    role: Role.USER
  }
];

/**
 * Connect to database
 */
const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/role-based-jwt-manager';
    
    await mongoose.connect(mongoURI);
    logger.info('Connected to MongoDB for seeding');
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

/**
 * Disconnect from database
 */
const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('MongoDB disconnection failed:', error);
  }
};

/**
 * Validate password strength using regex
 */
const validatePasswordStrength = (password: string): boolean => {
  // Password must be at least 8 characters long
  // Must contain at least one uppercase letter
  // Must contain at least one lowercase letter
  // Must contain at least one number
  // Must contain at least one special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  
  return passwordRegex.test(password);
};

/**
 * Get password strength requirements
 */
const getPasswordRequirements = (): string => {
  return `Password must contain:
  - At least 8 characters
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one number (0-9)
  - At least one special character (@$!%*?&)`;
};

/**
 * Hash password
 */
const hashPassword = async (password: string): Promise<string> => {
  // Validate password strength before hashing
  if (!validatePasswordStrength(password)) {
    throw new Error(`Password does not meet security requirements.\n${getPasswordRequirements()}`);
  }
  
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Seed users into database
 */
const seedUsersToDatabase = async (): Promise<void> => {
  try {
    logger.info('Starting user seeding process...');
    
    // Clear existing users (optional - uncomment if you want to start fresh)
    if (process.env.SEED_CLEAR_EXISTING === 'true') {
      await User.deleteMany({});
      logger.info('Cleared existing users');
    }

    // Create users
    const createdUsers: any[] = [];
    
    for (const userData of defaultSeedUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        
        if (existingUser) {
          logger.info(`User ${userData.email} already exists, skipping...`);
          createdUsers.push(existingUser);
          continue;
        }

        // Hash password
        const hashedPassword = await hashPassword(userData.password);
        
        // Create user
        const user = await User.create({
          email: userData.email,
          password: hashedPassword,
          role: userData.role
        });

        logger.info(`Created user: ${user.email} (${user.role})`);
        createdUsers.push(user);
      } catch (error) {
        logger.error(`Failed to create user ${userData.email}:`, error);
      }
    }

    // Display summary
    logger.info(`\n🎉 Seeding completed! Created/updated ${createdUsers.length} users:\n`);
    
    createdUsers.forEach((user: any, index: number) => {
      logger.info(`${index + 1}. ${user.email} - Role: ${user.role}`);
    });

    // Display login credentials
    logger.info(`\n📝 Login Credentials:\n`);
    defaultSeedUsers.forEach((user, index) => {
      logger.info(`${index + 1}. Email: ${user.email}`);
      logger.info(`   Password: ${user.password}`);
      logger.info(`   Role: ${user.role}`);
      logger.info(`   ---`);
    });

  } catch (error) {
    logger.error('Seeding failed:', error);
    throw error;
  }
};

/**
 * Seed additional test data
 */
const seedTestData = async (): Promise<void> => {
  try {
    // This can be expanded to seed other test data
    // like posts, products, etc. in the future
    logger.info('Test data seeding completed');
  } catch (error) {
    logger.error('Test data seeding failed:', error);
  }
};

/**
 * Main seeding function
 */
const seed = async (): Promise<void> => {
  try {
    logger.info('🌱 Starting database seeding...\n');
    
    await connectDB();
    await seedUsersToDatabase();
    await seedTestData();
    
    logger.info('\n✅ Database seeding completed successfully!');
    
  } catch (error) {
    logger.error('\n❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
};

/**
 * Seed with specific options
 */
const seedWithOptions = async (options: {
  clearExisting?: boolean;
  usersOnly?: boolean;
}): Promise<void> => {
  try {
    logger.info('🌱 Starting database seeding with options...', options);
    
    // Override environment variable if option is provided
    if (options.clearExisting !== undefined) {
      process.env.SEED_CLEAR_EXISTING = options.clearExisting.toString();
    }
    
    await connectDB();
    
    if (options.usersOnly !== true) {
      await seedTestData();
    }
    
    await seedUsersToDatabase();
    
    logger.info('\n✅ Database seeding completed successfully!');
    
  } catch (error) {
    logger.error('\n❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
};

/**
 * Clear all users (dangerous operation)
 */
const clearUsers = async (): Promise<void> => {
  try {
    logger.warn('⚠️  WARNING: This will delete all users from the database!');
    
    // Add confirmation prompt in production
    if (process.env.NODE_ENV === 'production') {
      logger.error('Cannot clear users in production environment');
      process.exit(1);
    }
    
    await connectDB();
    
    const deletedCount = await User.deleteMany({});
    logger.info(`Deleted ${deletedCount.deletedCount} users`);
    
  } catch (error) {
    logger.error('Failed to clear users:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
};

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'seed':
    seed();
    break;
  case 'seed:users':
    seedWithOptions({ usersOnly: true });
    break;
  case 'seed:clear':
    clearUsers();
    break;
  case 'seed:fresh':
    seedWithOptions({ clearExisting: true });
    break;
  default:
    logger.info('Usage:');
    logger.info('  npm run seed              - Seed all data');
    logger.info('  npm run seed:users        - Seed only users');
    logger.info('  npm run seed:fresh         - Clear existing and seed fresh data');
    logger.info('  npm run seed:clear         - Clear all users (development only)');
    break;
}

export { seed, clearUsers, seedWithOptions };
