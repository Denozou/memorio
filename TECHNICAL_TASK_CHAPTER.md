# Technical Task

## 1. System Overview

### 1.1 Introduction and Domain

Memorio is a web-based memory training application designed to help users improve their cognitive abilities through scientifically-grounded exercises and adaptive learning techniques. The system combines practical memory exercises with theoretical educational content, providing users with both the tools to practice memorization and the knowledge to understand the underlying mnemonic techniques. The application targets individuals seeking to enhance their memory capabilities, whether for academic purposes, professional development, or personal improvement.

The core premise of the system rests on established memory techniques such as the Method of Loci, the Major System for number memorization, and associative linking for word sequences. Rather than simply presenting static exercises, Memorio implements an adaptive difficulty engine that adjusts the challenge level based on individual user performance, ensuring that each learner operates within their optimal zone of proximal development.

### 1.2 High-Level Architecture

The system follows a client-server architecture with a clear separation between the presentation layer and the business logic layer. The backend is implemented as a RESTful API service built on the Spring Boot framework version 3.5.5, utilizing Java 21 as the runtime environment. The frontend is a single-page application constructed with React 19 and TypeScript, employing Vite as the build tool and development server. Communication between the two layers occurs exclusively through HTTP requests, with authentication state maintained via HTTP-only cookies containing JSON Web Tokens.

Data persistence is handled by PostgreSQL, chosen for its robust support for complex queries, UUID primary keys, and the case-insensitive text extension required for email handling. The database schema is managed through Flyway migrations, ensuring reproducible and version-controlled schema evolution. Redis serves as a distributed caching layer for session management and performance optimization, particularly for rate limiting buckets and frequently accessed data.

The deployment architecture employs Docker containerization, with separate containers for the backend service, frontend static file server, Redis cache, and an Nginx reverse proxy that routes requests to the appropriate service. This containerized approach facilitates consistent deployment across development, staging, and production environments.

### 1.3 Technology Stack

The backend technology stack centers on Spring Boot, which provides dependency injection, auto-configuration, and a comprehensive ecosystem for building enterprise applications. Spring Security handles authentication and authorization, while Spring Data JPA abstracts database operations through repository interfaces. The jjwt library manages JSON Web Token generation and validation, and the Bucket4j library implements token bucket rate limiting with Caffeine as the in-memory cache for rate limit state.

For user authentication beyond traditional credentials, the system integrates Spring Security OAuth2 Client to support social login through Google and Facebook identity providers. Two-factor authentication employs the TOTP protocol compatible with authenticator applications such as Google Authenticator, with QR code generation handled by the ZXing library. Email functionality for verification and password reset operations utilizes Spring Boot Mail with SMTP transport.

The frontend employs React with functional components and hooks as the primary UI library. React Router provides client-side routing, while Axios handles HTTP communication with automatic credential inclusion and response interceptors for token refresh. Styling is accomplished through Tailwind CSS version 4, enabling rapid development of responsive interfaces with utility classes. The Framer Motion library provides animation capabilities for enhanced user experience, and Lucide React supplies the icon set. Internationalization support comes from i18next with browser language detection.

## 2. Data Model and Persistence

### 2.1 Database Foundation and Extensions

The persistence layer utilizes PostgreSQL as the relational database management system, selected for its advanced features including native UUID support, the CITEXT extension for case-insensitive text handling, robust transaction semantics, and excellent performance characteristics for mixed read-write workloads. The database schema initialization begins with enabling required extensions through the initial migration script, specifically the pgcrypto extension that provides the gen_random_uuid() function for generating universally unique identifiers as primary keys throughout the schema.

All tables in the system employ UUIDs as primary keys rather than sequential integers. This design choice offers several advantages relevant to a distributed application context. UUIDs can be generated client-side without database coordination, enabling optimistic record creation patterns. They do not reveal information about record counts or creation order to external observers, improving security posture. They also facilitate potential future horizontal scaling scenarios where multiple database instances might need to generate non-conflicting identifiers.

Timestamp columns throughout the schema use the TIMESTAMPTZ data type, which stores timestamps with timezone information as UTC internally while presenting them in the session timezone for queries. This approach ensures consistent temporal ordering regardless of user timezone while supporting localized display. Most tables include created_at and updated_at timestamp columns, with the latter maintained automatically through PostgreSQL trigger functions that execute before each UPDATE operation, setting the updated_at value to the current timestamp.

### 2.2 User Management Schema

The foundational entity in the data model is the User, stored in the users table with a UUID primary key generated by PostgreSQL's gen_random_uuid function. The table definition specifies the following columns with their respective constraints and purposes.

The id column serves as the primary key with UUID type and a default value generated by gen_random_uuid(), ensuring every user record receives a globally unique identifier upon creation. The email column employs the CITEXT extension type rather than standard VARCHAR, enabling case-insensitive storage and comparison. This extension means that queries matching on email automatically perform case-insensitive comparisons without requiring explicit LOWER() function calls. The column carries NOT NULL and UNIQUE constraints, ensuring every user has exactly one email address that is distinct from all other users.

The password_hash column stores bcrypt-hashed passwords as TEXT type with nullable constraint. The nullable design accommodates users who register exclusively through OAuth2 providers and thus have no local password. When a password is present, it contains the complete bcrypt output including the algorithm identifier, cost factor, salt, and hash value in a single string, enabling future verification without separate salt storage.

The display_name column provides a VARCHAR(100) field for the user's preferred display name in the interface, defaulting to their email prefix if not explicitly set. The role column stores the user's authorization level as a VARCHAR enumeration with values USER and ADMIN, defaulting to USER and marked NOT NULL to ensure every user has a defined role. The skill_level column tracks the user's current difficulty tier as an INTEGER ranging from one to ten, defaulting to one for new users and adjusting dynamically based on exercise performance.

The preferred_language column stores the user's language preference as a VARCHAR(8) ISO language code such as "en" for English or "uk" for Ukrainian. This setting determines the language of exercise content, particularly for word selection in the word linking exercise and hint words in the number peg exercise. The picture_url column stores an optional URL to the user's profile picture, typically populated from OAuth2 provider profile data.

The email_verified column is a BOOLEAN defaulting to FALSE that tracks whether the user has confirmed their email address through the verification flow. The two_factor_enabled column is a BOOLEAN defaulting to FALSE indicating whether the user has activated two-factor authentication. The two_factor_secret column stores the Base32-encoded TOTP secret key as TEXT when two-factor authentication is configured, with the value shared between the server and the user's authenticator application. The backup_codes column stores a comma-separated list of bcrypt-hashed backup codes as TEXT, each usable once for account recovery. The two_factor_enabled_at column records the timestamp when two-factor authentication was activated, providing an audit trail.

The created_at and updated_at columns track record lifecycle with TIMESTAMPTZ type, the former defaulting to NOW() on insert and the latter maintained by the set_updated_at trigger function. An index on the email column accelerates login lookups, while a partial index on two_factor_enabled where the value is TRUE supports efficient queries for two-factor-enabled users during security audits.

### 2.3 OAuth2 Identity Management

