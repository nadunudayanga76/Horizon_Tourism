# Horizon Tourism - Complete Tourism Management System

A comprehensive full-stack tourism management platform built with React Native, Expo, Node.js, Express, and MongoDB. Horizon Tourism provides seamless booking, management, and payment solutions for residences, transportation, tour guides, and travel experiences.

## � Live Demo

**Try the mobile app now**: [https://horizon-tourism.vercel.app/](https://horizon-tourism.vercel.app/)

## �🌟 Features

### For Users
- **Residence Booking System**: Browse, filter, and book accommodations with real-time availability
- **Transportation Management**: Book vehicles for travel with diverse transport options
- **Tour Guide Services**: Connect with professional tour guides for guided experiences
- **Payment Processing**: Secure payment integration for all bookings
- **Review & Feedback System**: Rate and review residences, guides, and services
- **Reservation Management**: Track and manage all bookings in one place
- **Map Exploration**: Interactive map-based discovery of destinations and services
- **Reel Content**: Discover travel inspiration through curated video content

### For Administrators & Managers
- **Dashboard Management**: Complete control panel for managing all services
- **User & Driver Management**: Oversee users, drivers, and service providers
- **Financial Analytics**: Track payments and revenue
- **Feedback Management**: Monitor and respond to user feedback
- **Content Management**: Manage reels and promotional content

## 🏗️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js v5.2.1
- **Database**: MongoDB with Mongoose ODM v9.5.0
- **Authentication**: JWT (JSON Web Tokens) v9.0.3
- **Password Security**: bcryptjs v3.0.3
- **File Upload**: Multer v2.1.1
- **API Requests**: Axios for inter-service communication
- **Logging**: Morgan v1.10.1
- **Email Service**: Nodemailer v8.0.7
- **CORS**: Cross-Origin Resource Sharing enabled
- **Development**: Nodemon v3.1.14

### Mobile Frontend
- **Platform**: React Native with Expo v54.0.34
- **Language**: JavaScript/TypeScript
- **Navigation**: React Navigation v7.x (Stack, Tab, Drawer)
- **Maps**: React Native Maps v1.20.1, @mapbox/polyline v1.2.1
- **API Client**: Axios v1.15.2
- **State Management**: React Context API
- **Storage**: AsyncStorage
- **UI Components**: Expo Vector Icons, Expo Linear Gradient
- **Media**: Expo Image Picker, Expo AV, Expo Image
- **Location**: Expo Location v19.0.8
- **Date/Time**: React Native Community Date Time Picker

## 📁 Project Structure

```
horizon-tourism/
├── backend/                          # Node.js Express Backend
│   ├── config/
│   │   └── db.js                    # MongoDB configuration
│   ├── controllers/                  # Business logic
│   │   ├── auth.js                  # Authentication
│   │   ├── residences.js            # Residence management
│   │   ├── reservations.js          # Booking management
│   │   ├── transport.js             # Vehicle management
│   │   ├── tourGuides.js            # Tour guide services
│   │   ├── payments.js              # Payment processing
│   │   ├── drivers.js               # Driver management
│   │   ├── transportBookings.js     # Transport bookings
│   │   ├── reviews.js               # Review management
│   │   └── reels.js                 # Video content
│   ├── middleware/
│   │   ├── auth.js                  # JWT authentication
│   │   ├── async.js                 # Async error handling
│   │   ├── error.js                 # Global error handler
│   │   ├── upload.js                # File upload middleware
│   │   └── videoUpload.js           # Video upload middleware
│   ├── models/                       # MongoDB schemas
│   │   ├── User.js
│   │   ├── Residence.js
│   │   ├── Reservation.js
│   │   ├── Transport.js
│   │   ├── TransportBooking.js
│   │   ├── TourGuide.js
│   │   ├── Payment.js
│   │   ├── Reel.js
│   │   ├── Driver.js
│   │   └── Feedback.js
│   ├── routes/                       # API endpoints
│   │   ├── auth.js
│   │   ├── residences.js
│   │   ├── reservations.js
│   │   ├── transport.js
│   │   ├── tourGuides.js
│   │   ├── payments.js
│   │   ├── drivers.js
│   │   ├── transportBookings.js
│   │   ├── reviews.js
│   │   └── reels.js
│   ├── utils/
│   │   ├── ErrorResponse.js         # Custom error handling
│   │   └── sendEmail.js             # Email service
│   ├── scratch/                      # Utility scripts
│   │   ├── dbCleanup.js
│   │   ├── check_reels.js
│   │   └── fix_reels_data.js
│   ├── uploads/                      # File storage
│   ├── server.js                     # Main server entry
│   └── package.json
│
├── mobile/                           # React Native Expo App
│   ├── app.json                      # Expo configuration
│   ├── App.js                        # Root component
│   ├── assets/                       # Static assets
│   ├── components/                   # Reusable UI components
│   │   ├── external-link.tsx
│   │   ├── haptic-tab.tsx
│   │   ├── parallax-scroll-view.tsx
│   │   ├── themed-text.tsx
│   │   ├── themed-view.tsx
│   │   └── ui/                       # UI library components
│   ├── constants/
│   │   ├── theme.ts                  # Theme configuration
│   │   └── translations.js           # Multi-language support
│   ├── context/
│   │   ├── AuthContext.js            # Authentication state
│   │   └── LanguageContext.js        # Language/i18n state
│   ├── hooks/                        # Custom React hooks
│   ├── navigation/
│   │   └── AppNavigator.js           # Navigation setup
│   ├── screens/                      # App screens
│   │   ├── HomeScreen.js
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── ResidenceListScreen.js
│   │   ├── ResidenceDetailScreen.js
│   │   ├── ResidenceManageScreen.js
│   │   ├── BookingFormScreen.js
│   │   ├── ReservationListScreen.js
│   │   ├── TransportListScreen.js
│   │   ├── TransportManageScreen.js
│   │   ├── TransportBookingFormScreen.js
│   │   ├── TourGuideListScreen.js
│   │   ├── DriverListScreen.js
│   │   ├── PaymentScreen.js
│   │   ├── MapExplorerScreen.js
│   │   ├── FeedbackManageScreen.js
│   │   ├── FinanceManageScreen.js
│   │   ├── ProfileScreen.js
│   │   ├── LoadingScreen.js
│   │   └── WelcomeScreen.js
│   ├── services/
│   │   └── api.js                    # API integration
│   ├── utils/
│   │   ├── config.js
│   │   └── imageHelper.js
│   └── package.json
│
└── package.json                      # Root package.json
```

## 🚀 Getting Started

**Quick Start**: Visit [https://horizon-tourism.vercel.app/](https://horizon-tourism.vercel.app/) to try the app online!

To run locally, follow the setup below:

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or Atlas cloud)
- Expo CLI (`npm install -g expo-cli`)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your configuration:
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/horizon-tourism
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

4. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Mobile App Setup

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with API configuration:
```env
API_URL=http://localhost:5000
```

4. Start the Expo development server:
```bash
npm start
```

5. Choose your preferred platform:
   - Press `a` for Android
   - Press `i` for iOS
   - Press `w` for Web

## 📱 Mobile App Features

### Navigation Structure
- **Stack Navigation**: Login/Register flow
- **Tab Navigation**: Home, Residences, Bookings, Profile
- **Drawer Navigation**: Additional menu options

### Key Screens
- **Home**: Dashboard with featured listings
- **Residence**: Browse, filter, and book accommodations
- **Transport**: Vehicle booking and management
- **Tour Guides**: Browse and book professional guides
- **Bookings**: View and manage reservations
- **Payments**: Process and view payment history
- **Map Explorer**: Interactive map-based discovery
- **Profile**: User account and preferences

## 🔌 API Documentation

### Authentication Endpoints
```
POST   /api/auth/register          # User registration
POST   /api/auth/login             # User login
GET    /api/auth/me                # Get current user (Protected)
POST   /api/auth/logout            # User logout
```

### Residence Endpoints
```
GET    /api/residences             # Get all residences
GET    /api/residences/:id         # Get residence details
POST   /api/residences             # Create residence (Admin)
PUT    /api/residences/:id         # Update residence (Admin)
DELETE /api/residences/:id         # Delete residence (Admin)
```

### Reservation Endpoints
```
GET    /api/reservations           # Get user reservations
POST   /api/reservations           # Create reservation
PUT    /api/reservations/:id       # Update reservation
DELETE /api/reservations/:id       # Cancel reservation
```

### Payment Endpoints
```
POST   /api/payments               # Process payment
GET    /api/payments               # Get payment history
GET    /api/payments/:id           # Get payment details
```

### Other Endpoints
- `/api/transport` - Vehicle management
- `/api/transport-bookings` - Transport bookings
- `/api/tour-guides` - Tour guide management
- `/api/drivers` - Driver management
- `/api/reviews` - Review and feedback
- `/api/reels` - Video content

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- CORS protection
- Error handling middleware
- Input validation
- Secure file upload handling
- Environment variable configuration

## 📊 Database Models

The application uses MongoDB with the following main collections:

- **User**: User accounts and profiles
- **Residence**: Accommodation listings
- **Reservation**: Booking records
- **Transport**: Vehicle inventory
- **TransportBooking**: Vehicle bookings
- **TourGuide**: Guide information and availability
- **Payment**: Transaction records
- **Driver**: Driver profiles
- **Reel**: Video content
- **Feedback**: User feedback and reviews

## 🎨 UI/UX Features

- **Multi-language Support**: Localization ready
- **Theme Support**: Light and dark mode
- **Responsive Design**: Works on all screen sizes
- **Haptic Feedback**: Enhanced user interaction
- **Image Optimization**: Efficient image handling
- **Real-time Location**: GPS integration for map features

## 🧪 Testing

Run tests with:
```bash
cd mobile
npm run lint
```

## 📝 Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
EMAIL_SERVICE=gmail
EMAIL_USER=your_email
EMAIL_PASSWORD=your_app_password
NODE_ENV=development
```

### Mobile (.env)
```
API_URL=http://localhost:5000
MAPBOX_TOKEN=your_mapbox_token (optional)
```

## 🚀 Deployment

### Backend Deployment
The backend can be deployed on:
- Heroku
- AWS (EC2, Elastic Beanstalk)
- DigitalOcean
- Railway
- Render

### Mobile Deployment
- **iOS**: Requires Apple Developer account, deploy via App Store
- **Android**: Requires Google Play Developer account, deploy via Google Play Store
- **Web**: Deploy to Vercel, Netlify, or similar platforms using `expo build:web`

**Current Deployment**: The mobile app is hosted at [https://horizon-tourism.vercel.app/](https://horizon-tourism.vercel.app/)

## 📈 Performance Optimization

- Database indexing on frequently queried fields
- Efficient API response pagination
- Image lazy loading in mobile app
- Optimized bundle size with code splitting
- Caching strategies for API responses

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/AmazingFeature`
2. Commit changes: `git commit -m 'Add AmazingFeature'`
3. Push to branch: `git push origin feature/AmazingFeature`
4. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 👥 Team

Developed as a comprehensive tourism management solution.

## 📞 Support

For support and inquiries, please contact the development team or create an issue in the repository.

## 🗺️ Roadmap

- [ ] Payment gateway integration (Stripe, PayPal)
- [ ] Advanced analytics dashboard
- [ ] Real-time notifications
- [ ] Social sharing features
- [ ] Loyalty rewards program
- [ ] Multi-currency support
- [ ] Advanced filtering and search
- [ ] Integration with third-party tour operators

---

**Last Updated**: May 2026

**Version**: 1.0.0

**Status**: Active Development
