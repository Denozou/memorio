# Multilanguage Support Implementation Guide

## Overview
This document describes the complete multilanguage (i18n) implementation for the Memorio application, supporting English and Polish languages with seamless integration between frontend UI and backend user preferences.

## Architecture

### Technology Stack
- **i18next**: Industry-standard internationalization framework
- **react-i18next**: React bindings for i18next
- **i18next-browser-languagedetector**: Automatic language detection

### Key Components

#### 1. Translation Files
Location: `/frontend/src/locales/`

- **en.json**: English translations
- **pl.json**: Polish translations (Polski)

Both files contain comprehensive translations organized by namespace:
- `common`: Shared UI elements (buttons, labels, etc.)
- `auth`: Authentication pages (login, signup, password reset)
- `dashboard`: Dashboard and main app interface
- `exercises`: Memory training exercises
- `profile`: User profile and settings
- `leaderboard`: Ranking and competition features
- `learning`: Learning hub and articles
- `admin`: Admin panel
- `errors`: Error messages
- `navigation`: Navigation menus
- `landing`: Landing page content

#### 2. i18n Configuration
Location: `/frontend/src/i18n/config.ts`

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Supported languages
export const LANGUAGES = {
  en: { code: 'en', name: 'English', nativeName: 'English' },
  pl: { code: 'pl', name: 'Polish', nativeName: 'Polski' }
};
```

Features:
- Automatic language detection from browser/localStorage
- Fallback to English if language not supported
- localStorage caching for persistence

#### 3. Language Context
Location: `/frontend/src/contexts/LanguageContext.tsx`

Provides:
- `currentLanguage`: Active language code
- `changeLanguage(lang)`: Function to change language
- `isChanging`: Loading state during language change
- `availableLanguages`: List of supported languages

**Integration with Backend:**
- On mount: Fetches user's preferred language from `/users/language`
- On change: Saves to backend via `PUT /users/language`
- Syncs with localStorage for offline persistence

#### 4. Language Selector Component
Location: `/frontend/src/components/LanguageSelector.tsx`

Two variants:
- **Default**: Full dropdown with language names (for Profile page)
- **Compact**: Icon-only button with dropdown (for headers)

Features:
- Click-outside-to-close functionality
- Visual indication of current language
- Disabled state during language change
- Accessible keyboard navigation

## Usage Guide

### For Developers

#### Adding Translations to a Component

1. Import the translation hook:
```typescript
import { useTranslation } from 'react-i18next';
```

2. Use in component:
```typescript
export default function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.title')}</h1>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

#### Adding New Translation Keys

1. Add to both `/frontend/src/locales/en.json` and `/frontend/src/locales/pl.json`:

```json
// en.json
{
  "myFeature": {
    "title": "My Feature",
    "description": "This is my feature"
  }
}

// pl.json
{
  "myFeature": {
    "title": "Moja funkcja",
    "description": "To jest moja funkcja"
  }
}
```

2. Use in component:
```typescript
{t('myFeature.title')}
{t('myFeature.description')}
```

#### Adding a New Language

1. Create translation file: `/frontend/src/locales/[code].json`
2. Update `/frontend/src/i18n/config.ts`:
```typescript
export const LANGUAGES = {
  en: { code: 'en', name: 'English', nativeName: 'English' },
  pl: { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch' } // New language
};
```
3. Import and add to resources in config.ts
4. Update backend to support the new language code

### For Users

#### Changing Language

**Method 1: Profile Page**
1. Navigate to Profile
2. Find "Language" section
3. Click dropdown and select preferred language
4. Language changes immediately and saves to account

**Method 2: Login/Signup Pages**
1. Click the globe icon (🌐) in the header
2. Select language from dropdown
3. Language changes immediately (saved to account after login)

**Method 3: Any Protected Page**
1. Use compact language selector in navigation
2. Changes persist across sessions

## Backend Integration

### API Endpoints

#### Get User Language
```
GET /users/language
Response: { "language": "en" }
```

#### Set User Language
```
PUT /users/language
Body: { "language": "pl" }
Response: { "language": "pl" }
```

#### User Profile
```
GET /users/profile
Response includes: { "preferredLanguage": "en", ... }

PUT /users/profile
Body can include: { "preferredLanguage": "pl", ... }
```

### Database Schema
The `users` table includes:
- `preferred_language` (VARCHAR(8)): Stores user's language preference

### Registration
During signup, users can select their preferred language:
```typescript
// RegisterRequest DTO
{
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  preferredLanguage: string; // defaults to "en"
}
```

## Implementation Details

### Language Persistence Flow