To support multiple authentication methods per user, the system employs the user_identities table that stores OAuth2 provider associations separately from the main user record. This normalized design enables a single user account to link with multiple social login providers while maintaining a unified identity within the application. The table structure supports scenarios where a user initially registers with Google but later adds Facebook as an alternative login method.

The user_identities table contains an id column as UUID primary key with default generation, a user_id column as UUID foreign key referencing the users table with ON DELETE CASCADE ensuring identity records are removed when users are deleted, a provider column as VARCHAR(32) storing the provider identifier such as "google" or "facebook", and a provider_user_id column as VARCHAR(255) storing the unique identifier assigned by that provider for the user.

The table enforces two uniqueness constraints critical for correct OAuth2 operation. A composite unique constraint on provider and provider_user_id ensures that each provider account links to at most one local user, preventing scenarios where the same Google account could be associated with multiple Memorio accounts. A unique index on user_id and provider ensures each user has at most one identity per provider, preventing duplicate provider registrations for a single user.

The created_at and updated_at columns track when the identity was first linked and last updated, with the latter maintained by the set_updated_at trigger. This timestamp tracking supports audit requirements and helps identify stale identity records.

### 2.4 Email Verification and Password Reset

The verification_tokens table stores tokens for email verification and password reset flows with appropriate security controls and expiration tracking. The table design treats both token types uniformly while distinguishing them through a type enumeration, enabling shared infrastructure for token generation, validation, and cleanup.

The id column serves as UUID primary key with default generation. The user_id column references the users table with ON DELETE CASCADE, linking each token to its owning user. The token column stores the cryptographically random token string as VARCHAR(255) with a UNIQUE constraint, ensuring no two tokens share the same value and enabling efficient lookups by token. The token_type column is VARCHAR(50) constrained by a CHECK constraint to contain only EMAIL_VERIFICATION or PASSWORD_RESET values.

The expires_at column stores the token expiration timestamp as TIMESTAMPTZ, typically set to 24 hours after creation for email verification tokens and one hour for password reset tokens. The used_at column is nullable TIMESTAMPTZ that records when the token was consumed, providing an audit trail and enabling reuse prevention without immediate deletion. The created_at column tracks token creation time.

Indexes on token, user_id, and expires_at columns support efficient lookup operations and cleanup queries that remove expired tokens. The token index enables O(1) lookup during verification, the user_id index supports querying tokens by user, and the expires_at index accelerates cleanup operations that delete tokens past their expiration.

### 2.5 Exercise and Session Schema

Exercise sessions are recorded in the exercise_sessions table, designed to capture the complete lifecycle of a user's exercise attempt from initiation through completion. The table structure supports the session-based exercise model where users start an exercise, receive content to memorize, and submit their recall attempts.

The id column is UUID primary key identifying the session, generated by the application upon session start. The user_id column is UUID foreign key referencing users with ON DELETE CASCADE, linking each session to the user who initiated it. The type column is VARCHAR(64) storing the exercise type identifier, with values including WORD_LINKING for sequential word memorization, NAMES_FACES for face-name association, NUMBER_PEG for digit sequence recall, and DAILY_CHALLENGE for curated daily exercises. The started_at column is TIMESTAMPTZ defaulting to NOW() recording when the session was initiated. The finished_at column is nullable TIMESTAMPTZ recording when the session was completed through answer submission.

An index on user_id supports efficient retrieval of a user's exercise history. The StreakService queries this table to compute practice streaks by extracting unique dates from session timestamps grouped by the user's timezone.

Individual attempts within a session are stored in the exercise_attempts table, capturing the detailed interaction between presented content and user responses. This granular recording enables analysis of user performance patterns, supports adaptive difficulty calculations, and provides data for future machine learning enhancements.

The id column is UUID primary key identifying the attempt. The session_id column is UUID foreign key referencing exercise_sessions with ON DELETE CASCADE, linking attempts to their parent session. The created_at column is TIMESTAMPTZ defaulting to NOW() recording when the attempt was submitted. The shown_words_json column stores the items presented to the user as a JSON array serialized to TEXT, preserving the exact sequence shown during the memorization phase. The answers_json column stores the user's responses as a JSON array serialized to TEXT, preserving their answer sequence for order accuracy calculation.

The total column is INTEGER recording the count of items presented. The correct column is INTEGER recording the count of correctly recalled items. The accuracy column is DOUBLE PRECISION storing the calculated accuracy as a ratio between zero and one. These denormalized values avoid repeated computation during history retrieval and reporting.

### 2.6 Gamification Schema

The gamification system tracks user engagement through points accumulation and badge achievements, stored in dedicated tables that aggregate exercise performance into cumulative metrics. These statistics drive leaderboard rankings and provide visible progress indicators that motivate continued engagement.

The user_stats table maintains aggregate statistics for each user with a one-to-one relationship to the users table. The user_id column serves as both primary key and foreign key referencing users with ON DELETE CASCADE, ensuring each user has at most one statistics record. The total_points column is BIGINT defaulting to zero accumulating all points earned through exercises. The total_attempts column is BIGINT defaulting to zero counting completed exercise submissions. The total_correct column is BIGINT defaulting to zero accumulating correct responses across all attempts. These statistics persist indefinitely and never decrease, providing cumulative engagement metrics.

The user_badges table records achievement awards with a many-to-one relationship to users. The id column is UUID primary key. The user_id column is UUID foreign key referencing users with ON DELETE CASCADE. The code column is VARCHAR(64) storing the badge identifier such as FIRST_ATTEMPT or STREAK_7. The awarded_at column is TIMESTAMPTZ defaulting to NOW() recording when the badge was earned. A composite unique constraint on user_id and code ensures each user can earn each badge type at most once. An index on user_id supports efficient retrieval of a user's badges for dashboard display.

### 2.7 Lexicon Schema

The word linking exercise draws vocabulary from the words table, containing curated word lists organized by language with difficulty indicators based on word frequency. This design supports multilingual exercises while enabling difficulty-appropriate word selection based on user skill level.

The id column is UUID primary key. The language column is VARCHAR(8) storing the ISO language code such as "en" for English. The text column is VARCHAR(128) storing the word as displayed to users. The lemma column is VARCHAR(128) storing the dictionary form of the word, useful for linguistic analysis and future lemma-based grouping. The pos column is VARCHAR(16) storing the part of speech tag such as NOUN, VERB, or ADJECTIVE. The freq_rank column is INTEGER storing the word's frequency rank within its language, with lower values indicating more common words.

A unique composite index on language and lower(text) ensures each word appears at most once per language while performing case-insensitive duplicate detection. An index on language and freq_rank supports efficient queries for word selection at appropriate difficulty levels, enabling the WordPicker service to select words with frequency ranks appropriate to the user's skill level.

### 2.8 Face Memorization Schema

The names and faces exercise utilizes face images stored in the database rather than the filesystem, enabling atomic deployments without separate asset management and simplifying backup procedures. The schema employs a two-table design separating person metadata from image binary data.

