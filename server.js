import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

// Debug: Log start of server initialization
console.log('Starting server initialization...');

// Load environment variables
dotenv.config();

// Ensure required environment variables are set
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize express
const app = express();

// Configure CORS
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      // Add other allowed origins here
    ];
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept'
  ]
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
try {
  // Import route files
  const statusRoutes = (await import('./routes/statuses.js')).default;
  const authRoutes = (await import('./routes/auth.js')).default;
  const formRoutes = (await import('./routes/forms.js')).default;
  const todoRoutes = (await import('./routes/todos.js')).default;
  const formCategoryRoutes = (await import('./routes/formCategories.js')).default;
  const formSubCategoryRoutes = (await import('./routes/formSubCategories.js')).default;

  // Mount routes
  app.use('/api/statuses', statusRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/forms', formRoutes);
  app.use('/api/todos', todoRoutes);
  app.use('/api/form-categories', formCategoryRoutes);
  app.use('/api/form-subcategories', formSubCategoryRoutes);
  
  console.log('All routes imported successfully');
} catch (err) {
  console.error('Error importing routes:', err);
  process.exit(1);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Server Error' 
  });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/turfs';
    console.log(`🔗 Connecting to MongoDB: ${mongoURI.split('@').pop() || mongoURI}`);
    
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // List all collections in the database
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('📂 Collections in database:');
    collections.forEach(collection => console.log(`- ${collection.name}`));
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('Error details:', {
      name: error.name,
      code: error.code,
      codeName: error.codeName,
    });
    process.exit(1);
  }
};

// Function to create a test user if it doesn't exist
const createTestUser = async () => {
  try {
    const User = (await import('./models/User.js')).default;
    
    // Check if test user already exists
    let user = await User.findOne({ email: 'test@example.com' });
    
    if (!user) {
      // Create test user
      user = new User({
        name: 'Test User',
        email: 'g@gmail.com',
        password: 'g@gmail.com',
        role: 'admin'
      });
      
      // Hash password before saving
      await user.save();
      console.log('✅ Created test user (test@example.com / password123)');
    } else {
      console.log('ℹ️  Test user already exists');
    }
    
    return user;
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    return null;
  }
};

// Function to create a test todo
const createTestTodo = async (userId) => {
  try {
    const Todo = (await import('./models/Todo.js')).default;
    
    // Check if we already have a test todo
    const existingTodo = await Todo.findOne({ jobDetails: 'Test Todo - Can be deleted' });
    
    if (!existingTodo) {
      const testTodo = new Todo({
        jobDetails: 'Test Todo - Can be deleted',
        status: 'pending',
        createdBy: new mongoose.Types.ObjectId(), // Using a dummy user ID for testing
      });
      
      await testTodo.save();
      console.log('✅ Created test todo');
      
      // Verify the todo was created
      const count = await Todo.countDocuments();
      console.log(`📊 Total todos in database: ${count}`);
    } else {
      console.log('ℹ️  Test todo already exists');
    }
  } catch (error) {
    console.error('❌ Error creating test todo:', error.message);
  }
};

// Start the server
const startServer = async () => {
  try {
    // Connect to the database
    await connectDB();
    
    // Create test user and get the user ID
    const testUser = await createTestUser();
    
    if (!testUser) {
      throw new Error('Failed to create test user');
    }
    
    // Create a test todo with the test user's ID
    await createTestTodo(testUser._id);

    // Get the port from environment variables or use 5000 as default
    const PORT = process.env.PORT || 5000;
    const HOST = process.env.HOST || '0.0.0.0';

    // Start the server
    const server = app.listen(PORT, HOST, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on http://${HOST}:${PORT}`);
      console.log(`API Base URL: http://${HOST}:${PORT}/api`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', err);
      server.close(() => process.exit(1));
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      // Handle specific listen errors with friendly messages
      switch (error.code) {
        case 'EACCES':
          console.error(`Port ${PORT} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`Port ${PORT} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
