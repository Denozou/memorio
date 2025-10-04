package com.memorio.backend.exercise;
import com.memorio.backend.common.error.NotFoundException;
import com.memorio.backend.exercise.dto.*;
import com.memorio.backend.exercise.dto.HistoryItem;
import com.memorio.backend.gamification.UserBadgeRepository;
import com.memorio.backend.gamification.UserStatsRepository;
import com.memorio.backend.user.UserRepository;
import com.memorio.backend.gamification.UserBadge;
import com.memorio.backend.gamification.UserStats;
import com.memorio.backend.lexicon.WordPicker;

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

@RestController
@RequestMapping("/exercises")
public class ExerciseController {

    private final ExerciseSessionRepository sessions;
    private final ExerciseAttemptRepository attempts;
    private final ObjectMapper mapper;
    private final UserStatsRepository userStatsRepo;
    private final UserBadgeRepository userBadgeRepo;
    private final StreakService streakService;
    private final UserRepository users;
    private final WordPicker wordPicker;

    public ExerciseController(ExerciseSessionRepository sessions,
                              ExerciseAttemptRepository attempts,
                              ObjectMapper mapper, UserStatsRepository userStatsRepo,
                              UserBadgeRepository userBadgeRepo, StreakService streakService,
                              UserRepository users, WordPicker wordPicker) {
        this.sessions = sessions;
        this.attempts = attempts;
        this.mapper = mapper;
        this.userStatsRepo = userStatsRepo;
        this.userBadgeRepo = userBadgeRepo;
        this.streakService = streakService;
        this.users = users;
        this.wordPicker = wordPicker;
    }
    @PostMapping("/start")
    public ResponseEntity<StartExerciseResponse> start(@Valid @RequestBody StartExerciseRequest req,
                                                       Authentication auth){
        UUID userId = UUID.fromString(auth.getName());
        UUID sessionId = UUID.randomUUID();
        var session = new ExerciseSession(sessionId, userId, req.getType(), OffsetDateTime.now());
        sessions.save(session);

        switch (req.getType()){
            case IMAGE_LINKING -> {
                var user = users.findById(userId).orElseThrow(()->new IllegalStateException("User no found"));
                String language = (user.getPreferredLanguage() != null && !user.getPreferredLanguage().isBlank())
                        ? user.getPreferredLanguage() : "en";
                int listSize = getWordCountForLevel(user.getSkillLevel());

                int skillLevel = user.getSkillLevel();
                //var words = wordPicker.pickRandom(language, listSize);
                var words = wordPicker.pickWords(language, skillLevel, listSize);
                var payload = Map.of("words", words);
                var res = new StartExerciseResponse(sessionId, ExerciseType.IMAGE_LINKING, payload, skillLevel);
                return ResponseEntity.ok(res);
            }
            case DAILY_CHALLENGE -> {
                var words = List.of("leaf", "mirror", "piano", "bridge", "star", "wheel");
                var payload = new ImageLinkingPayload(words);
                var res = new StartExerciseResponse(sessionId, ExerciseType.IMAGE_LINKING, payload);
                return ResponseEntity.ok(res);
            }
            case NAMES_FACES -> {
                throw new IllegalArgumentException("Exercise type not implemented yet: " + req.getType());
            }
            default -> throw new IllegalArgumentException("Unknown exercise type: " + req.getType());
        }
    }
    @Transactional
    @PostMapping("/submit")
    public ResponseEntity<SubmitExerciseResponse> submit(@Valid @RequestBody SubmitExerciseRequest req,
                                                         Authentication auth){
        UUID userId = UUID.fromString(auth.getName());
        var session = sessions.findByIdAndUserId(req.getSessionId(), userId).
                orElseThrow(() -> new NotFoundException("Session not found"));
        if (req.getType() != ExerciseType.IMAGE_LINKING && req.getType() != ExerciseType.DAILY_CHALLENGE){
            throw new IllegalArgumentException("Scoring not implemented for type: " + req.getType());
        }
        var shown = req.getShownWords();
        if (shown == null || shown.isEmpty()){
            throw new IllegalArgumentException("shownWords must not be empty");
        }
        Function<String, String> norm = s-> s == null ? "" : s.trim().toLowerCase();
        Set<String> targets = new LinkedHashSet<>();
        for (String word : shown){
            String n = norm.apply(word);
            if(!n.isEmpty()){
                targets.add(n);
            }
        }
        Set<String> matched = new LinkedHashSet<>();
        List<String> extraAnswers = new ArrayList<>();
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
        int total = targets.size();
        int correct = matched.size();
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
        int level = user.getSkillLevel();
        if (orderAccuracy >= 0.85){
            level = Math.min(level+1, 10);
        } else if (orderAccuracy < 0.6) {
            level = Math.max(level -1,1);
        }
        user.setSkillLevel(level);
        users.save(user);

        int basePoints = correct * 10;
        int bonusOrderPoints = orderCorrect * 5;
        int bonusPoints = 0;
        var stats = userStatsRepo.findById(userId).orElseGet(() -> new UserStats(userId));

        List<String> newlyAwarded = new ArrayList<>();
        if (!userBadgeRepo.existsByUserIdAndCode(userId, "FIRST_ATTEMPT")){
            var badge = new UserBadge(UUID.randomUUID(), userId, "FIRST_ATTEMPT", OffsetDateTime.now());
            userBadgeRepo.save(badge);
            newlyAwarded.add("FIRST_ATTEMPT");

        }

        var zone = ZoneId.of("UTC");
        int currentStreak = streakService.computeCurrentStreak(userId,zone);
        if (currentStreak >= 7 && !userBadgeRepo.existsByUserIdAndCode(userId, "STREAK_7")){
            var badge = new UserBadge(UUID.randomUUID(), userId, "STREAK_7", OffsetDateTime.now());
            userBadgeRepo.save(badge);
            newlyAwarded.add("STREAK_7");
            bonusPoints+=100;

        }
        int pointsEarned = basePoints + bonusOrderPoints + bonusPoints;
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

        var userId = UUID.fromString(auth.getName());
        int page = offset / limit;
        Pageable pageable = PageRequest.of(page, limit);
        var pageResult = sessions.findByUserIdOrderByStartedAtDesc(userId, pageable);
        var items = new ArrayList<HistoryItem>(pageResult.getNumberOfElements());
        for (var s : pageResult.getContent()){
            long attemotCount = attempts.countBySessionId(s.getId());
            var last = attempts.findFirstBySessionIdOrderByCreatedAtDesc(s.getId()); // projection

            Integer lastCorrect = last == null ? null : last.getCorrect();
            Integer lastTotal   = last == null ? null : last.getTotal();
            Double  lastAcc     = last == null ? null : last.getAccuracy();
            items.add (new HistoryItem(
                    s.getId(),
                    s.getType(),
                    s.getStartedAt(),
                    s.getFinishedAt(),
                    attemotCount,
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
        var userId = UUID.fromString(auth.getName());
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
        return 6 + (level *6);
    }
}
