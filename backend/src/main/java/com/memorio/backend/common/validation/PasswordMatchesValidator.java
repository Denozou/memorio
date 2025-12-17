package com.memorio.backend.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.lang.reflect.Method;

/**
 * Generic validator for password matching.
 * Works with any DTO that has getPassword() or getNewPassword() and getConfirmPassword() methods.
 * Supports both RegisterRequest (password/confirmPassword) and PasswordResetConfirmDto (newPassword/confirmPassword).
 */
public class PasswordMatchesValidator implements ConstraintValidator<PasswordMatches, Object>{
    @Override
    public void initialize(PasswordMatches constraintAnnotation){
        // No initialization needed
    }
    
    @Override
    public boolean isValid(Object obj, ConstraintValidatorContext context){
        if(obj == null) return true; // let @NotNull handle null checks

        try {
            // Try to get password field (for RegisterRequest)
            String password = getFieldValue(obj, "getPassword");
            
            // If password is null, try newPassword (for PasswordResetConfirmDto)
            if (password == null) {
                password = getFieldValue(obj, "getNewPassword");
            }
            
            String confirmPassword = getFieldValue(obj, "getConfirmPassword");
            
            // Let @NotBlank handle null/empty checks
            if(password == null || confirmPassword == null) return true;

            return password.equals(confirmPassword);
        } catch (Exception e) {
            // If reflection fails, validation passes (let other validators handle it)
            return true;
        }
    }
    
    /**
     * Uses reflection to get field value via getter method.
     */
    private String getFieldValue(Object obj, String methodName) {
        try {
            Method method = obj.getClass().getMethod(methodName);
            Object value = method.invoke(obj);
            return value != null ? value.toString() : null;
        } catch (Exception e) {
            return null;
        }
    }
}
