import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from "./routes/authRoutes";
import videoRoutes from "./routes/videoRoutes";

// Initialize Express app
const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Note: Vite uses 5173 by default
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);

  res.status(500).json({
    message: "Server error",
    error: process.env.NODE_ENV === "production" ? {} : err.message,
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

// console.log("Trying to connect to mongodb")
// mongoose
//   .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/video-upload')
//   .then(() => {
//     console.log('Connected to MongoDB');

//     app.listen(PORT, () => {
//       console.log(`Server running on port ${PORT}`);
//     });
//   })
//   .catch((error) => {
//     console.error('MongoDB connection error:', error);
//   });

async function connectToDatabase(retries = 5) {
  const startTime = performance.now();

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`MongoDB connection attempt ${attempt}/${retries}...`);

      await mongoose.connect(
        process.env.MONGODB_URI || "mongodb://localhost:27017/video-upload",
        {
          connectTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          serverSelectionTimeoutMS: 5000,
          family: 4,
          maxPoolSize: 10,
          minPoolSize: 5,
        }
      );

      const connectionTime = (performance.now() - startTime).toFixed(2);
      console.log(`Connected to MongoDB in ${connectionTime}ms`);
      return true;
    } catch (error:any) {
      console.error(`Connection attempt ${attempt} failed:`, error.message);

      if (attempt === retries) {
        const failTime = (performance.now() - startTime).toFixed(2);
        console.error(
          `All ${retries} connection attempts failed after ${failTime}ms`
        );
        throw error;
      }

      // Wait before next retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// Use the function
connectToDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to the database:", error);
    process.exit(1); // Exit with error
  });
