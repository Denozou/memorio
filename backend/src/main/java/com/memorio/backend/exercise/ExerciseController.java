package com.memorio.backend.exercise;
import com.memorio.backend.common.error.NotFoundException;
import com.memorio.backend.exercise.dto.*;
import com.memorio.backend.exercise.dto.HistoryItem;
import com.memorio.backend.gamification.UserStatsRepository;
import com.memorio.backend.gamification.BadgeService;
import com.memorio.backend.user.UserRepository;
import com.memorio.backend.gamification.UserStats;
import com.memorio.backend.lexicon.WordPicker;
import com.memorio.backend.faces.FacePickerService;
import com.memorio.backend.faces.Person;
import com.memorio.backend.common.security.AuthenticationUtil;
import com.memorio.backend.adaptive.AdaptiveDifficultyService;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.function.Function;
import java.time.OffsetDateTime;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashSet;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/exercises")
public class ExerciseController {

    private final ExerciseSessionRepository sessions;
    private final ExerciseAttemptRepository attempts;
    private final ObjectMapper mapper;
    private final UserStatsRepository userStatsRepo;
    private final BadgeService badgeService;
    private final StreakService streakService;
    private final UserRepository users;
    private final WordPicker wordPicker;
    private final FacePickerService facePicker;
    private final NumberPegService numberPegService;
    private final AdaptiveDifficultyService adaptiveService;


    private static final double LEVEL_UP_THRESHOLD = 0.85;
    private static  final double LEVEL_DOWN_THRESHOLD = 0.6;
    private static final int MAX_SKILL_LEVEL = 10;
    private static final int MIN_SKILL_LEVEL = 1;

