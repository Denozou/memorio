# Exercise Language Not Changing - Diagnosis

## Problem
After changing language from English to Polish, the UI changes but exercise words are still in English.

## Root Cause
The backend determines exercise language based on the user's `preferredLanguage` field, but this is loaded when the user logs in and may be cached in the session.

## How Exercise Language Works

### Backend Flow
```
1. User logs in
2. Backend loads user profile (including preferredLanguage)
3. User starts exercise: POST /exercises/start
4. Backend uses preferredLanguage to fetch words from lexicon
5. Returns words in that language
```

### The Issue
When you change language via the Profile page:
1. ✅ UI changes immediately (frontend)
2. ✅ Database updates (PUT /users/profile)
3. ❌ **Backend session still has old language cached**
4. ❌ Next exercise still uses old language

## Solutions

### Solution 1: Logout and Login (Current Workaround)
**Steps:**
1. Change language in Profile
2. Logout
3. Login again
4. Start exercise - words will be in new language

**Why it works:** Fresh login loads new `preferredLanguage` from database

### Solution 2: Reload User Profile After Language Change (Recommended)
Update `LanguageContext` to reload user profile after changing language.

**Implementation:**
```typescript
// In LanguageContext.tsx - changeLanguage function
const changeLanguage = async (lang: LanguageCode) => {
  // ... existing code ...
  
  // After saving to backend
  if (token) {
    await api.put('/users/profile', { preferredLanguage: lang });
    
    // RELOAD user profile to refresh backend session
    await api.get('/users/profile');
  }
};
```

### Solution 3: Backend Session Refresh Endpoint
Create a backend endpoint to refresh the user session without logout/login.

**Backend:**
```java
@PostMapping("/users/refresh-session")
public ResponseEntity<?> refreshSession(Authentication auth) {
    // Reload user from database
    // Update session with fresh data
    return ResponseEntity.ok().build();
}
```

**Frontend:**
```typescript
// After changing language
await api.post('/users/refresh-session');
```

### Solution 4: Pass Language to Exercise Endpoint
Modify exercise endpoint to accept language parameter.

**Backend:**
```java
@PostMapping("/exercises/start")
public ExerciseResponse start(@RequestBody StartRequest req, 
                              @RequestParam(required = false) String language) {
    // Use language param if provided, otherwise use user's preferredLanguage
}
```

**Frontend:**
```typescript
const { data } = await api.post("/exercises/start", {
  type: "WORD_LINKING",
  language: currentLanguage  // Pass current UI language
});
```

## Recommended Fix

**Option A: Simple (No Backend Changes)**
Add a note in the UI telling users to refresh the page or re-login after changing language.

```tsx
// In LanguageSelector after changing language
<p className="text-sm text-amber-600">
  Language changed! Please refresh the page or re-login for exercises to update.
</p>
```

**Option B: Better UX (Small Backend Check)**
After changing language, reload the user profile:

```typescript
// In LanguageContext.tsx
await api.put('/users/profile', { preferredLanguage: lang });
// Force reload profile to update backend session
await api.get('/users/profile');
```

**Option C: Best (Requires Backend Change)**
Modify backend to not cache `preferredLanguage` in session, always load fresh from database when starting exercises.

## Testing Steps

1. Login with English account
2. Start Word Linking exercise - verify English words
3. Go to Profile, change to Polski
4. **Without logging out**, start new Word Linking exercise
5. Check if words are in Polish

**Expected:** Words should be in Polish
**Actual:** Words are still in English (session cache issue)

## Temporary Workaround for Users

**Add this to Profile page after language change:**
```tsx
{success && (
  <div className="alert">
    Language changed! Please refresh the page for exercises to update.
    <button onClick={() => window.location.reload()}>
      Refresh Now
    </button>
  </div>
)}
```

---

**Status:** Diagnosed - Needs backend session refresh
**Recommended:** Add page refresh prompt after language change
**Best Solution:** Backend should reload user profile on each exercise start
