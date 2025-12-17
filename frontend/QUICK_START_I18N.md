# Quick Start: Adding Translations to Components

## 3-Step Process

### Step 1: Import the Hook
```typescript
import { useTranslation } from 'react-i18next';
```

### Step 2: Use in Component
```typescript
export default function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.title')}</h1>
    </div>
  );
}
```

### Step 3: Replace Hardcoded Text
```typescript
// Before
<button>Save Changes</button>

// After
<button>{t('common.save')}</button>
```

## Common Translation Keys

### Buttons & Actions
```typescript
{t('common.save')}          // "Save" / "Zapisz"
{t('common.cancel')}        // "Cancel" / "Anuluj"
{t('common.delete')}        // "Delete" / "Usuń"
{t('common.edit')}          // "Edit" / "Edytuj"
{t('common.submit')}        // "Submit" / "Wyślij"
{t('common.loading')}       // "Loading..." / "Ładowanie..."
{t('common.logout')}        // "Logout" / "Wyloguj"
```

### Navigation
```typescript
{t('common.dashboard')}     // "Dashboard" / "Panel główny"
{t('common.profile')}       // "Profile" / "Profil"
{t('common.exercises')}     // "Exercises" / "Ćwiczenia"
{t('common.leaderboard')}   // "Leaderboard" / "Ranking"
{t('common.learning')}      // "Learning" / "Nauka"
```

### Forms
```typescript
{t('common.email')}         // "Email" / "Email"
{t('common.password')}      // "Password" / "Hasło"
{t('common.displayName')}   // "Display Name" / "Nazwa wyświetlana"
```

## Example: Converting a Component

### Before (Hardcoded)
```typescript
export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <button>Start Workout</button>
      <p>Total Points: {points}</p>
    </div>
  );
}
```

### After (Translated)
```typescript
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <button>{t('dashboard.startWorkout')}</button>
      <p>{t('dashboard.totalPoints')}: {points}</p>
    </div>
  );
}
```

## Available Namespaces

- `common.*` - Shared UI elements
- `auth.*` - Login, signup, password
- `dashboard.*` - Dashboard content
- `exercises.*` - Exercise pages
- `profile.*` - Profile settings
- `leaderboard.*` - Ranking page
- `learning.*` - Learning hub
- `admin.*` - Admin panel
- `errors.*` - Error messages
- `navigation.*` - Menus

## Need a New Translation?

1. Add to `/frontend/src/locales/en.json`:
```json
{
  "mySection": {
    "myKey": "My English Text"
  }
}
```

2. Add to `/frontend/src/locales/pl.json`:
```json
{
  "mySection": {
    "myKey": "Mój Polski Tekst"
  }
}
```

3. Use in component:
```typescript
{t('mySection.myKey')}
```

## Tips

✅ **Do:**
- Use descriptive key names
- Group related translations
- Keep translations in sync between languages

❌ **Don't:**
- Leave hardcoded strings
- Use generic keys like `text1`, `label2`
- Forget to add translations to both language files
