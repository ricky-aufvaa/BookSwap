// User types
export interface User {
  id: string;
  username: string;
  city: string;
  created_at: string;
}

export interface UserCreate {
  username: string;
  password: string;
  city: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user?: {
    username: string;
    city: string;
  };
}

// Book types
export interface Book {
  id: string;
  title: string;
  author: string;
  owner_id: string;
  owner_username: string;
  created_at: string;
}

export interface BookCreate {
  title: string;
  author: string;
}

export interface GoogleBook {
  title: string;
  authors?: string[];
  description?: string;
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
  };
  // Backend processed format (from google_books.py)
  thumbnail?: string;
  author?: string; // Backend sends single author string
  publisher?: string;
  published_date?: string;
  isbn?: string;
  average_rating?: number;
  ratings_count?: number;
  page_count?: number;
  categories?: string[];
  relevance_score?: number;
  // Original Google Books API format
  publishedDate?: string;
  pageCount?: number;
  averageRating?: number;
  ratingsCount?: number;
  available_in_city?: boolean;
  local_owners_count?: number;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  Search: undefined;
  MyBooks: undefined;
  Profile: undefined;
  BookDetails: { book: GoogleBook | Book };
  BookOwners: { bookTitle: string };
  AddBook: undefined;
  ChatList: undefined;
  ChatRoom: { roomId: string; otherUserName: string; bookTitle: string };
};

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  MyBooks: undefined;
  RequestBooks: undefined;
  ChatList: undefined;
  Profile: undefined;
};

// Component props types
export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  fullWidth?: boolean;
}

export interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  id?: string;
  name?: string;
  autoComplete?: 'username' | 'password' | 'new-password' | 'current-password' | 'email' | 'name' | 'off';
}

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  elevation?: number;
  padding?: number;
}

export interface BookCardProps {
  book: GoogleBook | Book;
  onPress?: () => void;
  showOwner?: boolean;
  showAvailability?: boolean;
}

export interface UserCardProps {
  user: User;
  onPress?: () => void;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Animation types
export interface AnimationConfig {
  duration?: number;
  delay?: number;
  easing?: string;
  useNativeDriver?: boolean;
}

// Theme types
export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
}

// Form types
export interface LoginForm {
  username: string;
  password: string;
}

export interface SignupForm {
  username: string;
  password: string;
  confirmPassword: string;
  city: string;
}

export interface AddBookForm {
  title: string;
  author: string;
}

// Search types
export interface SearchFilters {
  query: string;
  category?: string;
  author?: string;
  availableInCity?: boolean;
}

// State types
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface BooksState {
  myBooks: Book[];
  searchResults: GoogleBook[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
}

export interface AppState {
  auth: AuthState;
  books: BooksState;
}

// Chat types
export interface ChatMessage {
  id: string;
  chat_room_id: string;
  sender_id: string;
  sender_username: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ChatRoom {
  id: string;
  user1_id: string;
  user2_id: string;
  user1_username: string;
  user2_username: string;
  book_title: string;
  created_at: string;
  last_message_at: string;
  last_message?: string;
  unread_count?: number;
  messages?: ChatMessage[];
}

export interface ChatRoomCreate {
  other_user_id: string;
  book_title: string;
}

export interface ChatMessageCreate {
  message: string;
}
