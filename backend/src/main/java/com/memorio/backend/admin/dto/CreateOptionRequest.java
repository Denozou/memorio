package com.memorio.backend.admin.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreateOptionRequest {

    @NotBlank(message = "Option text is required")
    private String optionText;

    @NotNull(message = "Is correct - required")
    private Boolean isCorrect;

    @NotNull(message = "Display order is required")
    @Min(value = 0, message = "Display order must be at least 0")
    private Integer displayOrder;

    public String getOptionText() { return optionText; }
    public Boolean getIsCorrect() { return isCorrect; }
    public Integer getDisplayOrder() { return displayOrder; }

    public void setOptionText(String optionText) {
        this.optionText = optionText;
    }
    public void setIsCorrect(Boolean isCorrect) {
        this.isCorrect = isCorrect;
    }
    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }
}
