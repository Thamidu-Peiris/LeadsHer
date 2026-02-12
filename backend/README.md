# LeadsHer Backend - Mentorship Program Management

<div align="center">

**Amplifying Women's Leadership through Storytelling and Mentorship**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-green.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 🎯 Overview

LeadsHer is a comprehensive mentorship platform designed to connect experienced women leaders with aspiring mentees. The system provides complete mentorship lifecycle management from discovery to feedback.

### ✨ Key Features

- **Smart Mentor Discovery** - Browse, filter, and get personalized mentor recommendations
- **Mentorship Matching** - Algorithm-based matching with compatibility scoring
- **Request Management** - Streamlined request/accept/reject workflow
- **Session Tracking** - Log and track mentorship sessions with goals
- **Progress Monitoring** - Goal setting, progress tracking, and completion metrics
- **Feedback System** - Two-way feedback with automatic rating calculations
- **Business Rules Enforcement** - Automated validation of all mentorship rules

---

## 📋 Features Implemented

### Component 3.3.1: Mentorship Matching System ✅
- ✅ Mentor profile setup with availability management
- ✅ Mentorship request creation and tracking
- ✅ Accept/reject mentorship requests with notifications
- ✅ Active mentorship tracking and management
- ✅ Mentorship session logging with notes
- ✅ Goal setting and tracking
- ✅ Mentorship completion and feedback system

### Component 3.3.2: Mentor Discovery ✅
- ✅ Browse available mentors with advanced filters
- ✅ Filter by expertise, industry, experience, availability
- ✅ Mentor rating and review system
- ✅ Mentor availability tracking and auto-updates
- ✅ Automated matching suggestions based on profile
- ✅ Compatibility checking and similar mentor suggestions

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Seed database with sample data
npm run seed

# Start server
npm start

# For development with auto-reload
npm run dev
```

Server runs on `http://localhost:5000`

---

## 📚 Documentation

- **[Quick Start Guide](QUICK_START.md)** - 5-minute setup and testing
- **[Setup Guide](MENTORSHIP_SETUP_GUIDE.md)** - Comprehensive setup instructions
- **[API Documentation](MENTORSHIP_API_DOCUMENTATION.md)** - Complete API reference

---

## 🗂️ Project Structure

```
backend/
├── config/
│   └── db.js                          # MongoDB connection
├── controllers/
│   ├── authController.js              # Authentication logic
│   ├── mentorController.js            # Mentor profile management
│   ├── mentorshipRequestController.js # Request handling
│   ├── mentorshipController.js        # Mentorship management
│   └── mentorMatchingController.js    # Matching algorithm
├── middleware/
│   ├── auth.js                        # JWT authentication
│   └── validation.js                  # Request validation
├── models/
│   ├── User.js                        # User model
│   ├── MentorProfile.js              # Mentor profile model
│   ├── MentorshipRequest.js          # Request model
│   └── Mentorship.js                 # Mentorship model
├── routes/
│   ├── auth.js                       # Auth routes
│   ├── mentors.js                    # Mentor routes
│   ├── mentorshipRequests.js         # Request routes
│   └── mentorships.js                # Mentorship routes
├── scripts/
│   └── seedMentors.js                # Database seeder
├── utils/
│   └── mentorMatching.js             # Matching utilities
└── index.js                          # Application entry point
```

---

## 🔌 API Endpoints

### Authentication
```http
POST   /api/auth/register              # Register new user
POST   /api/auth/login                 # Login user
```

### Mentor Management (10 endpoints)
```http
POST   /api/mentors/profile            # Create/update profile
GET    /api/mentors                    # Browse mentors
GET    /api/mentors/:id                # Get mentor details
GET    /api/mentors/:id/stats          # Get statistics
GET    /api/mentors/recommendations    # Get recommendations
GET    /api/mentors/:id/similar        # Get similar mentors
GET    /api/mentors/:id/compatibility  # Check compatibility
GET    /api/mentors/me/profile         # Get my profile
PUT    /api/mentors/availability       # Toggle availability
GET    /api/mentors/user/:userId       # Get by user ID
```

### Mentorship Requests (6 endpoints)
```http
POST   /api/mentorship/requests        # Create request
GET    /api/mentorship/requests        # List requests
GET    /api/mentorship/requests/:id    # Get request
PUT    /api/mentorship/requests/:id/accept   # Accept
PUT    /api/mentorship/requests/:id/reject   # Reject
PUT    /api/mentorship/requests/:id/cancel   # Cancel
```

