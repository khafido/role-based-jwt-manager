import mongoose from 'mongoose';
import logger from '@/utils/logger';

const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      logger.warn('MONGO_URI is not defined. Skipping database connection for now.');
      return;
    }

    const conn = await mongoose.connect(mongoUri);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Database Connection Error: ${error.message}`);
    } else {
      logger.error('An unknown error occurred during database connection');
    }
    process.exit(1);
  }
};

export default connectDB;