The persons table stores individual records for people whose faces appear in exercises. The id column is UUID primary key with default generation. The person_name column is VARCHAR(100) with NOT NULL and UNIQUE constraints storing the identifier from the source dataset, formatted with underscores such as "John_Doe". The display_name column is VARCHAR(100) NOT NULL storing the human-readable name shown to users, such as "John Doe". The difficulty_level column is INTEGER NOT NULL defaulting to one, with values one through three representing Easy, Medium, and Hard difficulty respectively. The is_active column is BOOLEAN NOT NULL defaulting to TRUE controlling whether the person appears in exercises, enabling deactivation without deletion.

Indexes on person_name support fast lookups when loading person records. A composite index on difficulty_level and is_active supports efficient querying for exercise content, enabling the FacePickerService to select active persons at appropriate difficulty levels.

The face_images table stores binary image data with metadata. The id column is UUID primary key with default generation. The person_id column is UUID foreign key referencing persons with ON DELETE CASCADE, linking each image to its subject. The filename column is VARCHAR(150) storing the original filename for reference. The image_data column is BYTEA storing the binary image content, supporting images of any size though typical face images are under 100KB each. The content_type column is VARCHAR(50) defaulting to "image/jpeg" storing the MIME type for correct HTTP response headers. The file_size column is BIGINT storing the image size in bytes. The width and height columns are nullable INTEGER storing image dimensions in pixels. The is_primary column is BOOLEAN NOT NULL defaulting to FALSE indicating whether this is the primary image for display.

A unique partial index on person_id where is_primary is TRUE ensures each person has at most one primary image, preventing conflicting primary designations. Indexes on person_id and the composite of person_id and filename support efficient image retrieval for exercise rendering and API serving.

### 2.9 Number Peg Hints Schema

The number peg exercise implements the Major System mnemonic technique where digits zero through nine are associated with consonant sounds, and memorable words are constructed using those sounds. The number_peg_hints table stores these digit-to-word associations for each supported language, enabling localized mnemonic training.

The table employs a composite primary key of digit (INTEGER) and language (VARCHAR(12)), uniquely identifying each digit-language combination. The hint_word column is VARCHAR(100) NOT NULL storing the mnemonic word associated with that digit in that language. For example, in English the digit 3 is associated with "Tree" because both contain the "t" sound in the Major System.

The schema includes seed data inserted during migration, populating English and Polish hint words. English hints use the sound-based Major System associations such as "Sun" for 1, "Shoe" for 2, and "Tree" for 3. An index on language supports efficient retrieval of all hints for a given language when generating exercise content.

### 2.10 Learning Content Schema

Educational articles are stored in the learning_articles table with comprehensive metadata supporting content organization, access control, and curriculum sequencing. The schema design supports a structured learning path where users progress through articles within technique categories, completing quizzes to unlock subsequent content.

The id column is UUID primary key with default generation. The slug column is VARCHAR(100) UNIQUE NOT NULL storing a URL-friendly identifier such as "method-of-loci-basics". The title column is VARCHAR(200) NOT NULL storing the article's display title. The subtitle column is VARCHAR(300) storing an optional tagline or summary.

The technique_category column is VARCHAR(50) NOT NULL storing the category identifier such as METHOD_OF_LOCI, STORY_METHOD, or PAO_SYSTEM, grouping related articles together. The difficulty_level column is INTEGER NOT NULL defaulting to one indicating article complexity from beginner to advanced. The content_markdown column is TEXT NOT NULL storing the article body in Markdown format, supporting rich text formatting, images, and code blocks through Markdown syntax.

The cover_image_url column is TEXT storing an optional URL to an external cover image. The cover_image_id column is UUID storing a reference to an uploaded cover image in the article_images table, with either URL or uploaded image providing the cover. The author column is VARCHAR(100) storing optional author attribution. The estimated_read_minutes column is INTEGER NOT NULL defaulting to five providing reading time estimates for user planning.

The required_skill_level column is INTEGER NOT NULL defaulting to one specifying the minimum user skill level required for access. The sequence_in_category column is INTEGER NOT NULL specifying the article's position within its category sequence, controlling progression order. The is_intro_article column is BOOLEAN NOT NULL indicating whether the article serves as a category introduction accessible without prerequisites. The is_published column is BOOLEAN NOT NULL defaulting to FALSE controlling article visibility to non-administrative users.

Indexes support common query patterns: on technique_category for category-based listing, a partial index on is_published where TRUE for efficient published article queries, on required_skill_level for access control queries, and on sequence_in_category for ordering within categories. The set_updated_at trigger maintains the updated_at timestamp.

### 2.11 Quiz System Schema

The quiz subsystem spans three tables implementing multiple-choice assessments that validate comprehension of learning content and gate progression to subsequent articles.

The article_quizzes table establishes the quiz-article relationship with one quiz per article. The id column is UUID primary key. The article_id column is UUID foreign key referencing learning_articles with ON DELETE CASCADE and a UNIQUE constraint ensuring one quiz per article. The title column is VARCHAR(200) NOT NULL storing the quiz display title. The passing_score column is INTEGER NOT NULL defaulting to 70 specifying the percentage required to pass, typically 70 percent.

The quiz_questions table stores individual questions for each quiz. The id column is UUID primary key. The quiz_id column is UUID foreign key referencing article_quizzes with ON DELETE CASCADE. The question_text column is TEXT NOT NULL storing the question content. The question_type column is VARCHAR(30) NOT NULL defaulting to MULTIPLE_CHOICE indicating the question format, with future expansion possible to TRUE_FALSE or FILL_BLANK types. The display_order column is INTEGER NOT NULL defaulting to zero controlling question sequence. The explanation column is TEXT storing optional explanation text shown after answering.

Indexes on quiz_id and the composite of quiz_id and display_order support efficient question retrieval in display order.

The quiz_question_options table stores answer choices for each question. The id column is UUID primary key. The question_id column is UUID foreign key referencing quiz_questions with ON DELETE CASCADE. The option_text column is TEXT NOT NULL storing the choice content. The is_correct column is BOOLEAN NOT NULL defaulting to FALSE indicating whether this option is the correct answer, with exactly one correct option expected per question. The display_order column is INTEGER NOT NULL defaulting to zero controlling option sequence, with a unique constraint on question_id and display_order preventing duplicate orderings.

### 2.12 User Learning Progress Schema

The user_article_progress table tracks individual user advancement through learning content, recording reading completion and quiz performance for each article. This progress data drives the sequential unlocking mechanism and provides completion statistics.

The id column is UUID primary key. The user_id column is UUID foreign key referencing users with ON DELETE CASCADE. The article_id column is UUID foreign key referencing learning_articles with ON DELETE CASCADE. A unique constraint on user_id and article_id ensures one progress record per user per article.

The has_read column is BOOLEAN NOT NULL defaulting to FALSE indicating whether the user has opened and viewed the article. The first_read_at column is nullable TIMESTAMPTZ recording when the article was first accessed. The quiz_completed column is BOOLEAN NOT NULL defaulting to FALSE indicating whether the user has passed the associated quiz. The quiz_score column is nullable INTEGER storing the highest quiz score achieved as a percentage. The quiz_attempts column is INTEGER NOT NULL defaulting to zero counting total quiz submission attempts. The quiz_completed_at column is nullable TIMESTAMPTZ recording when the quiz was first passed.

