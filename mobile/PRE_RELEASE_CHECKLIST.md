# Invoyq Mobile App - Pre-Release Checklist

## ✅ Critical Path Testing

### Authentication & Account
- [ ] User registration with email verification
- [ ] Login flow with valid credentials
- [ ] Login with invalid credentials shows error
- [ ] Logout flow clears token and redirects to login
- [ ] Token persistence across app restarts
- [ ] 401 handling redirects to login

### Testing on Both Platforms
- [ ] Test all critical paths on iOS
- [ ] Test all critical paths on Android
- [ ] Verify UI looks correct on both platforms
- [ ] Test on different screen sizes (phone/tablet)

## 📱 Build & Distribution
- [ ] View client list
- [ ] Create new client
- [ ] Edit existing client
- [ ] Delete client
- [ ] Search/filter clients
- [ ] Client details screen

### Product Management
- [ ] View product list with infinite scroll
- [ ] Create new product
- [ ] Edit existing product
- [ ] Delete product
- [ ] Adjust product quantity
- [ ] Low stock indicators
- [ ] Product search functionality

### Invoice Management
- [ ] View invoice list
- [ ] Create invoice with manual items
- [ ] Create invoice with product items (verify inventory reduction)
- [ ] Edit invoice
- [ ] Delete invoice
- [ ] Invoice status updates (draft → sent → paid)
- [ ] Invoice filtering by status/date

### Expense Management
- [ ] View expense list
- [ ] Create new expense
- [ ] Edit existing expense
- [ ] Delete expense
- [ ] Expense categories filter
- [ ] Expense summary by category
- [ ] Date range filtering

### Dashboard
- [ ] Shows correct revenue metrics
- [ ] Shows correct expense totals
- [ ] Collection rate calculation
- [ ] Recent invoices display
- [ ] Recent expenses display
- [ ] Low stock alerts
- [ ] Quick stat cards

### Offline Mode
- [ ] App loads cached data when offline
- [ ] Offline banner displays when no connection
- [ ] Mutations queued when offline
- [ ] Queued mutations sync when online
- [ ] Network status detection works

### Settings & Profile
- [ ] View user profile
- [ ] Update profile information
- [ ] Upload avatar/logo
- [ ] Profile changes persist

## 🔒 Security Verification

- [ ] All API calls use HTTPS in production
- [ ] API URL validation enforces HTTPS (production)
- [ ] Tokens stored in SecureStore only
- [ ] No sensitive data in console logs (production)
- [ ] File upload types validated
- [ ] File sizes validated
- [ ] Filenames sanitized
- [ ] Error messages don't expose sensitive info

## 🌍 Environment Configuration

- [ ] Development environment connects to dev API
- [ ] Production environment connects to prod API
- [ ] API_BASE_URL environment variables set
- [ ] Google OAuth configured (if enabled)
- [ ] Image upload to backend works
- [ ] Email verification emails sent

## ⚡ Performance Testing

- [ ] App bundle size < 50MB
- [ ] Initial load time < 3s on 4G
- [ ] Smooth scrolling on lists (60fps)
- [ ] No memory leaks in long sessions
- [ ] Images load with proper caching
- [ ] Infinite scroll loads smoothly
- [ ] Network requests are optimized

## 🧪 Manual Testing (Expo)

### Testing Setup
- [ ] Install Expo Go on iOS device
- [ ] Install Expo Go on Android device
- [ ] Start development server (`npm start`)
- [ ] Connect both devices to same network
- [ ] Scan QR code and load app

### Authentication & Account

- [ ] Development build works on iOS
- [ ] Development build works on Android
- [ ] Preview build works on iOS
- [ ] Preview build works on Android
- [ ] Production build created successfully
- [ ] App icon displays correctly
- [ ] Splash screen displays correctly
- [ ] App name is correct
- [ ] Bundle identifier is correct (iOS)
- [ ] Package name is correct (Android)

## 🎨 UI/UX Quality

- [ ] All screens follow design system
- [ ] Colors match brand guidelines
- [ ] Typography consistent throughout
- [ ] Spacing consistent throughout
- [ ] Loading states on all data fetches
- [ ] Empty states on all lists
- [ ] Error states on all forms
- [ ] Success feedback on mutations
- [ ] Proper form validation messages
- [ ] Keyboard handling on forms
- [ ] Pull-to-refresh where appropriate

## 📊 Analytics & Monitoring

- [ ] Analytics SDK initialized
- [ ] Screen views tracked
- [ ] User events tracked
- [ ] Error tracking configured
- [ ] API errors logged
- [ ] Performance metrics tracked

## 🔧 Final Checks

- [ ] App version number updated
- [ ] Changelog updated
- [ ] README updated
- [ ] Environment variables documented
- [ ] API documentation reviewed
- [ ] Backend API running and accessible
- [ ] Database migrations applied
- [ ] Terms of service link works
- [ ] Privacy policy link works
- [ ] Support contact information correct

## 🚀 Deployment Steps

1. **Update Version**
   ```bash
   # Update version in app.json
   # Update version in package.json
   ```

2. **Run Tests**
   ```bash
   npm test
   npm run lint
   ```

3. **Build Preview**
   ```bash
   eas build --profile preview --platform all
   ```

4. **Test Preview Build**
   - Install on test devices
   - Run through critical path
   - Verify all features work

5. **Build Production**
   ```bash
   eas build --profile production --platform all
   ```

6. **Submit to Stores**
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

7. **Monitor Launch**
   - Watch error rates
   - Monitor crash reports
   - Check analytics events
   - Review user feedback

## 📝 Notes

- Test on both iOS and Android
- Test on different screen sizes
- Test with slow network conditions
- Test with no network connection
- Test with different user roles (if applicable)
- Verify all third-party integrations
- Check all external links work
- Ensure compliance with store guidelines
