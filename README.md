# Pet Share - Pet Adoption Platform

A full-stack MERN application for pet adoption services.

## Features

- User authentication with JWT
- Pet listing and management
- Image upload using AWS S3
- Adoption request system
- Responsive Material-UI design

## Prerequisites

- Node.js and npm
- MongoDB Atlas account
- AWS S3 bucket and credentials

## Setup Instructions

1. Clone the repository
2. Set up environment variables:

### Server Setup (.env)
```
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_BUCKET_NAME=your_s3_bucket_name
AWS_REGION=your_aws_region
```

### Client Setup (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_S3_URL=your_s3_bucket_url
```

3. Install dependencies:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

4. Run the application:

```bash
# Run server (from server directory)
npm run dev

# Run client (from client directory)
npm start
```

5. Seed the database (optional):

```bash
# From server directory
npm run seed
```

## Default Users (after seeding)

- Admin User:
  - Email: admin@petshare.com
  - Password: admin123

- Regular User:
  - Email: john@example.com
  - Password: password123

## API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user

### Pets
- GET /api/pets - Get all pets
- GET /api/pets/:id - Get single pet
- POST /api/pets - Create new pet (with image)
- PATCH /api/pets/:id - Update pet
- DELETE /api/pets/:id - Delete pet

### Adoptions
- GET /api/adoptions - Get all adoption requests
- POST /api/adoptions - Create adoption request
- PATCH /api/adoptions/:id - Update adoption status

## Tech Stack

- Frontend:
  - React
  - Material-UI
  - React Router
  - Axios
  - React Toastify

- Backend:
  - Node.js
  - Express
  - MongoDB
  - JWT
  - AWS S3
  - Multer

## Production Deployment

1. Build the client:
```bash
cd client
npm run build
```

2. Set up environment variables on your hosting platform

3. Deploy the server and static client build

## Security Notes

- JWT tokens expire in 24 hours
- Passwords are hashed using bcrypt
- File uploads are restricted to images only
- S3 bucket should be configured with proper CORS settings