    public ExerciseController(ExerciseSessionRepository sessions,
                              ExerciseAttemptRepository attempts,
                              ObjectMapper mapper, UserStatsRepository userStatsRepo,
                              BadgeService badgeService, StreakService streakService,
                              UserRepository users, WordPicker wordPicker, FacePickerService facePicker,
                              NumberPegService numberPegService, AdaptiveDifficultyService adaptiveService) {
        this.sessions = sessions;
        this.attempts = attempts;
        this.mapper = mapper;
        this.userStatsRepo = userStatsRepo;
        this.badgeService = badgeService;
        this.streakService = streakService;
        this.users = users;
        this.wordPicker = wordPicker;
        this.facePicker = facePicker;
        this.numberPegService = numberPegService;
        this.adaptiveService = adaptiveService;
    }
    @PostMapping("/start")
    public ResponseEntity<StartExerciseResponse> start(@Valid @RequestBody StartExerciseRequest req,
                                                       Authentication auth){
        UUID userId = AuthenticationUtil.extractUserId(auth);
        UUID sessionId = UUID.randomUUID();
        var session = new ExerciseSession(sessionId, userId, req.getType(), OffsetDateTime.now());
        sessions.save(session);

        switch (req.getType()){
            case WORD_LINKING -> {
                var user = users.findById(userId).orElseThrow(()->new IllegalStateException("User no found"));
                String language = (user.getPreferredLanguage() != null && !user.getPreferredLanguage().isBlank())
                        ? user.getPreferredLanguage() : "en";
                int listSize = getWordCountForLevel(user.getSkillLevel());

                int skillLevel = user.getSkillLevel();
                //var words = wordPicker.pickRandom(language, listSize);
                var words = wordPicker.pickWords(language, skillLevel, listSize);
                TimingConfig timing = calculateTimingForWords(words.size(), skillLevel);
                var payload = Map.of("words", words);
                var res = new StartExerciseResponse(sessionId, ExerciseType.WORD_LINKING, payload, skillLevel, timing);
                return ResponseEntity.ok(res);
            }
            case DAILY_CHALLENGE -> {
                var words = List.of("leaf", "mirror", "piano", "bridge", "star", "wheel");
                var payload = new WordLinkingPayload(words);
                var res = new StartExerciseResponse(sessionId, ExerciseType.WORD_LINKING, payload);
                return ResponseEntity.ok(res);
            }
            case NAMES_FACES -> {
                var user = users.findById(userId).orElseThrow(()-> new IllegalStateException("User not found"));

                int skillLevel = user.getSkillLevel();
                int faceCount = getFaceCountForLevel(skillLevel);

                List<Person> persons = facePicker.pickFaces(skillLevel, faceCount);

                if(persons.isEmpty()){
                    throw new IllegalStateException("No faces available for exercise");
                }

                List<FaceData> faces = persons.stream()
                        .map(p-> new FaceData(
                                p.getPersonName(),
                                p.getDisplayName(),
                                "/api/faces/primary/" + p.getPersonName()
                        )).toList();

                TimingConfig timing = calculateTimingForFaces(faceCount, skillLevel);
                var payload = new FaceNamePayload(faces);
                var res = new StartExerciseResponse(sessionId, ExerciseType.NAMES_FACES, payload, skillLevel, timing);
                return ResponseEntity.ok(res);
            }
            case NUMBER_PEG ->{
                var user = users.findById(userId)
                        .orElseThrow(()-> new IllegalStateException("User not found"));
                String language = (user.getPreferredLanguage() != null && !user.getPreferredLanguage().isBlank()) ? user.getPreferredLanguage() :  "en";

                int skillLevel = user.getSkillLevel();

                List<Integer> digits = numberPegService.generateDigitSequence(skillLevel);
                List<String> hints = digits.stream()
                        .map(digit -> numberPegService.getHintWord(digit, language))
                        .toList();

                var payload = Map.of(
                        "digits", digits,
                        "hints", hints
                );
                TimingConfig timing = calculateTimingForDigits(digits.size(), skillLevel);

                var res = new StartExerciseResponse(sessionId, ExerciseType.NUMBER_PEG, payload, skillLevel, timing);
                return ResponseEntity.ok(res);
            }
            default -> throw new IllegalArgumentException("Unknown exercise type: " + req.getType());
        }
    }
    @Transactional
    @PostMapping("/submit")
    public ResponseEntity<SubmitExerciseResponse> submit(@Valid @RequestBody SubmitExerciseRequest req,
                                                         Authentication auth){
        UUID userId = AuthenticationUtil.extractUserId(auth);
        var session = sessions.findByIdAndUserId(req.getSessionId(), userId).
                orElseThrow(() -> new NotFoundException("Session not found"));
        if (req.getType() != ExerciseType.WORD_LINKING
                && req.getType() != ExerciseType.DAILY_CHALLENGE
                && req.getType() != ExerciseType.NAMES_FACES
                && req.getType() != ExerciseType.NUMBER_PEG
        ){
            throw new IllegalArgumentException("Scoring not implemented for type: " + req.getType());
        }
        var shown = req.getShownWords();
        if (shown == null || shown.isEmpty()){
            throw new IllegalArgumentException("shownWords must not be empty");
        }
        Function<String, String> norm = s-> s == null ? "" : s.trim().toLowerCase();
        // For NUMBER_PEG, we need to count all digits including duplicates
        // For other exercises, we count unique words only
        boolean isNumberPeg = (req.getType() == ExerciseType.NUMBER_PEG);
        
        Set<String> targets = new LinkedHashSet<>();
        List<String> allTargets = new ArrayList<>();
        for (String word : shown){
            String n = norm.apply(word);
            if(!n.isEmpty()){
                targets.add(n);
                allTargets.add(n);
            }
        }
        
        int total;
        int correct;
        Set<String> matched = new LinkedHashSet<>();
        List<String> extraAnswers = new ArrayList<>();
        
        if (isNumberPeg) {
            // For NUMBER_PEG: count position-by-position matches for "correct"
            // This handles duplicates properly
            total = allTargets.size();
            correct = 0;
            List<String> shownCopy = new ArrayList<>(allTargets);
            if (req.getAnswers() != null) {
                for (String answer : req.getAnswers()) {
                    String n = norm.apply(answer);
                    if (n.isEmpty()) continue;
                    // Check if this answer matches any remaining shown digit
                    if (shownCopy.contains(n)) {
                        shownCopy.remove(n); // Remove first occurrence to handle duplicates
                        correct++;
                        matched.add(n);
                    } else {
                        extraAnswers.add(n);
                    }
                }
            }
        } else {
            // For other exercises: use unique word matching
            total = targets.size();
            if (req.getAnswers() != null){
                for (String answer: req.getAnswers()){
                    String n = norm.apply(answer);
                    if(n.isEmpty()) continue;
                    if (targets.contains(n) && !matched.contains(n)){
                        matched.add(n);
                    }else{
                        extraAnswers.add(n);
                    }
                }
            }
            correct = matched.size();
        }
        int orderCorrect = 0;
        for (int i = 0; i < Math.min(shown.size(), (req.getAnswers() == null ? 0 : req.getAnswers().size())); i++){
            String shownNorm = norm.apply(shown.get(i));
            String ansNorm = norm.apply(req.getAnswers().get(i));
            if(!shownNorm.isEmpty() && shownNorm.equals(ansNorm)){
                orderCorrect++;
            }
        }
        double accuracy = total == 0 ? 0.0 : (double) correct / (double) total;
        double orderAccuracy = total == 0 ? 0.0 : (double) orderCorrect / (double) total;

        List<String> missed = new ArrayList<>();
        for (String word : targets){
            if (!matched.contains(word)) missed.add(word);
        }
        String shownJson = toJson(shown);
        String answersJson = toJson(req.getAnswers() == null ? List.of() : req.getAnswers());
        var attempt = new ExerciseAttempt(
                UUID.randomUUID(),
                session.getId(),
                OffsetDateTime.now(),
                shownJson,
                answersJson,
                total,
                correct,
                accuracy
        );
        attempts.save(attempt);
        if (session.getFinishedAt() == null){
            session.markFinished(OffsetDateTime.now());
            sessions.save(session);
        }
        var user = users.findById(userId).orElseThrow(()->new IllegalStateException("User not found"));
        
        // ========== ADAPTIVE DIFFICULTY: Record attempt in BKT system ==========
        String skillType = req.getType().name();
        boolean wasCorrect = orderAccuracy >= 0.7;  // Consider 70%+ as "correct" for BKT
        adaptiveService.recordAttempt(
            userId,
            skillType,
            null,  // No specific concept for exercises
            wasCorrect,
            user.getSkillLevel(),
            session.getId()
        );

        int level = user.getSkillLevel();
        if (orderAccuracy >= LEVEL_UP_THRESHOLD){
            level = Math.min(level+1, MAX_SKILL_LEVEL);
        } else if (orderAccuracy < LEVEL_DOWN_THRESHOLD) {
            level = Math.max(level -1,MIN_SKILL_LEVEL);
        }
        user.setSkillLevel(level);
        users.save(user);

        int basePoints = correct * 10;
        int bonusOrderPoints = orderCorrect * 5;
        var stats = userStatsRepo.findById(userId).orElseGet(() -> new UserStats(userId));

        // Calculate base points first (before badge bonuses)
        int baseEarned = basePoints + bonusOrderPoints;
        long pointsAfterBase = stats.getTotalPoints() + baseEarned;

        // Evaluate and award badges based on current achievement
        boolean wasPerfect = (accuracy == 1.0);
        var badgeResult = badgeService.evaluateAndAwardBadges(
                userId, req.getType(), wasPerfect, pointsAfterBase);

        List<String> newlyAwarded = badgeResult.newBadges();
        int bonusPoints = badgeResult.bonusPoints();

        // Total points = base + order bonus + badge bonuses
        int pointsEarned = baseEarned + bonusPoints;
        stats.addAttempt(correct, pointsEarned);
        userStatsRepo.save(stats);

        var res = new SubmitExerciseResponse(
                req.getSessionId(),
                req.getType(),
                total,
                correct,
                accuracy,
                new ArrayList<>(matched),
                missed,
                extraAnswers,
                pointsEarned,
                newlyAwarded,
                orderCorrect,
                orderAccuracy,
                level
        );
        return ResponseEntity.ok(res);
    }
    private String toJson(List<String> list) {
        try {
            return mapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize list", e);
        }
    }
    @Transactional (readOnly = true)
    @GetMapping("/history")
    public ResponseEntity<HistoryResponse> history(@RequestParam(defaultValue = "20") int limit,
                                                   @RequestParam(defaultValue = "0") int offset,
                                                   Authentication auth){
        limit = Math.max(1, Math.min(limit,100));
        offset = Math.max(0, offset);

        var userId = AuthenticationUtil.extractUserId(auth);
        int page = offset / limit;
        Pageable pageable = PageRequest.of(page, limit);
        var pageResult = sessions.findByUserIdOrderByStartedAtDesc(userId, pageable);
        var sessionsList = pageResult.getContent();
        if(sessionsList.isEmpty()){
            return ResponseEntity.ok(new HistoryResponse(List.of(), limit, offset, 0L));
        }

        List<UUID> sessionIds= sessionsList.stream()
                .map(ExerciseSession::getId)
                .toList();
        var countResults = attempts.countBySessionIds(sessionIds);
        var countsMap = countResults.stream()
                .collect(Collectors.toMap(
                        ExerciseAttemptRepository.SessionAttemptCount::getSessionId,
                        ExerciseAttemptRepository.SessionAttemptCount::getAttemptCount
                ));

        var lastAttemptResults = attempts.findLastAttemptsBySessionIds(sessionIds);
        var lastAttemptsMap = lastAttemptResults.stream()
                .collect(Collectors.toMap(
                        ExerciseAttemptRepository.SessionLastAttempt::getSessionId,
                        Function.identity()
                ));


        var items = new ArrayList<HistoryItem>(pageResult.getNumberOfElements());
        for (var s : sessionsList){
            long attemptCount = countsMap.getOrDefault(s.getId(), 0L);
            var last = lastAttemptsMap.get(s.getId()); // projection

            Integer lastCorrect = last == null ? null : last.getCorrect();
            Integer lastTotal   = last == null ? null : last.getTotal();
            Double  lastAcc     = last == null ? null : last.getAccuracy();
            items.add (new HistoryItem(
                    s.getId(),
                    s.getType(),
                    s.getStartedAt(),
                    s.getFinishedAt(),
                    attemptCount,
                    lastCorrect,
                    lastTotal,
                    lastAcc
            ));

        }
        var resp = new HistoryResponse(
                items, limit, offset, pageResult.getTotalElements()
        );
        return ResponseEntity.ok(resp);
    }

