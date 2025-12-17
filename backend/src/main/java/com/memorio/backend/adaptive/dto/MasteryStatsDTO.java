package com.memorio.backend.adaptive.dto;

public class MasteryStatsDTO {
    private final int totalSkills;
    private final int masteredSkills;
    private final int skillsDueForReview;
    private final double averageMastery;
    private final int skillsNeedingPractice;

    public MasteryStatsDTO(int totalSkills, int masteredSkills,
                           int skillsDueForReview, double averageMastery,
                           int skillsNeedingPractice) {
        this.totalSkills = totalSkills;
        this.masteredSkills = masteredSkills;
        this.skillsDueForReview = skillsDueForReview;
        this.averageMastery = averageMastery;
        this.skillsNeedingPractice = skillsNeedingPractice;
    }

    public int getTotalSkills() { return totalSkills; }
    public int getMasteredSkills() { return masteredSkills; }
    public int getSkillsDueForReview() { return skillsDueForReview; }
    public double getAverageMastery() { return averageMastery; }
    public int getSkillsNeedingPractice() { return skillsNeedingPractice; }
}
