package com.memorio.backend.common.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

/**
 * Annotation to validate password strength.
 * Passwords must:
 * - Be at least 12 characters long
 * - Contain at least one uppercase letter
 * - Contain at least one lowercase letter
 * - Contain at least one digit
 * - Contain at least one special character
 */
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = StrongPasswordValidator.class)
@Documented
public @interface StrongPassword {
    String message() default "Password must be at least 12 characters and contain uppercase, lowercase, digit, and special character";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
