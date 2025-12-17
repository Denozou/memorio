# 🧠 Adaptive Difficulty Engine - Implementation Guide

## 📋 Overview

Your Memorio application now has a **fully functional Adaptive Difficulty Engine** powered by:
- **Bayesian Knowledge Tracing (BKT)** - Tracks skill mastery probability
- **Spaced Repetition (SM-2)** - Schedules optimal review times
- **Beautiful UI Components** - Shows progress and recommendations

---

## ✅ What's Been Implemented

### **Backend (Java/Spring Boot)**

#### 1. Database Schema
- **File:** `backend/src/main/resources/db/migration/V28__adaptive_difficulty_system.sql`
- **Tables:**
  - `user_skill_mastery` - Tracks BKT parameters and spaced repetition data
  - `skill_attempt_history` - Records detailed attempt history for analysis

#### 2. Entity Classes
- `UserSkillMastery.java` - BKT state and spaced repetition logic
- `SkillAttemptHistory.java` - Attempt logging

#### 3. Repositories
- `UserSkillMasteryRepository.java` - Queries for mastery and review scheduling
- `SkillAttemptHistoryRepository.java` - Attempt history queries

#### 4. Service Layer
- **File:** `AdaptiveDifficultyService.java`
- **Key Methods:**
  - `recordAttempt()` - Updates BKT and spaced repetition after each attempt
  - `getRecommendedDifficulty()` - Returns difficulty level 1-10 based on mastery
  - `getSkillsDueForReview()` - Returns skills ready for review today
  - `getMasteryStats()` - Overall statistics

#### 5. REST API
- **File:** `AdaptiveDifficultyController.java`
- **Endpoints:**
  - `GET /api/adaptive/stats` - Overall mastery statistics
  - `GET /api/adaptive/dashboard` - Complete dashboard data
  - `GET /api/adaptive/skills/review` - Skills due for review
  - `GET /api/adaptive/skills/practice` - Skills needing practice
  - `GET /api/adaptive/skills/mastered` - Mastered skills
  - `GET /api/adaptive/review-count` - Count for notification badge
  - `GET /api/adaptive/recommend/{skillType}` - Recommended difficulty

#### 6. Integration Points
- **ExerciseController** - Records attempts after exercise submission
- **QuizService** - Tracks quiz performance per article

---

### **Frontend (React/TypeScript)**

#### 1. Type Definitions
- **File:** `frontend/src/types/adaptive.ts`
- Types for all DTOs (SkillMasteryDTO, MasteryStatsDTO, DashboardDTO, etc.)

#### 2. Components

##### **AdaptiveDifficultyWidget.tsx**
Main dashboard widget showing:
- Overall mastery progress bar
- Total skills / Mastered / Due for review stats
- Skills due for review (with orange highlight)
- Skills needing practice (with progress bars)
- Click-through to exercises

##### **ReviewNotificationBadge.tsx**
- Shows count of skills due for review
- Appears on Dashboard navigation link
- Auto-refreshes on page load

##### **MasteryProgressToast.tsx** (Optional)
- Shows progress after completing exercises
- Celebrates when skills are mastered
- Can be integrated into exercise completion flow

#### 3. Dashboard Integration
- Widget appears between Badges and Recent Sessions
- Notification badge on navigation
- Fully responsive design

---

## 🎯 How It Works

### **1. User Completes Exercise**
```
User submits exercise
  ↓
ExerciseController.submit()
  ↓
adaptiveService.recordAttempt()
  ↓
Updates BKT probability (P(L))
  ↓
Updates spaced repetition schedule
  ↓
Saves to database
```

### **2. BKT Algorithm**
```
Initial mastery: 30%
Correct attempt: +10-20% (depends on difficulty)
Incorrect attempt: -5-15%
Mastered: ≥95% probability
```

### **3. Spaced Repetition**
```
First review: 1 day
Second review: 6 days
Third review: 15 days
...continues with SM-2 algorithm
```

### **4. Difficulty Recommendation**
```
Mastery < 30%  → Level 1-2 (Easy)
Mastery 30-50% → Level 3-4
Mastery 50-70% → Level 5-7
Mastery 70-85% → Level 8-9
Mastery > 85%  → Level 10 (Hard)
```

---

## 🚀 Testing Your Implementation

### **1. Backend Test**
```bash
cd backend
./mvnw spring-boot:run
```

Check logs for:
- ✅ Flyway migration V28 runs successfully
- ✅ No bean creation errors
- ✅ Controller endpoints registered

### **2. Database Verification**
```sql
-- Check tables exist
SELECT * FROM user_skill_mastery LIMIT 5;
SELECT * FROM skill_attempt_history LIMIT 5;

-- Check your data
SELECT 
    skill_type,
    probability_known,
    total_attempts,
    next_review_at
FROM user_skill_mastery
WHERE user_id = 'YOUR_USER_ID';
```

