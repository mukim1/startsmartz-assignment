# MERN Stack Video Upload & Management System

A full-stack application that allows authenticated users to upload large video files (up to 1GB) using streaming. Built with MongoDB, Express, React, and Node.js (MERN stack).

## Features

- User authentication (signup & login) with JWT
- Secure route protection
- Large video file uploads (up to 1GB) using streaming
- Client-side drag-and-drop file upload interface
- Real-time upload progress tracking
- Ability to cancel uploads in progress
- Video management (view, delete)
- Responsive UI with pure CSS (no UI frameworks)

## Technology Stack

### Backend
- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- JSON Web Tokens (JWT) for authentication
- Zod for validation
- AWS S3 for video storage
- Multipart upload for efficient large file handling

### Frontend
- React with TypeScript
- React Router for navigation
- React Hook Form for form handling
- React Query for data fetching
- Zod for validation
- Axios for API requests
- Pure CSS for styling (no UI frameworks)

## S3 Multipart Upload Architecture

This application uses a client-direct-to-S3 multipart upload approach:

1. The client initiates an upload by sending video metadata to the server
2. The server creates an S3 multipart upload and returns the uploadId to the client
3. For each chunk:
   - The client requests a presigned URL from the server
   - The client uploads the chunk directly to S3 using the presigned URL
   - The client reports the successful part upload to the server
4. After all chunks are uploaded, the client requests the server to complete the multipart upload
5. The server completes the upload in S3 and marks the video as complete in the database

This approach:
- Reduces server load by bypassing the application server for file data
- Handles network interruptions with resumable uploads
- Improves performance with parallel chunk uploads
- Scales well for concurrent users
- Keeps security intact by requiring authentication for presigned URL generation

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- AWS account with S3 bucket
- Git

### Environment Variables

#### Backend (.env file in /server directory)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/video-upload
JWT_SECRET=your_jwt_secret
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
S3_BUCKET_NAME=your_s3_bucket_name
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env file in /client directory)
```
REACT_APP_API_URL=http://localhost:5000/api
```

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/video-upload-system.git
cd video-upload-system
```

2. Install backend dependencies
```bash
cd server
npm install
```

3. Install frontend dependencies
```bash
cd ../client
npm install
```

4. Start MongoDB (if running locally)
```bash
mongod
```

5. Start the backend server
```bash
cd ../server
npm run dev
```

6. Start the frontend development server
```bash
cd ../client
npm start
```

7. Open your browser and navigate to http://localhost:3000

### Example Test User

Email: test@example.com  
Password: password123

## Project Structure

```
project-root/
├── client/                # React frontend (TypeScript)
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React context (Auth)
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── styles/        # CSS styles
│   │   ├── types/         # TypeScript interfaces/types
│   │   ├── validation/    # Zod schemas
│   │   └── App.tsx        # Main application component
│   └── package.json
│
├── server/                # Node.js/Express backend (TypeScript)
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # Express routes
│   │   ├── services/      # Business logic services
│   │   ├── types/         # TypeScript interfaces/types
│   │   ├── validation/    # Zod schemas
│   │   └── index.ts       # Entry point
│   └── package.json
│
└── README.md
```