1. **User Not Logged In:**
   - Language detected from browser settings
   - Stored in localStorage (`memorio_language`)
   - Used until user logs in

2. **User Logs In:**
   - Backend preference loaded from `/users/language`
   - Overrides browser/localStorage setting
   - Updates localStorage for consistency

3. **User Changes Language:**
   - UI updates immediately via i18next
   - Saved to localStorage
   - Sent to backend (if logged in)
   - Persists across sessions

### Components Updated with i18n

✅ **Login.tsx**: Full translation support
✅ **Profile.tsx**: Full translation support + Language Selector
✅ **LanguageSelector.tsx**: New component (compact & full variants)

### Components Pending Translation

The following components should be updated to use translations:
- Dashboard.tsx
- ExerciseWordLinking.tsx
- ExerciseNamesFaces.tsx
- ExerciseNumberPeg.tsx
- SignUp.tsx
- LearningHub.tsx
- ArticleDetail.tsx
- IsoForestLeaderboard.tsx
- AdminLearningPanel.tsx

**Pattern to follow:**
```typescript
// 1. Import hook
import { useTranslation } from 'react-i18next';

// 2. Use in component
const { t } = useTranslation();

// 3. Replace hardcoded strings
- <h1>Dashboard</h1>
+ <h1>{t('dashboard.title')}</h1>
```

## Translation Coverage

### Current Coverage
- ✅ Common UI elements (buttons, labels, navigation)
- ✅ Authentication flow (login, signup, password reset)
- ✅ Profile management
- ✅ Dashboard elements
- ✅ Exercise descriptions
- ✅ Leaderboard
- ✅ Learning hub
- ✅ Admin panel
- ✅ Error messages

### Translation Keys Available
Over 150+ translation keys covering:
- Navigation and menus
- Forms and inputs
- Buttons and actions
- Status messages
- Feature descriptions
- Error handling
- Success confirmations

## Best Practices

### 1. Namespace Organization
Group related translations together:
```json
{
  "auth": {
    "login": "Login",
    "signup": "Sign up",
    "forgotPassword": "Forgot password?"
  }
}
```

### 2. Avoid Hardcoded Strings
❌ Bad:
```typescript
<button>Save</button>
```

✅ Good:
```typescript
<button>{t('common.save')}</button>
```

### 3. Use Descriptive Keys
❌ Bad: `t('btn1')`
✅ Good: `t('common.save')`

### 4. Handle Plurals
```json
{
  "items": "{{count}} item",
  "items_plural": "{{count}} items"
}
```

```typescript
{t('items', { count: 5 })} // "5 items"
```

### 5. Interpolation
```json
{
  "welcome": "Welcome, {{name}}!"
}
```

```typescript
{t('welcome', { name: user.displayName })}
```

## Testing

### Manual Testing Checklist
- [ ] Switch language on Login page
- [ ] Login and verify language persists
- [ ] Change language in Profile
- [ ] Verify language saves to backend
- [ ] Logout and login - language should persist
- [ ] Test with new user registration
- [ ] Test browser language detection
- [ ] Test all translated components

### Browser Testing
Test in:
- Chrome/Edge (Chromium)
- Firefox
- Safari
- Mobile browsers

## Troubleshooting

### Language Not Changing
1. Check browser console for errors
2. Verify translation keys exist in both en.json and pl.json
3. Check network tab for `/users/language` API calls
4. Clear localStorage and try again

### Missing Translations
1. Check if key exists in translation files
2. Verify correct namespace usage
3. Check for typos in translation keys

### Backend Sync Issues
1. Verify user is logged in (token exists)
2. Check API endpoint responses
3. Verify backend language validation

## Future Enhancements

### Potential Additions
1. **More Languages**: German, Spanish, French, Ukrainian
2. **RTL Support**: Arabic, Hebrew
3. **Date/Time Localization**: Format dates per locale
4. **Number Formatting**: Currency, decimals per locale
5. **Dynamic Content**: Translate exercise content from backend
6. **Language Detection**: Auto-detect from IP/location
7. **Translation Management**: Admin panel for managing translations

### Recommended Tools
- **i18n-ally**: VS Code extension for managing translations
- **Translation Management**: Lokalise, Crowdin for collaborative translation
- **Automated Translation**: DeepL API for initial translations

## Resources

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- [Language Codes (ISO 639-1)](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)

## Support

For issues or questions:
1. Check this documentation
2. Review translation files for examples
3. Check browser console for errors
4. Verify backend API responses

---

**Last Updated**: December 2024
**Version**: 1.0
**Languages Supported**: English (en), Polish (pl)