    @Transactional(readOnly = true)
    @GetMapping("/streak")
    public ResponseEntity<StreakResponse> streak(@RequestParam(name = "tz", defaultValue=  "UTC") String tz,
                                                 Authentication auth){

        var zone = safeZoneId(tz);
        var userId = AuthenticationUtil.extractUserId(auth);
        var page = sessions.findByUserIdOrderByStartedAtDesc(userId, PageRequest.of(0, 400));
        var days = new LinkedHashSet<LocalDate>();
        for (var s : page.getContent()){
            var dt = (s.getFinishedAt() != null ? s.getFinishedAt() : s.getStartedAt());
            if (dt == null) continue;
            days.add(dt.atZoneSameInstant(zone).toLocalDate());
        }
        if (days.isEmpty()){
            return ResponseEntity.ok(new StreakResponse(0,0, null, zone.getId()));
        }

        var sorted = new ArrayList<>(days);
        sorted.sort((a, b) -> b.compareTo(a)); //newest first
        int longest = 1;
        int current = 1;
        LocalDate last = sorted.get(0);
        LocalDate lastActive = last;

        for (int i = 1; i < sorted.size(); i++){
            LocalDate d = sorted.get(i);//беремо дату (починаючи з другої)
            if (d.plusDays(1).equals(last)){ //якщо взята дата була перед "останньою" - збільшуємо streak
                current++;
            }else if (d.equals(last)){//якщо дата та сама, що й остання - нічого не робимо

            }else {// у всіх інших випадках (якщо є проміжок між датами)
                longest = Math.max(longest, current); //призначити вартість найдовшого streak
                current = 1; //повернути "теперішній" streak до 1 (означає активний сьогодні)
            }
            last = d;
        }
        longest = Math.max(longest, current); //Updates the longest streak one more time (in case the current streak is the longest)
        return ResponseEntity.ok(new StreakResponse(current, longest, lastActive, zone.getId()));
    }

