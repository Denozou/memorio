package com.memorio.backend.adaptive.dto;

public class RecommendationDTO {
    private final String skillType;
    private final int recommendedDifficultyLevel;

    public RecommendationDTO(String skillType, int recommendedDifficultyLevel) {
        this.skillType = skillType;
        this.recommendedDifficultyLevel = recommendedDifficultyLevel;
    }

    public String getSkillType() { return skillType; }
    public int getRecommendedDifficultyLevel() { return recommendedDifficultyLevel; }
}
