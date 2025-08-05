# BookSwap React Native App

A clean, elegant, modern React Native frontend for the BookSwap application that allows users to find and exchange books with people in their city.

## Features

### 🔐 Authentication
- User registration and login
- Secure token-based authentication
- City-based user profiles

### 🏠 Home Screen
- Personalized greeting with user's city
- Quick search functionality
- Quick action cards for common tasks
- Recent books display
- Popular book requests in your city

### 🔍 Search Screen
- Search books using Google Books API
- Shows local availability in your city
- Find book owners nearby
- Request books from other users
- Beautiful book cards with descriptions

### 📚 My Books Screen
- Add books to your personal library
- View all your books
- Clean, organized book cards
- Easy book management

### 👥 Book Owners Screen
- View people who own specific books
- Contact book owners directly
- Send general book requests
- Tips for safe book swapping

### 👤 Profile Screen
- User profile with avatar
- Statistics dashboard
- Account settings
- App information and support

## Design Features

### 🎨 Modern UI/UX
- Light theme with clean aesthetics
- Consistent color scheme (Indigo primary)
- Beautiful shadows and rounded corners
- Smooth animations and transitions

### 📱 Components
- Custom Button component with variants
- Custom Input component with validation
- Reusable UI components
- Responsive design

### 🏗️ Architecture
- Context API for state management
- Axios for API communication
- React Navigation for routing
- AsyncStorage for local data

## Installation

1. **Install dependencies:**
   ```bash
   cd BookSwapApp
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Run on specific platforms:**
   ```bash
   npm run android  # For Android
   npm run ios      # For iOS
   npm run web      # For Web
   ```

## Configuration

### Backend Connection
Update the `BASE_URL` in `src/services/apiService.js` to point to your backend server:

```javascript
const BASE_URL = 'http://your-backend-url:8000/api/v1';
```

### API Endpoints Used
- `POST /signup` - User registration
- `POST /login` - User login
- `GET /books/` - Get user's books
- `POST /books/` - Add a new book
- `GET /books/search` - Search books
- `GET /books/search-owners` - Find book owners
- `POST /requests/` - Request a book

## Project Structure

```
BookSwapApp/
├── App.js                          # Main app component
├── app.json                        # Expo configuration
├── package.json                    # Dependencies and scripts
├── src/
│   ├── components/                 # Reusable components
│   │   ├── Button.js              # Custom button component
│   │   └── Input.js               # Custom input component
│   ├── context/                   # React Context
│   │   └── AuthContext.js         # Authentication context
│   ├── screens/                   # App screens
│   │   ├── LoginScreen.js         # Login screen
│   │   ├── SignupScreen.js        # Registration screen
│   │   ├── HomeScreen.js          # Home dashboard
│   │   ├── SearchScreen.js        # Book search
│   │   ├── MyBooksScreen.js       # User's books
│   │   ├── BookOwnersScreen.js    # Book owners list
│   │   └── ProfileScreen.js       # User profile
│   └── services/                  # API services
│       └── apiService.js          # Backend communication
```

## Key Features Implementation

### Authentication Flow
- JWT token storage in AsyncStorage
- Automatic token refresh
- Protected routes based on auth state

### Book Search
- Integration with Google Books API
- Local availability checking
- Owner discovery in same city

### User Experience
- Pull-to-refresh functionality
- Loading states and error handling
- Intuitive navigation
- Responsive design

## Color Scheme

- **Primary:** #4F46E5 (Indigo)
- **Success:** #10B981 (Emerald)
- **Warning:** #F59E0B (Amber)
- **Error:** #EF4444 (Red)
- **Background:** #F9FAFB (Gray-50)
- **Surface:** #FFFFFF (White)
- **Text Primary:** #111827 (Gray-900)
- **Text Secondary:** #6B7280 (Gray-500)

## Dependencies

### Core
- React Native with Expo
- React Navigation (Stack & Bottom Tabs)
- AsyncStorage for local storage
- Axios for HTTP requests

### UI
- Expo Vector Icons
- React Native Safe Area Context
- React Native Screens

## Future Enhancements

- [ ] Push notifications for book requests
- [ ] In-app messaging between users
- [ ] Book condition ratings
- [ ] Photo uploads for books
- [ ] Advanced search filters
- [ ] Book recommendations
- [ ] Social features (following users)
- [ ] Book swap history
- [ ] Offline support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.
