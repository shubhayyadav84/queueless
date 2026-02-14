# QueueLess - Universal Digital Queue Management System

QueueLess is a full-stack web application for managing digital queues and appointments for any service business including clinics, salons, banks, government offices, college desks, service centers, restaurants, and repair centers.

## Features

### For Patients/Users
- Search businesses and queues
- Book tokens in virtual queues
- Real-time queue status updates
- View current token number and estimated wait time
- Check-in before being served
- Cancel appointments anytime
- View token history

### For Business Owners
- Register multiple businesses
- Create multiple queues per business
- Choose queue type: Virtual Queue or Appointment
- Set queue purpose and settings
- Assign staff members
- View live queue statistics
- Control queue progression (Next, Skip, No-show)
- Pause/Resume queues

### For Staff
- View assigned businesses
- Update queue progression
- Check-in patients manually
- Skip tokens
- Mark no-shows

### Technical Features
- OTP-based mobile authentication (mock OTP: 123456)
- Real-time updates via Socket.IO
- Role-based access control
- Responsive design with modern UI
- MongoDB database with Mongoose ORM
- RESTful API architecture

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Socket.IO
- JWT Authentication
- Express Validator

### Frontend
- React (Vite)
- Tailwind CSS
- Framer Motion (animations)
- Socket.IO Client
- Axios
- React Router DOM
- Lucide React (icons)

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas) - [Download MongoDB Community Server](https://www.mongodb.com/try/download/community)
- npm or yarn

### Installing MongoDB (Windows)
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Install with default settings (make sure "Install MongoDB as a Service" is checked)
3. MongoDB will run automatically as a Windows service

### Installing MongoDB (Mac)
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Installing MongoDB (Linux)
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

## Installation & Setup

### Step 1: Clone and Navigate to Project
```bash
cd queueless
```

### Step 2: Setup Backend

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create .env file (already created with default values):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/queueless
JWT_SECRET=queueless_secret_key_2024_secure_random_string
JWT_EXPIRE=7d
DEMO_MODE=true
```

4. Start MongoDB (if using local MongoDB):
- Make sure MongoDB is installed and running on your system
- Default connection: mongodb://localhost:27017

5. Start the backend server:
```bash
npm run dev
```

The backend will start on http://localhost:5000

### Step 3: Setup Frontend

1. Open a new terminal and navigate to frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend development server:
```bash
npm run dev
```

The frontend will start on http://localhost:5173

### Step 4: Access the Application

Open your browser and navigate to: http://localhost:5173

## How to Use

### Demo Mode
The application runs in demo mode by default. Use OTP `123456` for all phone numbers.

### User Flows

#### 1. Register as a Business Owner
1. Go to Login page
2. Enter any phone number (e.g., +919876543210)
3. Enter OTP: 123456
4. Enter your name
5. Select role: "Owner"
6. Complete registration

#### 2. Create a Business
1. Go to "My Business" from navigation
2. Click "Register Business"
3. Fill in business details
4. Submit

#### 3. Create a Queue
1. In Owner Dashboard, click "Add Queue" on your business
2. Enter queue name (e.g., "General Checkup")
3. Enter purpose
4. Select queue type (Virtual/Appointment)
5. Submit

#### 4. Book a Token (as Patient)
1. Logout and register as a Patient
2. Go to "Search"
3. Find the business/queue
4. Click "Book Token"
5. View your token in "My Tokens"

#### 5. Manage Queue (as Owner/Staff)
1. Go to "My Business" (Owner) or "Staff Panel" (Staff)
2. Click on queue to manage
3. Use controls: Next, Skip, No-show
4. See real-time updates

### API Endpoints

#### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP and login/register
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

#### Businesses
- `GET /api/businesses` - List all businesses
- `POST /api/businesses` - Create business (Owner only)
- `GET /api/businesses/my-businesses` - Get owner's businesses
- `GET /api/businesses/:id` - Get business details
- `POST /api/businesses/:id/staff` - Add staff (Owner only)

#### Queues
- `POST /api/queues` - Create queue (Owner only)
- `GET /api/queues/search?queueId=XXX` - Search by Queue ID
- `GET /api/queues/business/:businessId` - Get business queues
- `GET /api/queues/:id` - Get queue details
- `POST /api/queues/:id/next` - Next token (Owner/Staff)
- `POST /api/queues/:id/skip/:tokenNumber` - Skip token
- `POST /api/queues/:id/noshow/:tokenNumber` - Mark no-show
- `POST /api/queues/:id/pause` - Pause queue
- `POST /api/queues/:id/resume` - Resume queue

#### Tokens
- `POST /api/tokens` - Book token
- `GET /api/tokens/my-tokens` - Get user's tokens
- `GET /api/tokens/history` - Get token history
- `POST /api/tokens/:id/cancel` - Cancel token
- `POST /api/tokens/:id/checkin` - Check-in
- `GET /api/tokens/queue/:queueId` - Get queue tokens (Owner/Staff)

#### Payments (Mock)
- `POST /api/payments/mock` - Process mock payment
- `GET /api/payments/my-payments` - Get payment history

## Project Structure

```
queueless/
├── backend/
│   ├── config/
│   │   └── db.js              # Database configuration
│   ├── middleware/
│   │   ├── auth.js            # Authentication middleware
│   │   └── errorHandler.js    # Error handling
│   ├── models/
│   │   ├── User.js            # User model
│   │   ├── Business.js        # Business model
│   │   ├── Queue.js           # Queue model
│   │   ├── QueueToken.js      # Token model
│   │   ├── ActivityLog.js     # Activity log model
│   │   └── Payment.js         # Payment model
│   ├── routes/
│   │   ├── authRoutes.js      # Auth routes
│   │   ├── businessRoutes.js  # Business routes
│   │   ├── queueRoutes.js     # Queue routes
│   │   ├── tokenRoutes.js     # Token routes
│   │   └── paymentRoutes.js   # Payment routes
│   ├── socket/
│   │   └── queueHandler.js    # Socket.IO handlers
│   ├── utils/
│   │   ├── otpStore.js        # OTP storage
│   │   └── generateToken.js   # Token generation
│   ├── .env                   # Environment variables
│   ├── package.json
│   └── server.js              # Main server file
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.jsx     # Navigation component
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # Authentication context
│   │   │   └── SocketContext.jsx  # Socket.IO context
│   │   ├── pages/
│   │   │   ├── Login.jsx          # Login page
│   │   │   ├── Home.jsx           # Home page
│   │   │   ├── Search.jsx         # Search page
│   │   │   ├── BusinessDetail.jsx # Business detail
│   │   │   ├── QueueDetail.jsx    # Queue detail
│   │   │   ├── Dashboard.jsx      # User dashboard
│   │   │   ├── OwnerDashboard.jsx # Owner dashboard
│   │   │   ├── StaffDashboard.jsx # Staff dashboard
│   │   │   └── QueueManage.jsx    # Queue management
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
│
└── README.md
```

## Environment Variables

### Backend (.env)
```env
PORT=5000                          # Server port
MONGODB_URI=mongodb://localhost:27017/queueless  # MongoDB URI
JWT_SECRET=your_jwt_secret         # JWT secret key
JWT_EXPIRE=7d                      # JWT expiration
DEMO_MODE=true                     # Enable demo mode (mock OTP)
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api    # Backend API URL
VITE_SOCKET_URL=http://localhost:5000     # Socket.IO URL
```

## Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is installed and running
- Check the MONGODB_URI in backend/.env
- For MongoDB Atlas, replace the URI with your connection string

### Port Already in Use
- Change the PORT in backend/.env
- Or kill the process using the port:
  ```bash
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  
  # Mac/Linux
  lsof -ti:5000 | xargs kill -9
  ```

### Frontend Not Connecting to Backend
- Check that both servers are running
- Verify VITE_API_URL in frontend/.env matches backend port
- Check browser console for CORS errors

## Future Enhancements

- Real SMS OTP integration (Twilio)
- Real UPI payment gateway integration
- Push notifications
- Mobile app (React Native)
- Analytics dashboard
- Subscription management
- Priority slot booking
- Multi-language support

## License

MIT License

## Author

Created for educational purposes and college submission.