### **3. Frontend Test**

Open browser console (F12) and run:
```javascript
// Test API endpoints
fetch('/api/adaptive/stats')
  .then(r => r.json())
  .then(d => console.log('Stats:', d));

fetch('/api/adaptive/dashboard')
  .then(r => r.json())
  .then(d => console.log('Dashboard:', d));

fetch('/api/adaptive/review-count')
  .then(r => r.json())
  .then(d => console.log('Review count:', d));
```

### **4. End-to-End Test**
1. Complete 2-3 exercises
2. Refresh dashboard
3. Check "Adaptive Learning" widget appears
4. Verify mastery percentages update
5. Check notification badge shows count

---

## 📊 Understanding Your Data

### **Example Output:**
```json
{
  "stats": {
    "totalSkills": 2,
    "masteredSkills": 0,
    "skillsDueForReview": 1,
    "averageMastery": 0.41,
    "skillsNeedingPractice": 1
  },
  "skillsDueForReview": [
    {
      "skillType": "WORD_LINKING",
      "probabilityKnown": 0.115,
      "totalAttempts": 2,
      "correctAttempts": 0,
      "needsReview": true,
      "nextReviewAt": "2025-11-28T20:27:33Z"
    }
  ]
}
```

**What this means:**
- User has practiced 2 skills
- Word Linking: 11.5% mastery (struggling - needs practice)
- Number Peg: 71.4% mastery (doing well)
- 1 skill is overdue for review

---

## 🎨 UI Features

### **Dashboard Widget Shows:**
- 📊 Overall mastery progress bar
- 📈 Total skills tracked
- ✅ Mastered skills count
- ⏰ Skills due for review today
- 🎯 Skills needing practice

### **Skill Cards Display:**
- Skill name with emoji icon
- Mastery percentage
- Attempt count
- Color-coded progress bar
- Click to practice

### **Notification Badge:**
- Shows count on Dashboard link
- Orange badge for visibility
- Auto-updates on page load

---

## 🔧 Customization Options

### **Adjust BKT Parameters**
Edit `AdaptiveDifficultyService.java`:
```java
private static final double INITIAL_PROBABILITY = 0.3;  // Starting mastery
private static final double LEARNING_RATE = 0.15;       // How fast they learn
private static final double SLIP_RATE = 0.1;            // Mistake probability
```

### **Change Difficulty Mapping**
Edit `getRecommendedDifficulty()` method:
```java
if (avgMastery < 0.3) return 1;  // Adjust thresholds
if (avgMastery < 0.5) return 3;
// ... etc
```

### **Modify Review Schedule**
Edit `UserSkillMastery.updateSpaceRepetition()`:
```java
// Change initial interval
if (repetitions == 0) {
    intervalDays = 1.0;  // First review after 1 day
}
```

---

## 🐛 Troubleshooting

### **Issue: Widget shows "No skills tracked"**
- **Solution:** Complete at least one exercise first

### **Issue: API returns 404**
- **Solution:** Check backend is running and controller is registered

### **Issue: Database error**
- **Solution:** Restart backend to run Flyway migration

### **Issue: Mastery not updating**
- **Solution:** Check `ExerciseController` has `adaptiveService` injected

---

## 📈 Future Enhancements

### **Possible Additions:**
1. **Email notifications** - Daily reminder for skills due for review
2. **Difficulty auto-adjustment** - Automatically adjust exercise difficulty
3. **ML predictions** - Predict when user will forget a skill
4. **Detailed analytics** - Charts showing mastery over time
5. **Skill recommendations** - Suggest which skill to practice next
6. **Gamification** - Badges for mastery milestones
7. **Export data** - Download mastery report as PDF

---

## 🎉 Success Metrics

Your system is working if:
- ✅ Mastery increases with correct attempts
- ✅ Mastery decreases with incorrect attempts
- ✅ Review intervals increase over time
- ✅ Skills reach 95%+ mastery after ~10 correct attempts
- ✅ Dashboard shows real-time data
- ✅ Notification badge updates

---

## 📚 Resources

### **Algorithms Used:**
- **Bayesian Knowledge Tracing (BKT)** - Corbett & Anderson (1995)
- **SM-2 Spaced Repetition** - Wozniak (1990)

### **Key Concepts:**
- **P(L)** - Probability of knowing the skill
- **P(T)** - Probability of learning (transition)
- **P(S)** - Probability of slip (mistake when knowing)
- **P(G)** - Probability of guess (correct when not knowing)

---

## 🤝 Support

If you encounter issues:
1. Check backend logs for errors
2. Verify database tables exist
3. Test API endpoints in browser console
4. Check browser console for frontend errors

---

**Your Adaptive Difficulty Engine is ready to help users learn more effectively! 🚀**
