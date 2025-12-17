# Unified Language Selector - Final Implementation

## Overview
**ONE language selector** that changes **BOTH** UI language and exercise dataset language simultaneously.

## How It Works

### Single Language Selector
When a user changes language (via globe icon 🌐 or Profile page):

1. **UI Language** changes instantly (interface translations)
2. **Dataset Language** saves to backend (exercise content)
3. Both stay synchronized

### User Experience

**Before Login:**
- Language selector available on Login/Signup pages
- Changes UI language immediately
- Saves to localStorage
- When user logs in, their backend preference loads

**After Login:**
- Language selector in header (compact) and Profile page (full)
- Changing language updates:
  - ✅ Interface text (buttons, labels, menus)
  - ✅ Backend `preferredLanguage` (exercise words/names)
- Changes persist across sessions and devices

## Technical Implementation

### LanguageContext Behavior

```typescript
// On mount (user logged in)
1. Load from backend: GET /users/profile
2. Get preferredLanguage field
3. Set UI language to match
4. Save to localStorage

// On mount (user not logged in)
1. Check localStorage
2. Fallback to browser language
3. Default to English if not supported

// On language change
1. Change UI language (i18next)
2. Save to localStorage
3. IF logged in: PUT /users/profile { preferredLanguage: lang }
```

### API Integration

**Load Language:**
```
GET /users/profile
Response: { preferredLanguage: "en", ... }
```

**Save Language:**
```
PUT /users/profile
Body: { preferredLanguage: "pl" }
```

### Storage Locations

| Aspect | Storage | Purpose |
|--------|---------|---------|
| UI Language | `localStorage.memorio_ui_language` | Client-side persistence |
| Dataset Language | Backend `users.preferred_language` | Server-side persistence |
| Sync | Both updated together | Unified experience |

## Components

### LanguageSelector Component
**Location:** `/frontend/src/components/LanguageSelector.tsx`

**Two Variants:**
1. **Compact** - Globe icon with dropdown (for headers)
2. **Default** - Full selector with descriptions (for Profile page)

**Features:**
- Instant UI update
- Background backend sync
- Loading state during save
- Error handling
- Works offline (UI only)

### Profile Page
**Location:** `/frontend/src/routes/Profile.tsx`

**Language Section:**
```tsx
<div>
  <h4>{t('profile.language')}</h4>
  <LanguageSelector />
  <p>{t('profile.languageDesc')}</p>
  // "Changes both interface language and exercise content language"
</div>
```

**No separate selectors** - one unified control

## User Scenarios

### Scenario 1: New User
1. Visit Login page
2. Click globe icon, select "Polski"
3. UI changes to Polish immediately
4. Sign up with Polish interface
5. Backend saves `preferredLanguage: "pl"`
6. Exercises will use Polish words

### Scenario 2: Existing User
1. Login with English account
2. Backend loads `preferredLanguage: "en"`
3. UI shows in English
4. User goes to Profile, changes to Polski
5. UI switches to Polish instantly
6. Backend updates to `preferredLanguage: "pl"`
7. Next login: everything in Polish

### Scenario 3: Multi-Device
1. User changes to Polski on desktop
2. Backend saves preference
3. User logs in on mobile
4. Mobile loads Polski from backend
5. Consistent experience across devices

## Benefits

✅ **Simple UX** - One selector, not two  
✅ **Synchronized** - UI and content always match  
✅ **Persistent** - Saves to backend for all devices  
✅ **Instant** - UI changes immediately  
✅ **Offline-friendly** - UI works from localStorage  
✅ **Clear** - Users understand what it does  

## Files Modified

1. **`/frontend/src/contexts/LanguageContext.tsx`**
   - Loads from backend profile on login
   - Saves to backend on change
   - Syncs localStorage with backend

2. **`/frontend/src/routes/Profile.tsx`**
   - Single language selector
   - Removed duplicate dataset selector
   - Clear description of what it does

3. **`/frontend/src/locales/en.json` & `pl.json`**
   - Added `profile.languageDesc` translation
   - Simplified language-related keys

## Testing

✅ **Tested Scenarios:**
- [x] Change language before login
- [x] Login loads backend preference
- [x] Change language after login
- [x] Backend saves preference
- [x] Logout and login - preference persists
- [x] UI changes instantly
- [x] Works on multiple devices
- [x] Compact selector in header
- [x] Full selector in Profile

## Future Enhancements

If you want to allow **different** UI and dataset languages:
1. Add a toggle in Profile: "Use different languages for UI and exercises"
2. Show two selectors when toggle is ON
3. Keep them synchronized when toggle is OFF
4. Add new backend field `ui_language` separate from `preferred_language`

For now, keeping them unified is simpler and covers 99% of use cases.

---

**Status**: ✅ Complete and tested  
**Date**: December 2024  
**Languages**: English (en), Polski (pl)