Indexes on user_id and article_id support efficient progress lookup. A partial index on user_id and quiz_completed where quiz_completed is TRUE accelerates completion queries.

### 2.13 Adaptive Difficulty Schema

The adaptive difficulty engine implements Bayesian Knowledge Tracing combined with spaced repetition scheduling through two tables: user_skill_mastery for current state and skill_attempt_history for detailed attempt logging.

The user_skill_mastery table maintains the current knowledge state estimate for each skill-user combination. The id column is UUID primary key. The user_id column is UUID foreign key referencing users with ON DELETE CASCADE. The skill_type column is VARCHAR(50) NOT NULL storing the skill identifier such as WORD_LINKING, NAMES_FACES, NUMBER_PEG, or QUIZ. The concept_id column is VARCHAR(100) storing an optional finer-grained concept identifier, such as an article UUID for quiz mastery tracking.

The Bayesian Knowledge Tracing parameters occupy four columns. The probability_known column is DOUBLE PRECISION NOT NULL defaulting to 0.3, representing the current estimate that the user has mastered this skill, ranging from zero to one. The probability_learned column is DOUBLE PRECISION NOT NULL defaulting to 0.1, representing the probability of learning from a single practice opportunity. The probability_slip column is DOUBLE PRECISION NOT NULL defaulting to 0.1, representing the probability of an incorrect response despite mastery. The probability_guess column is DOUBLE PRECISION NOT NULL defaulting to 0.25, representing the probability of a correct response through guessing without mastery.

Performance tracking columns include total_attempts as INTEGER NOT NULL defaulting to zero counting all attempts, correct_attempts as INTEGER NOT NULL defaulting to zero counting correct attempts, and last_attempt_at as nullable TIMESTAMPTZ recording the most recent practice time.

Spaced repetition columns include next_review_at as nullable TIMESTAMPTZ indicating when the skill should next be reviewed, review_interval_days as DOUBLE PRECISION defaulting to 1.0 storing the current inter-review interval in days, and ease_factor as DOUBLE PRECISION defaulting to 2.5 storing the SM-2 ease factor that modulates interval growth.

A unique constraint on user_id, skill_type, and concept_id ensures one mastery record per skill per user per concept. Indexes on user_id, skill_type, next_review_at, and a partial index on probability_known where at least 0.95 support efficient queries for review scheduling and mastery statistics.

The skill_attempt_history table preserves detailed attempt records for analysis and debugging. The id column is UUID primary key. The user_id column is UUID foreign key referencing users with ON DELETE CASCADE. The skill_mastery_id column is UUID foreign key referencing user_skill_mastery with ON DELETE CASCADE. The exercise_session_id column is nullable UUID foreign key referencing exercise_sessions with ON DELETE CASCADE.

Attempt details include skill_type as VARCHAR(50) NOT NULL, difficulty_level as INTEGER NOT NULL, was_correct as BOOLEAN NOT NULL, and response_time_ms as nullable INTEGER. Context at attempt time includes time_since_last_practice_hours as nullable DOUBLE PRECISION and user_skill_level_at_time as nullable INTEGER. BKT state snapshots include probability_known_before and probability_known_after as DOUBLE PRECISION for analysis of knowledge state evolution.

Indexes on user_id, skill_mastery_id, exercise_session_id, and created_at descending support efficient history queries and cleanup operations.

## 3. Authentication and Security

### 3.1 User Registration Flow

New users register by submitting an email address, display name, password, and optional language preference to the registration endpoint. The AuthService first validates that no existing account uses the provided email, throwing a DuplicateEmailException if a conflict exists. The password undergoes validation for minimum length and complexity requirements before being hashed using bcrypt through Spring Security's PasswordEncoder interface.

Upon successful account creation, the system generates an email verification token stored in the verification_tokens table with a 24-hour expiration period. The VerificationService dispatches an email containing a verification link that includes this token as a query parameter. The email is sent asynchronously to avoid blocking the registration response, and the system continues even if email delivery fails when email functionality is disabled in configuration.

After persisting the new user record, the registration endpoint generates both an access token and a refresh token, setting them as HTTP-only cookies in the response. The access token contains the user's UUID as the subject claim, their email, role information, and a type indicator distinguishing it from refresh tokens. The new user is immediately logged in and redirected to the dashboard, though certain features may require email verification.

### 3.2 Authentication Mechanisms

The primary authentication mechanism accepts email and password credentials through the login endpoint. Before processing credentials, the endpoint consults the RateLimitService to verify that the requesting IP address has not exceeded the login attempt threshold, returning a 429 status if rate limited. Additionally, the LoginAttemptService checks whether the specific email account is temporarily locked due to repeated failed attempts, implementing progressive lockout as a brute-force deterrent.

If the credentials validate successfully, the system checks whether the user has two-factor authentication enabled. For users with two-factor authentication, the response returns a temporary token rather than full authentication cookies. This temporary token, valid for five minutes, must be presented along with a valid TOTP code or backup code to complete authentication. Users without two-factor authentication receive their access and refresh tokens immediately.

OAuth2 authentication supports Google and Facebook as identity providers, configured through Spring Security's OAuth2 client support. When a user initiates OAuth2 login, they are redirected to the provider's authorization page, then back to the application's callback endpoint with an authorization code. The OAuth2AuthenticationSuccessHandler processes the callback, extracting user information from the OAuth2 principal, creating or updating the local user record and identity association, generating JWT tokens, and redirecting to the frontend with tokens set as cookies.

### 3.3 Token Management

JSON Web Tokens serve as the authentication mechanism, with separate access and refresh token types distinguished by a "typ" claim. Access tokens have a configurable expiration defaulting to 60 minutes and contain user identification, email, and role claims. Refresh tokens have a longer expiration defaulting to seven days and contain only the user identifier and type marker.

The JwtService handles token generation using the HS256 signing algorithm with a secret key of at least 32 bytes loaded from environment configuration. Token validation verifies the signature, checks expiration, and confirms the issuer claim matches the expected value. Invalid or expired tokens result in authentication failure.

The frontend Axios client includes an interceptor that detects 401 responses and automatically attempts token refresh by calling the refresh endpoint. If refresh succeeds, the original request is retried with the new credentials. If refresh fails, the user is logged out and redirected to the login page. This transparent refresh mechanism provides session continuity without requiring explicit user action.

### 3.4 Two-Factor Authentication

Two-factor authentication setup begins when an authenticated user requests the setup endpoint, which generates a new TOTP secret using the totp library. The response includes the secret key, a QR code data URL for scanning with authenticator applications, a manual entry key formatted for hand-typing, and a set of eight backup codes. The secret is stored on the user record, and the backup codes are bcrypt-hashed before storage.

To activate two-factor authentication, the user must confirm setup by providing a valid TOTP code generated by their authenticator application. The TwoFactorAuthService validates the code against the stored secret, checking the current time window and adjacent windows to accommodate clock drift. Upon successful validation, the two_factor_enabled flag is set and a timestamp recorded.