    private ZoneId safeZoneId(String tz){
        try{
            return ZoneId.of(tz);
        }catch (Exception e){
            return ZoneId.of("UTC");
        }
    }

    private int getWordCountForLevel(int skillLevel){
        int level = Math.max(1, Math.min(skillLevel, 10));
        return level * 6;
    }

    private int getFaceCountForLevel(int skillLevel){
        int level = Math.max(1, Math.min(skillLevel,10));
        int count = 4 + (level-1); //4 at level1
        return Math.min(count, 9); //9 faces max (Even experts struggle beyond 7±2 items (Miller's Law))
    }

    private TimingConfig calculateTimingForWords(int wordCount, int skillLevel){
        double timePerWord;
        if (skillLevel <= 2){
            timePerWord = 3;
        } else if (skillLevel <= 4) {
            timePerWord = 2.5;
        } else if  (skillLevel <=6){
            timePerWord = 2.0;
        }else {
            timePerWord = 1.5;
        }

        double calculatedTime = wordCount * timePerWord;
        int studySeconds = (int) Math.max(20, Math.min(90, calculatedTime));
        int totalStudyTimeMs = studySeconds * 1000;
        int totalCycleTime = totalStudyTimeMs / wordCount;

        double gapRatio = 0.2;
        int showTime = (int) (totalCycleTime * (1-gapRatio));

        if(showTime < 800){
            showTime = 800;
        }else if (showTime > 3000){
            showTime = 3000;
        }

        int gapTime = (int) (showTime * gapRatio);
        return new TimingConfig(studySeconds, showTime, gapTime);
    }

