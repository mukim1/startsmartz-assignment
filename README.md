# MERN Stack Video Upload & Management System

A full-stack application that allows authenticated users to upload large video files (up to 1GB) using streaming. Built with MongoDB, Express, React, and Node.js (MERN stack).

## Live Demo

- **Frontend**: [https://startsmartz-assignment.vercel.app/](https://startsmartz-assignment.vercel.app/)
- **Backend API**: [https://b118-65-0-125-156.ngrok-free.app/](https://b118-65-0-125-156.ngrok-free.app/)

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
- Deployed on AWS EC2

### Frontend
- React with TypeScript
- React Router for navigation
- React Hook Form for form handling
- React Query for data fetching
- Zod for validation
- Axios for API requests
- Pure CSS for styling (no UI frameworks)
- Deployed on Vercel

## Deployment Architecture

This application uses a modern cloud-based deployment architecture:

1. **Frontend**: Deployed on Vercel for optimal performance and global CDN distribution
2. **Backend API**: Hosted on AWS EC2 instance, exposed via ngrok for secure tunneling
3. **Database**: MongoDB for flexible, schema-less data storage
4. **File Storage**: AWS S3 for scalable and reliable video file storage
5. **Authentication**: JWT-based authentication for secure user sessions

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

## Local Development Setup

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
VITE_API_URL=http://localhost:5000/api
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
npm run dev
```

7. Open your browser and navigate to http://localhost:5173

### Example Test User

Email: test@example.com  
Password: password123

## Deployment Instructions

### Backend Deployment (AWS EC2)
1. Set up an EC2 instance with Node.js installed
2. Configure security groups to allow traffic on port 5000
3. Clone the repository to the EC2 instance
4. Set up environment variables in the .env file
5. Install dependencies and build the application
6. Use PM2 or a similar tool to keep the application running
7. (Optional) Set up ngrok for secure tunneling if you don't have a domain

### Frontend Deployment (Vercel)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in the Vercel dashboard
3. Set the build command to `npm run build`
4. Set the output directory to `dist`
5. Deploy the application

### S3 Setup for Video Storage
1. Create an S3 bucket with appropriate permissions
2. Configure CORS settings to allow uploads from your frontend domain
3. Create an IAM user with appropriate S3 permissions
4. Use the generated access keys in your environment variables

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