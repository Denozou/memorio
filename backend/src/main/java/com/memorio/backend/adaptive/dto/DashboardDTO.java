package com.memorio.backend.adaptive.dto;
import java.util.List;

public class DashboardDTO {
    private final MasteryStatsDTO stats;
    private final List<SkillMasteryDTO> skillsDueForReview;
    private final List<SkillMasteryDTO> skillsNeedingPractice;
    private final List<SkillMasteryDTO> masteredSkills;

    public DashboardDTO(MasteryStatsDTO stats,
                        List<SkillMasteryDTO> skillsDueForReview,
                        List<SkillMasteryDTO> skillsNeedingPractice,
                        List<SkillMasteryDTO> masteredSkills) {
        this.stats = stats;
        this.skillsDueForReview = skillsDueForReview;
        this.skillsNeedingPractice = skillsNeedingPractice;
        this.masteredSkills = masteredSkills;
    }

    public MasteryStatsDTO getStats() { return stats; }
    public List<SkillMasteryDTO> getSkillsDueForReview() { return skillsDueForReview; }
    public List<SkillMasteryDTO> getSkillsNeedingPractice() { return skillsNeedingPractice; }
    public List<SkillMasteryDTO> getMasteredSkills() { return masteredSkills; }
}
