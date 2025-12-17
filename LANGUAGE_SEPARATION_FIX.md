# Language Separation Fix

## Problem
After implementing i18n, there was confusion between two different language settings:
1. **UI Language** - Which language the interface is displayed in (English/Polish)
2. **Dataset Language** - Which language dataset to use for exercises (from backend)

The initial implementation incorrectly merged these two concepts.

## Solution
Separated the two language systems completely:

### 1. UI Language (Frontend Only)
- **Storage**: `localStorage` with key `memorio_ui_language`
- **Purpose**: Controls interface translations (buttons, labels, menus)
- **Managed by**: `LanguageContext` + `LanguageSelector` component
- **Languages**: English (en), Polski (pl)
- **Does NOT** sync with backend

### 2. Dataset Language (Backend)
- **Storage**: Backend database (`users.preferred_language`)
- **Purpose**: Controls which language dataset to use for exercises
- **Managed by**: Profile form + `/users/profile` API endpoint
- **Languages**: Fetched from `/lexicon/languages` endpoint
- **Syncs with backend** when user saves profile

## Implementation Details

### Profile Page Structure
The Profile page now has TWO separate language selectors:

```typescript
// 1. UI Language Selector (always visible)
<div>
  <h4>{t('profile.uiLanguage')}</h4>
  <LanguageSelector />  // Changes interface language instantly
</div>

// 2. Dataset Language Selector (only in edit mode)
<div>
  <label>{t('profile.datasetLanguage')}</label>
  <select value={formData.preferredLanguage}>
    {languages.map(...)}  // Options from /lexicon/languages
  </select>
  <p>{t('profile.datasetLanguageDesc')}</p>
</div>
```

### LanguageContext Changes
**Before:**
- Loaded from `/users/language` endpoint
- Saved to backend on change
- Confused UI and dataset languages

**After:**
- Loads from `localStorage.getItem('memorio_ui_language')`
- Saves to `localStorage.setItem('memorio_ui_language', lang)`
- **Does NOT** call backend APIs
- Completely independent from dataset language

### Key Files Modified

1. **`/frontend/src/contexts/LanguageContext.tsx`**
   - Removed `/users/language` API calls
   - Changed localStorage key to `memorio_ui_language`
   - Added comments explaining separation

2. **`/frontend/src/routes/Profile.tsx`**
   - Restored dataset language selector
   - Added UI language selector
   - Both selectors visible with clear labels

3. **`/frontend/src/i18n/config.ts`**
   - Updated localStorage key to `memorio_ui_language`

4. **Translation files**
   - Added `profile.uiLanguage`
   - Added `profile.datasetLanguage`
   - Added `profile.datasetLanguageDesc`

## User Experience

### Changing UI Language
1. Click globe icon (🌐) or go to Profile
2. Select language from "Interface Language" dropdown
3. UI changes **immediately**
4. Saved to browser localStorage
5. **No backend sync** - works offline

### Changing Dataset Language
1. Go to Profile
2. Click "Edit" button
3. Change "Exercise Content Language" dropdown
4. Click "Save Changes"
5. Syncs to backend via `/users/profile`
6. Affects which words/names appear in exercises

## API Endpoints

### UI Language
- **No API calls** - localStorage only

### Dataset Language
```
GET /users/profile
Response: { preferredLanguage: "en", ... }

PUT /users/profile
Body: { preferredLanguage: "pl", ... }
```

### Available Datasets
```
GET /lexicon/languages
Response: [{ code: "en", count: 1000 }, { code: "pl", count: 500 }]
```

## Testing Checklist

- [x] UI language changes instantly without page reload
- [x] UI language persists in localStorage
- [x] UI language works when not logged in
- [x] Dataset language shows in Profile (edit mode)
- [x] Dataset language saves to backend
- [x] Dataset language loads from backend
- [x] Both selectors are clearly labeled
- [x] Changing UI language doesn't affect dataset language
- [x] Changing dataset language doesn't affect UI language

## Benefits of This Approach

1. **Clear Separation**: Users understand the difference
2. **Offline UI**: UI language works without backend
3. **Backend Control**: Dataset language controlled by backend
4. **Independent**: Changing one doesn't affect the other
5. **Flexible**: Can have Polish UI with English exercises, or vice versa

## Example Scenarios

### Scenario 1: Polish User Learning English
- **UI Language**: Polski (pl)
- **Dataset Language**: English (en)
- **Result**: Polish interface, English words in exercises

### Scenario 2: English User Learning Polish
- **UI Language**: English (en)
- **Dataset Language**: Polski (pl)
- **Result**: English interface, Polish words in exercises

### Scenario 3: Polish User, Polish Exercises
- **UI Language**: Polski (pl)
- **Dataset Language**: Polski (pl)
- **Result**: Everything in Polish

## Future Considerations

If you want to sync UI language with backend in the future:
1. Create a new field `ui_language` in the database
2. Create new endpoints `/users/ui-language`
3. Update `LanguageContext` to use these endpoints
4. Keep it separate from `preferred_language` (dataset)

---

**Status**: ✅ Fixed and tested
**Date**: December 2024
