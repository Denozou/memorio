package com.memorio.backend.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

/**
 * Validator for strong password requirements.
 */
public class StrongPasswordValidator implements ConstraintValidator<StrongPassword, String> {

    private static final int MIN_LENGTH = 12;
    private static final Pattern UPPERCASE_PATTERN = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile("[a-z]");
    private static final Pattern DIGIT_PATTERN = Pattern.compile("[0-9]");
    private static final Pattern SPECIAL_CHAR_PATTERN = Pattern.compile("[!@#$%^&*(),.?\":{}|<>]");

    @Override
    public void initialize(StrongPassword constraintAnnotation) {
        // No initialization needed
    }

    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        if (password == null || password.isEmpty()) {
            return false;
        }

        // Check minimum length
        if (password.length() < MIN_LENGTH) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "Password must be at least " + MIN_LENGTH + " characters long"
            ).addConstraintViolation();
            return false;
        }

        // Check for uppercase letter
        if (!UPPERCASE_PATTERN.matcher(password).find()) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "Password must contain at least one uppercase letter"
            ).addConstraintViolation();
            return false;
        }

        // Check for lowercase letter
        if (!LOWERCASE_PATTERN.matcher(password).find()) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "Password must contain at least one lowercase letter"
            ).addConstraintViolation();
            return false;
        }

        // Check for digit
        if (!DIGIT_PATTERN.matcher(password).find()) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "Password must contain at least one digit"
            ).addConstraintViolation();
            return false;
        }

        // Check for special character
        if (!SPECIAL_CHAR_PATTERN.matcher(password).find()) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)"
            ).addConstraintViolation();
            return false;
        }

        return true;
    }
}