During subsequent logins, users with enabled two-factor authentication must complete verification by providing either a current TOTP code or one of their backup codes. Backup codes are single-use; upon successful verification with a backup code, that code's hash is removed from the stored list. If all backup codes are exhausted, the user must use TOTP codes or disable and re-enable two-factor authentication.

Disabling two-factor authentication requires the user to provide both their account password and a valid TOTP code, ensuring that an attacker who gains access to an active session cannot simply disable the protection. Upon successful verification, the secret, backup codes, and enabled flag are cleared from the user record.

### 3.5 Password Reset

Password reset follows a token-based flow initiated by submitting an email address to the reset request endpoint. To prevent email enumeration, the endpoint returns a success response regardless of whether the email exists in the system. If the email corresponds to a registered account, the VerificationService generates a secure random token, stores it in the verification_tokens table with a one-hour expiration, and sends a reset email containing a link with the token.

The reset confirmation endpoint validates the token, verifies it has not expired or been used, and accepts a new password. Password validation ensures the new password meets complexity requirements. The VerificationService atomically updates the user's password hash and marks the token as used within a single database transaction, preventing race conditions that could allow token reuse.

### 3.6 Rate Limiting and Abuse Prevention

Rate limiting employs the token bucket algorithm implemented through Bucket4j, with separate bucket configurations for login attempts, registration attempts, and token refresh requests. The RateLimitConfig defines bucket parameters including capacity, refill rate, and refill period for each operation type. Buckets are resolved per client IP address, with IP extraction logic that handles proxy headers including X-Forwarded-For, X-Real-IP, and Cloudflare's CF-Connecting-IP.

The LoginAttemptService implements progressive account lockout independent of IP-based rate limiting. Failed login attempts for a specific email address are tracked in a cache, and after a configurable threshold of failures, the account becomes temporarily locked. The lockout duration increases with repeated lockout events, and successful login resets the failure counter.

## 4. Exercise System

### 4.1 Exercise Session Lifecycle

All exercises follow a consistent session-based lifecycle managed by the ExerciseController. A session begins when the frontend requests the start endpoint with the desired exercise type. The controller generates a new session UUID, persists a session record with the current timestamp, and returns exercise-specific content along with timing configuration and the user's current skill level.

The content generation varies by exercise type. For word linking exercises, the WordPicker service selects words from the lexicon matching the user's preferred language and appropriate difficulty based on skill level. The word count scales with skill level, starting at twelve words for beginners and increasing by six words per level. For names and faces exercises, the FacePickerService selects active persons with difficulty levels appropriate to the user's skill, with face count ranging from four to nine based on Miller's Law constraints on working memory capacity.

Timing configuration is calculated dynamically based on item count and skill level. Lower skill levels receive more generous study times, with time-per-item decreasing as skill level increases. The response includes total study duration in seconds, individual item display duration in milliseconds, and gap duration between items in milliseconds.

### 4.2 Answer Submission and Scoring

Upon completing the memorization phase, the user submits their recalled answers to the submit endpoint along with the session identifier and the original shown items. The controller normalizes both shown items and answers to lowercase trimmed strings for comparison, handling empty responses gracefully.

Scoring distinguishes between simple recall accuracy and order accuracy. Recall accuracy measures how many shown items appear anywhere in the answer list, while order accuracy measures how many answers appear in their correct sequential position. This dual scoring reflects that sequential memory techniques like the Method of Loci emphasize both item retention and positional accuracy.

For the number peg exercise, scoring handles duplicate digits specially since the same digit may appear multiple times in a sequence. The scoring algorithm tracks remaining unmatched digits and decrements matches appropriately, ensuring that answering "3" twice when "3" appears twice correctly counts both as matches.

### 4.3 Skill Level Adaptation

After each submission, the system evaluates whether to adjust the user's skill level based on order accuracy. If order accuracy meets or exceeds the level-up threshold of 85 percent, the skill level increments by one up to the maximum of ten. If order accuracy falls below the level-down threshold of 60 percent, the skill level decrements by one down to the minimum of one. Order accuracy between these thresholds leaves the skill level unchanged.

The submission also records an attempt in the adaptive difficulty engine, calling the AdaptiveDifficultyService with the exercise type, correctness determination, difficulty level, and session reference. The correctness threshold for the Bayesian Knowledge Tracing system is set at 70 percent order accuracy, below which the attempt is recorded as incorrect for mastery estimation purposes.

### 4.4 Gamification Integration

Points are awarded based on exercise performance, with correct item recalls earning ten points each and correctly-positioned items earning an additional five bonus points. The UserStats record for the user is retrieved or created, and the attempt count and point totals are updated atomically.

Badge awards are evaluated after each submission. The system checks for milestone conditions and awards badges that the user has not yet earned. The FIRST_ATTEMPT badge is awarded upon any completed exercise. The STREAK_7 badge is awarded when the user achieves a seven-day consecutive practice streak, granting a bonus of one hundred points alongside the badge.

The SubmitExerciseResponse returned to the frontend includes all scoring details, point earnings, any newly awarded badges, and the updated skill level, enabling the UI to display appropriate feedback and celebratory animations.

### 4.5 Number Peg System

The number peg exercise implements a phonetic mnemonic system where each digit zero through nine is associated with a consonant sound, and memorable words are constructed using those sounds. The NumberPegHint entity stores these associations with fields for digit, language, and hint word. When generating a number peg exercise, the NumberPegService creates a random digit sequence appropriate to the skill level and retrieves corresponding hint words in the user's preferred language.

The digit sequence length scales with skill level, starting at five digits for beginners and adding approximately one digit per two skill levels. The timing configuration provides longer study times per digit than word linking exercises, recognizing that users must mentally associate each digit with its phonetic representation and construct memorable imagery.

## 5. Learning Content System

### 5.1 Article Management

Educational articles are organized by technique category with sequential ordering within each category. The LearningService retrieves accessible articles based on user context, returning all published articles for authenticated users and only intro articles for anonymous visitors. Administrators bypass publication status checks and can access unpublished articles for preview purposes.

Article access control implements sequential progression within categories. Before serving a non-intro article, the system verifies that the user has completed the quiz for the immediately preceding article in the same category sequence. This requirement ensures users absorb foundational concepts before advancing to more complex techniques.

Article content is stored in Markdown format, rendered by the frontend using the react-markdown library with GitHub Flavored Markdown support. Cover images may be specified either as external URLs or as uploaded images stored in the article_images table, with the LearningAdminController providing an upload endpoint that accepts multipart form data.

### 5.2 Quiz System

Each article may have an associated quiz containing multiple-choice questions. The QuizService retrieves quiz data by article slug, assembling questions with their options in display order. Answer options are returned without correctness indicators to the frontend, which shuffles option order to prevent pattern memorization.

Quiz submission accepts an array of selected option UUIDs corresponding to the question order. The service validates that each answer belongs to its respective question and calculates the percentage of correct responses. If the percentage meets or exceeds the quiz's passing score, the quiz is marked complete in the user's progress record, unlocking subsequent articles in the category sequence.

Quiz attempts are tracked with attempt counts and highest scores preserved. Users may retake quizzes to improve their scores, though only the first passing attempt unlocks progression. The QuizService also integrates with the adaptive difficulty engine, recording quiz performance as skill attempts with the article UUID as the concept identifier.

