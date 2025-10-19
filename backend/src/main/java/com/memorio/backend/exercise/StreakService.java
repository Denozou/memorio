package com.memorio.backend.exercise;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.UUID;

@Service
public class StreakService {
    private final ExerciseSessionRepository sessions;

    public StreakService(ExerciseSessionRepository sessions){
        this.sessions = sessions;
    }


    public int computeCurrentStreak (UUID userId, ZoneId zone) {
        if(userId == null){
            throw new IllegalArgumentException("userId cannot be null");
        }
        if(zone == null){
            throw new IllegalArgumentException("zone cannot be null");
        }

        var page = sessions.findByUserIdOrderByStartedAtDesc(userId, PageRequest.of(0, 400));
        if (page.isEmpty()) return 0;

        var days = new LinkedHashSet<LocalDate>();
        for (var s : page.getContent()) {
            var dt = (s.getFinishedAt() != null ? s.getFinishedAt() : s.getStartedAt());
            if (dt == null) continue;
            days.add(dt.atZoneSameInstant(zone).toLocalDate());
        }
        if (days.isEmpty()) return 0;
        var sorted = new ArrayList<>(days);
        sorted.sort((a,b) -> b.compareTo(a));

        int current = 1;
        LocalDate last = sorted.get(0);
        for (int i = 1; i<sorted.size(); i++){
            LocalDate d = sorted.get(i);
            if(d.plusDays(1).equals(last)){
                current++;
            }else if (!d.equals(last)){
                break;
            }
            last = d;
        }
        return current;

    }
}
