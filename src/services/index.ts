export { default as api } from './axios';
export { default as apiService } from './api';
export { 
  default as authService,
  ALLOWED_EMAILS,
  initAuthService,
  addAllowedEmail,
  isEmailAllowed,
  logout,
  sendVerificationCode,
  getVideoToPay
} from './authService';