### 5.3 Progress Tracking

User progress through learning content is tracked at the article level through the UserArticleProgress entity. When a user opens an article, the LearningService marks it as read with a first-read timestamp if not previously recorded. Quiz completion status, best score, attempt count, and completion timestamp are updated through quiz submission.

The frontend Learning Hub displays articles organized by category with visual indicators for completion status, locked state, and quiz availability. Completed articles show checkmarks, locked articles display lock icons, and available articles indicate estimated reading time. This progress visualization motivates continued engagement by making advancement visible.

The system calculates overall completion percentage as the ratio of completed quizzes to total published articles, displayed on the user's profile and dashboard to provide a sense of accomplishment and remaining journey.

## 6. Adaptive Difficulty Engine

### 6.1 Bayesian Knowledge Tracing

The adaptive difficulty engine implements Bayesian Knowledge Tracing to estimate user mastery probability for each skill. The model maintains four parameters per skill: the probability that the user currently knows the skill (P(L)), the probability of learning the skill from a single practice opportunity (P(T)), the probability of making an error despite knowing the skill (P(S) or slip probability), and the probability of guessing correctly without knowing the skill (P(G)).

When recording an attempt, the service applies Bayesian updating to recalculate P(L). For a correct response, the posterior probability is computed as the likelihood of knowing given correctness, then combined with the learning probability to account for potential learning during the attempt. For incorrect responses, the calculation uses the slip and guess probabilities to determine how much the error should reduce the mastery estimate.

The guess probability varies by skill type to reflect task characteristics. Recall tasks like word linking have very low guess rates of five percent since correct answers cannot reasonably be guessed. Recognition tasks like names and faces have moderate guess rates of fifteen percent. Multiple-choice quizzes have higher guess rates of twenty-five percent reflecting the probability of random success.

### 6.2 Spaced Repetition Scheduling

Alongside Bayesian Knowledge Tracing, the system implements spaced repetition scheduling based on the SM-2 algorithm. After each attempt, a quality score from zero to five is calculated based on correctness and difficulty level. Higher difficulty levels with correct responses yield higher quality scores, indicating stronger memory performance.

The ease factor updates after each attempt using the SM-2 formula, decreasing for low-quality responses and increasing for high-quality responses, bounded between 1.3 and 2.5. The review interval starts at one day, advances to six days after the second successful review, and thereafter multiplies by the ease factor. Low-quality responses reset the interval to one day, implementing the "start over" mechanic when forgetting is detected.

The next review timestamp is calculated by adding the review interval to the current time, enabling queries for skills due for review. The AdaptiveDifficultyService provides methods to retrieve skills due for review, skills needing additional practice due to low mastery estimates, and skills considered mastered with probability above 95 percent.

### 6.3 Difficulty Recommendations

The service provides difficulty recommendations based on aggregated mastery statistics. The getRecommendedDifficulty method retrieves all mastery records for a user and skill type, calculates the average probability known, and maps this average to a difficulty level from one to ten. Users with lower average mastery receive recommendations for easier content, while those with higher mastery are directed toward more challenging material.

Mastery statistics are exposed through an API endpoint that returns total skills tracked, count of mastered skills, count of skills due for review, average mastery across all skills, and count of skills needing practice. The frontend AdaptiveDifficultyWidget displays these statistics with visual progress indicators and motivational messaging based on the user's current state.

## 7. Gamification and Social Features

### 7.1 Points and Statistics

The gamification system tracks user statistics through the UserStats entity, maintaining total points accumulated, total exercise attempts completed, and total correct responses across all attempts. These statistics persist indefinitely and never decrease, providing a cumulative measure of user engagement.

Points are earned through exercise performance as described in the exercise submission flow. The point values incentivize both participation and accuracy, with base points for correct recalls and bonus points for sequential accuracy. Future expansion could introduce multipliers for streaks, daily challenges, or special events.

### 7.2 Badge System

Badges recognize user achievements and milestones, stored in the user_badges table with fields for user reference, badge code, and award timestamp. Badge codes include FIRST_ATTEMPT for completing any exercise and STREAK_7 for maintaining a seven-day practice streak. The badge evaluation logic runs after each exercise submission, checking conditions and awarding badges not yet possessed by the user.

Badges are displayed on the user's dashboard and profile, providing visible recognition of accomplishments. The frontend renders badges with associated icons and labels, and newly awarded badges trigger celebratory toast notifications. The badge system is designed for extension, with the code-based approach allowing new badges to be added without schema changes.

### 7.3 Leaderboard

The leaderboard ranks users by total points, paginated in groups of fifteen entries. The LeaderboardService retrieves user statistics sorted by points descending, joins with user records to obtain display names and profile pictures, and calculates global ranks. The current user's entry is highlighted regardless of position, and the service calculates which page contains the current user for initial display.

A distinctive feature of the leaderboard is the forest visualization, where user progress is represented as growing trees. The TreeCalculator converts points to tree counts using a logarithmic scale that starts awarding trees at one hundred points and gradually increases the point threshold for subsequent trees. This visualization provides a nature-themed metaphor for growth and creates differentiation at the top of the leaderboard where raw point numbers become abstract.

The frontend IsoForestLeaderboard component renders an isometric forest for each user, with tree count determining forest density and a seeded random number generator ensuring consistent tree placement across renders. Users can click on leaderboard entries to view expanded forest visualizations in a modal dialog.

### 7.4 Streak Tracking

Practice streaks are calculated dynamically from session timestamps rather than stored as a separate counter. The StreakService queries exercise sessions for a user, extracts unique practice dates in the user's timezone, sorts them in reverse chronological order, and iterates to count consecutive days. The current streak represents consecutive days ending with today or yesterday, while the longest streak represents the maximum consecutive day count in the user's history.

Streak information is displayed prominently on the dashboard with visual indicators for streak length and the streak badge for achieving seven consecutive days. The streak mechanic encourages daily practice habits and provides a simple, understandable goal that motivates return visits.

## 8. Frontend Architecture

### 8.1 Application Structure

The frontend application follows a component-based architecture organized into distinct directories for routes, reusable components, context providers, library utilities, localization resources, and type definitions. The entry point in main.tsx configures React Router with all application routes, wraps the application in theme and language context providers, and initializes the internationalization system.

Routes are defined declaratively using React Router's createBrowserRouter function, mapping URL paths to page components. Protected routes wrap their children in a ProtectedRoute component that verifies authentication state before rendering, redirecting unauthenticated users to the login page. Administrative routes add an additional AdminRoute wrapper that checks for the ADMIN role in the user's claims.

The application employs React's Context API for global state management rather than external state libraries. The ThemeContext manages light and dark mode preferences with persistence to localStorage and system preference detection. The LanguageContext manages the user's language preference, synchronizing with the backend's preferred_language field and the i18next locale setting.

### 8.2 API Integration Layer

Communication with the backend occurs through an Axios instance configured in the lib/api.ts module. The instance sets the base URL from environment configuration with a localhost default for development, enables credential inclusion for cookie transmission, and registers request and response interceptors.