    private TimingConfig calculateTimingForFaces(int faceCount, int skillLevel){
        double timePerFace;
        if(skillLevel <=2){
            timePerFace = 10.0;
        } else if (skillLevel <= 4) {
            timePerFace = 8.0;
        }else if (skillLevel <=6){
            timePerFace = 6.5;
        }else {
            timePerFace = 5.0;
        }
        double calculatedTime = faceCount * timePerFace;
        int studySeconds =(int) Math.max(30, Math.min(120, calculatedTime));
        int faceShowMs = 5000;
        int gapMs = 500;

        return new TimingConfig(studySeconds, faceShowMs, gapMs);
    }

    private TimingConfig calculateTimingForDigits(int digitCount, int skillLevel){
        double timePerDigit;

        if(skillLevel <= 2){
            timePerDigit = 3.0;
        } else if (skillLevel <= 4) {
            timePerDigit = 2.5;
        } else if (skillLevel <= 6) {
            timePerDigit = 2.0;
        }else{
            timePerDigit = 1.5;
        }

        double calculatedTime = digitCount * timePerDigit;

        int studySeconds = (int)Math.max(15, Math.min(60, calculatedTime));

        int digitShowMs = skillLevel <= 3 ? 3000 : skillLevel <=6 ? 2000:1500;

        int gapMs = 300;

        return new TimingConfig(studySeconds, digitShowMs, gapMs);
    }
}