### Mentorships (10 endpoints)
```http
GET    /api/mentorship/active          # Get active
GET    /api/mentorship/history         # Get history
GET    /api/mentorship/:id             # Get details
POST   /api/mentorship/:id/sessions    # Log session
PUT    /api/mentorship/:id/goals       # Update goals
PUT    /api/mentorship/:id/complete    # Complete
POST   /api/mentorship/:id/feedback    # Submit feedback
PUT    /api/mentorship/:id/pause       # Pause
PUT    /api/mentorship/:id/resume      # Resume
PUT    /api/mentorship/:id/terminate   # Terminate
```

**Total: 28 API Endpoints**

---

## 🎯 Business Rules

### Mentor Constraints
- ✅ Only verified mentors can receive requests
- ✅ Maximum 3 active mentees per mentor
- ✅ Automatic availability management

### Mentee Constraints
- ✅ Only 1 active mentor at a time
- ✅ No duplicate pending requests

### Mentorship Requirements
- ✅ Minimum duration: 30 days
- ✅ At least 3 sessions required for completion
- ✅ Both parties must provide feedback
- ✅ Minimum session duration: 15 minutes

---

## 🧪 Testing

### Seeded Test Data

Run `npm run seed` to create:
- 5 verified mentors (various industries)
- 3 mentees for testing
- All passwords: `password123`

### Sample Credentials

**Mentors:**
- `sarah.johnson@leadsher.com` - Tech Leadership
- `maria.rodriguez@leadsher.com` - Marketing/Entrepreneurship
- `emily.chen@leadsher.com` - Healthcare
- `jessica.williams@leadsher.com` - Finance
- `aisha.patel@leadsher.com` - Data Science/AI

**Mentees:**
- `rachel.thompson@example.com`
- `lisa.anderson@example.com`
- `priya.sharma@example.com`

---

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Input validation and sanitization
- ✅ MongoDB injection prevention
- ✅ Password hashing with bcrypt
- ✅ Protected routes with middleware

---

## 🎨 Key Algorithms

### Mentor Matching Algorithm
Calculates compatibility score (0-100) based on:
- **Expertise Match** (30%) - Alignment of skills
- **Industry Match** (20%) - Industry overlap
- **Mentoring Areas** (30%) - Focus area alignment
- **Availability** (20%) - Current capacity

### Automatic Rating System
- Real-time rating calculation
- Weighted average of all feedback
- Updates mentor profile automatically
- Prevents duplicate feedback

---

## 📊 Database Schema

### Collections
1. **users** - User authentication and profiles
2. **mentorprofiles** - Mentor-specific information
3. **mentorshiprequests** - Mentorship requests
4. **mentorships** - Active/completed mentorships

### Indexes
- Compound indexes for mentor/mentee queries
- Status-based partial indexes
- User reference indexes for fast lookups

---

## 🛠️ Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express 5.x
- **Database:** MongoDB 7.x with Mongoose ODM
- **Authentication:** JWT (jsonwebtoken)
- **Security:** bcryptjs for password hashing
- **Environment:** dotenv for configuration

---

## 📈 Performance Features

- ✅ Database indexing for fast queries
- ✅ Pagination support for large datasets
- ✅ Efficient population of references
- ✅ Query optimization with projections
- ✅ Virtual fields for computed properties

---

## 🚧 Future Enhancements

### Phase 2 (Planned)
- [ ] Email notifications system
- [ ] Calendar integration (Google/Outlook)
- [ ] Real-time chat/messaging
- [ ] Video call integration
- [ ] Advanced analytics dashboard

### Phase 3 (Planned)
- [ ] Mobile app support
- [ ] Payment processing for premium mentorships
- [ ] Machine learning-based matching
- [ ] Group mentorship programs
- [ ] Certification system

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Mentor not accepting mentees" | Verify mentor is verified and has < 3 mentees |
| "Cannot complete mentorship" | Ensure 3+ sessions and 30+ days |
| "401 Unauthorized" | Add valid Bearer token to Authorization header |
| Database connection error | Check MongoDB URI in .env file |

---

## 📞 Support

For issues or questions:
1. Check documentation in `/docs` folder
2. Review API documentation
3. Check server logs for errors
4. Contact development team

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Team

Built with ❤️ by the LeadsHer development team.

**Mission:** Amplifying women's leadership through storytelling and mentorship.

---

## 🙏 Acknowledgments

Special thanks to:
- All mentors who inspire and guide
- All mentees who strive for growth
- The open-source community

---

<div align="center">

**⭐ Star this repo if you find it helpful! ⭐**

</div>