The response interceptor implements automatic token refresh by detecting 401 responses, attempting a refresh request, and retrying the original request upon success. A flag prevents infinite refresh loops by marking requests that have already attempted refresh. Public pages are excluded from automatic refresh and logout behavior to prevent redirect loops during unauthenticated browsing.

Individual API calls are made directly from components using the configured Axios instance, with async/await patterns and try-catch blocks for error handling. Responses are typically typed using TypeScript interfaces defined in the types directory, enabling IDE autocompletion and compile-time type checking.

### 8.3 Exercise Components

Each exercise type has a dedicated route component implementing the full exercise flow from start through memorization phase to answer submission and results display. The ExerciseWordLinking, ExerciseNamesFaces, and ExerciseNumberPeg components share common patterns but implement type-specific presentation logic.

The exercise flow begins by calling the start endpoint when the component mounts, storing the session identifier and exercise payload in component state. A study phase renders items sequentially or simultaneously based on exercise type, with timing controlled by the backend-provided configuration. Progress indicators show elapsed time and current position in the sequence.

After the study phase completes, the recall phase presents input fields for user responses. Word linking and number peg exercises use text inputs with autofocus progression, while names and faces exercises present face images with name input fields. Submission triggers the scoring request, and the results phase displays accuracy metrics, point earnings, badges, and feedback on missed items.

Animation and visual feedback enhance the exercise experience through Framer Motion. Items animate in and out during the study phase, correct answers highlight in green during results review, and celebratory animations accompany badge awards. The component designs maintain consistency across exercise types while accommodating their distinct presentation requirements.

### 8.4 Dashboard and Navigation

The Dashboard component serves as the authenticated user's home screen, aggregating information from multiple backend endpoints into a cohesive overview. On mount, the component fetches streak data with the user's timezone, recent exercise history limited to five entries, user statistics including points and badges, and adaptive difficulty status.

The dashboard layout presents a hero section with motivational messaging and a call-to-action button for starting exercises, followed by a grid of exercise cards linking to each exercise type. An activity heatmap visualizes practice patterns over the past sixty days using a GitHub-style contribution graph. Statistics cards display current streak, total points, and completion metrics.

Navigation differs between authenticated and unauthenticated states. Authenticated users see a navigation bar with links to dashboard, exercises, learning hub, leaderboard, and profile. A mobile navigation drawer provides the same links in a slide-out panel with a hamburger menu trigger. Unauthenticated users see landing page navigation with login and signup links.

### 8.5 Internationalization

The application supports multiple interface languages through i18next integration. The i18n configuration in i18n/config.ts initializes the library with browser language detection, fallback language settings, and translation resource loading. Translation files in the locales directory contain JSON objects mapping translation keys to localized strings for each supported language.

Components access translations through the useTranslation hook, calling the t function with translation keys to retrieve localized strings. Interpolation syntax allows embedding dynamic values in translations, and pluralization rules handle count-dependent phrasing. The LanguageSelector component provides a dropdown for manual language switching, updating both the i18next locale and the backend preference.

Exercise content language operates independently of interface language through the user's preferred_language setting. A user may view the interface in English while practicing with Ukrainian vocabulary, for example. The LanguageSelector in exercise contexts specifically updates the content language preference while the main settings control interface language.

## 9. Non-Functional Requirements

### 9.1 Performance Considerations

Database query performance is optimized through strategic indexing on frequently queried columns. The users table has a unique index on email supporting login lookups. The exercise_sessions table has indexes on user_id and started_at supporting history queries with sorting and pagination. The user_skill_mastery table has indexes on user_id, skill_type, and next_review_at supporting adaptive difficulty queries for skills due for review.

Pagination is implemented throughout the application for potentially large result sets. The exercise history endpoint accepts limit and offset parameters with sensible defaults and maximum limits to prevent excessive memory consumption. The leaderboard implements page-based pagination with a fixed page size of fifteen entries. Repository methods use Spring Data's Pageable interface for consistent pagination handling.

The Redis cache layer reduces database load for frequently accessed data and provides distributed storage for rate limit bucket state. Cache configuration specifies a one-hour time-to-live for cached entries with key prefixing to isolate Memorio's cache keys from other applications sharing the Redis instance. The article caching service demonstrates the caching pattern, though the current implementation marks it for future expansion.

### 9.2 Security Measures

Authentication tokens are transmitted exclusively through HTTP-only cookies, preventing JavaScript access and mitigating cross-site scripting attacks that could steal authentication credentials. The SameSite cookie attribute provides cross-site request forgery protection by restricting cookie transmission to same-site requests.

Password storage uses bcrypt hashing with a configurable cost factor, providing resistance against brute-force attacks through computational expense. The PasswordConfig bean configures Spring Security's BCryptPasswordEncoder with appropriate strength settings. Raw passwords are never logged, stored, or transmitted after initial processing.

Input validation occurs at multiple layers. The @Valid annotation on controller method parameters triggers Bean Validation constraint checking, rejecting malformed requests before processing. Custom validation annotations enforce email format, password complexity, and other domain-specific rules. Repository queries use parameterized statements through JPA, preventing SQL injection attacks.

Cross-Origin Resource Sharing configuration restricts API access to the configured frontend origin, preventing unauthorized cross-origin requests from malicious websites. The SecurityConfig defines allowed origins, methods, and headers, with credentials explicitly enabled to permit cookie transmission.

Rate limiting provides defense against brute-force attacks and denial of service attempts. Separate rate limits apply to login, registration, and token refresh operations, with per-IP bucket allocation preventing a single attacker from exhausting system resources. The progressive account lockout mechanism adds email-specific throttling independent of IP-based limits.

### 9.3 Data Integrity

Database constraints enforce data integrity at the persistence layer. Primary key constraints ensure entity uniqueness, foreign key constraints maintain referential integrity between related tables, and unique constraints prevent duplicate entries for emails and other naturally unique fields. Not-null constraints ensure required fields are always populated.

Transactional boundaries are defined using Spring's @Transactional annotation, ensuring that multi-step operations either complete entirely or roll back entirely. The password reset flow exemplifies this pattern, updating the password hash and marking the token as used within a single transaction to prevent inconsistent states if either operation fails.

Optimistic locking through updated_at timestamps provides protection against concurrent modification. The set_updated_at trigger function automatically maintains these timestamps on every update, and JPA's @Version annotation could be added to entities requiring explicit optimistic locking for concurrent access scenarios.

### 9.4 Reliability and Error Handling

Exception handling follows a layered approach with specific exception types for business logic errors and global exception handlers for consistent error responses. The NotFoundException signals missing resources and maps to 404 HTTP status. The DuplicateEmailException signals registration conflicts and maps to 409 status. The GlobalExceptionHandler catches unhandled exceptions and returns appropriate error responses with sanitized messages.

API error responses follow a consistent structure with an error field containing a human-readable message. This consistency enables the frontend to display appropriate feedback regardless of which endpoint generated the error. Sensitive internal details are excluded from error responses to prevent information leakage.

