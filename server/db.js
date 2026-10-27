import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGO_URI ||
      'mongodb://127.0.0.1:27017/tanvi_projects';

    try {
      await mongoose.connect(mongoURI, {
        dbName: 'tanvi_projects',
      });
    } catch (primaryError) {
      if (mongoURI !== 'mongodb://127.0.0.1:27017/tanvi_projects') {
        console.warn(`Primary MongoDB failed (${primaryError.message}), falling back to local MongoDB...`);
        await mongoose.connect('mongodb://127.0.0.1:27017/tanvi_projects', {
          dbName: 'tanvi_projects',
        });
      } else {
        throw primaryError;
      }
    }

    console.log('MongoDB connected successfully');
    console.log('Database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

export default connectDB;