Health check endpoints exposed through Spring Boot Actuator enable monitoring and orchestration. The /actuator/health endpoint returns application health status including database connectivity verification. Docker Compose health checks poll this endpoint to determine when the backend service is ready to accept requests, enabling proper startup ordering.

### 9.5 Scalability Architecture

The application architecture supports horizontal scaling through stateless service design. Authentication state resides in tokens rather than server-side sessions, allowing any backend instance to process any request. Redis provides a shared data store for rate limit state that must be consistent across instances.

Database connection pooling is managed by HikariCP, Spring Boot's default connection pool, with configurable pool sizes and timeout settings. Redis connection pooling through Lettuce with Apache Commons Pool2 provides similar efficiency for cache operations. These pools bound resource consumption while supporting concurrent request processing.

The Docker Compose configuration demonstrates single-node deployment but could be extended to multi-node deployment through container orchestration platforms. The stateless backend service can be replicated behind a load balancer, with Nginx or a cloud load balancer distributing requests. Database and Redis would require their own high-availability configurations for production deployment.

## 10. Administration and Content Management

### 10.1 Administrative Access Control

Administrative functionality is protected through role-based access control at both the API and frontend layers. The SecurityConfig specifies that requests to /admin/** endpoints require the ADMIN role, enforced through Spring Security's authorization rules. Controllers may also use @PreAuthorize annotations for method-level security checks.

The frontend AdminRoute component verifies that the authenticated user has administrative privileges before rendering protected content. Users without the ADMIN role who navigate to administrative routes are redirected away with an appropriate message. This defense-in-depth approach ensures administrative functions are protected even if one layer fails.

### 10.2 Learning Content Administration

The AdminLearningPanel provides a management interface for articles, quizzes, and related content. Administrators can view all articles regardless of publication status, create new articles with full metadata and Markdown content, edit existing articles, and toggle publication status. The interface presents a list view with filtering and sorting capabilities and a detail/edit form for individual articles.

Article image management supports both external URLs and uploaded files. The upload endpoint accepts multipart form data, validates file type and size, stores the image binary in the article_images table, and updates the article's cover image reference. The frontend provides drag-and-drop upload with preview and the option to specify an external URL instead.

Quiz management is integrated into the article administration interface. Administrators define quiz questions with multiple-choice options, mark correct answers, specify passing thresholds, and arrange questions in display order. The interface validates that each question has exactly one correct answer and that the quiz is complete before allowing publication.

### 10.3 Lexicon and Face Data Management

The lexicon population process imports vocabulary from structured data files through the AdminLexiconController. The import endpoint accepts bulk word data and performs upsert operations to populate or update the words table. Words are associated with languages and frequency ranks enabling difficulty-based selection during exercises.

Face data management operates through the AdminFaceController and FaceDataImportService. The import service processes face image datasets, creating person records and associated face image records. Images are stored as binary data with MIME type metadata. The primary image flag designates which image to display as the canonical representation during exercises.

## 11. Deployment and Operations

### 11.1 Container Architecture

The application deploys as a set of Docker containers orchestrated through Docker Compose. The backend container builds from a Dockerfile that uses a multi-stage build pattern, first compiling the application with Maven and then creating a minimal runtime image with the compiled JAR. The frontend container builds the React application and serves the static files through Nginx.

The docker-compose.yml defines services for nginx as a reverse proxy, the backend application, the frontend static server, and Redis for caching. Network configuration places all services on a shared bridge network enabling inter-container communication by service name. Volume mounts persist Redis data across container restarts.

Environment variables configure sensitive values and deployment-specific settings. The .env file contains database credentials, JWT secrets, OAuth2 client credentials, and email server configuration. The docker-compose.yml references these variables, keeping secrets out of version control while enabling flexible deployment configuration.

### 11.2 Database Migration Strategy

Schema management uses Flyway for version-controlled database migrations. Migration scripts in the db/migration directory follow the naming convention V{version}__{description}.sql, where version numbers determine execution order. Flyway tracks applied migrations in a schema history table, ensuring each migration runs exactly once.

The migration strategy favors additive changes that avoid data loss. New columns are added with default values or as nullable to maintain compatibility with existing data. Data transformations are scripted as migrations when schema changes require data updates. Rollback scripts are not automatically generated, requiring manual intervention for schema regression.

The baseline-on-migrate configuration allows Flyway to adopt an existing database schema, recording the baseline version without executing early migrations. This supports both fresh installations where all migrations run sequentially and upgrades of existing installations where only new migrations apply.

### 11.3 Configuration Management

Application configuration follows the twelve-factor app methodology with environment-based configuration. The application.properties file defines configuration keys with environment variable placeholders using Spring's property placeholder syntax. Default values provide sensible fallbacks for development while production deployments override through environment variables.

Sensitive configuration including database passwords, JWT secrets, and OAuth2 credentials are never committed to version control. The .env.example file documents required configuration keys with placeholder values, guiding deployment configuration without exposing actual secrets. The spring-dotenv library enables loading .env files during development without modifying the startup process.

Configuration categories include database connection parameters, JWT token lifetimes and signing keys, OAuth2 provider credentials and redirect URIs, email server settings, Redis connection parameters, and feature flags like email enablement. This externalized configuration enables the same container images to deploy across development, staging, and production environments.

### 11.4 Health Monitoring

Spring Boot Actuator provides operational endpoints for health checking and application information. The /actuator/health endpoint returns overall health status along with component-specific checks for database connectivity and other dependencies. The /actuator/info endpoint can expose build information and custom application metadata.

Container health checks are defined in the Docker Compose configuration using wget to poll the health endpoint. Health check parameters specify the polling interval, timeout duration, retry count, and startup grace period. Container orchestration uses these health checks to determine service readiness and restart unhealthy containers.

Logging configuration directs application logs to standard output for container log aggregation. Log levels are configurable per package, with DEBUG level for application packages and INFO level for framework packages in development. Production deployments typically use INFO or WARN levels to reduce log volume while capturing significant events.

## 12. Conclusion

This technical specification describes Memorio, a comprehensive memory training web application implementing scientifically-grounded exercises, adaptive difficulty adjustment, and progressive learning content. The system architecture separates concerns between a Spring Boot backend providing RESTful APIs, a React frontend delivering an interactive user experience, and PostgreSQL persistence with Redis caching for performance.

The implementation demonstrates modern web application patterns including JWT-based authentication with HTTP-only cookies, Bayesian Knowledge Tracing for adaptive difficulty, spaced repetition scheduling for optimal review timing, and gamification mechanics for user engagement. Security measures including rate limiting, account lockout, input validation, and role-based access control protect user data and system integrity.

The modular design facilitates extension with additional exercise types, learning content categories, and gamification features. The containerized deployment architecture supports scaling and consistent operation across environments. Database migrations provide controlled schema evolution, and externalized configuration enables environment-specific customization without code changes.

A developer seeking to recreate this system should begin by establishing the database schema through the migration scripts, implementing the core user and authentication entities, building out the exercise session and scoring logic, adding the adaptive difficulty engine, and constructing the frontend components following the patterns described. The technology choices and architectural decisions documented here provide a foundation for understanding the system's structure and extending its capabilities.

