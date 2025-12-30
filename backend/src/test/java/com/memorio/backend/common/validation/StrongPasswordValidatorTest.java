package com.memorio.backend.common.validation;

import jakarta.validation.ConstraintValidatorContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("StrongPasswordValidator Unit Tests")
class StrongPasswordValidatorTest {

    private StrongPasswordValidator validator;

    @Mock
    private ConstraintValidatorContext context;

    @Mock
    private ConstraintValidatorContext.ConstraintViolationBuilder builder;

    @BeforeEach
    void setUp() {
        validator = new StrongPasswordValidator();
    }

    private void setupConstraintViolationMock() {
        when(context.buildConstraintViolationWithTemplate(anyString())).thenReturn(builder);
    }

    @Test
    @DisplayName("Should accept valid strong password")
    void shouldAcceptValidStrongPassword() {
        String validPassword = "StrongPassword123!";

        boolean result = validator.isValid(validPassword, context);

        assertTrue(result);
        verify(context, never()).disableDefaultConstraintViolation();
    }

    @Test
    @DisplayName("Should reject null password")
    void shouldRejectNullPassword() {
        boolean result = validator.isValid(null, context);

        assertFalse(result);
    }

    @Test
    @DisplayName("Should reject empty password")
    void shouldRejectEmptyPassword() {
        boolean result = validator.isValid("", context);

        assertFalse(result);
    }

    @Test
    @DisplayName("Should reject password shorter than 12 characters")
    void shouldRejectShortPassword() {
        setupConstraintViolationMock();
        String shortPassword = "Short1!";

        boolean result = validator.isValid(shortPassword, context);

        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate(contains("at least 12 characters"));
    }

    @Test
    @DisplayName("Should reject password without uppercase letter")
    void shouldRejectPasswordWithoutUppercase() {
        setupConstraintViolationMock();
        String noUppercase = "lowercase123!";

        boolean result = validator.isValid(noUppercase, context);

        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate(contains("uppercase letter"));
    }

    @Test
    @DisplayName("Should reject password without lowercase letter")
    void shouldRejectPasswordWithoutLowercase() {
        setupConstraintViolationMock();
        String noLowercase = "UPPERCASE123!";

        boolean result = validator.isValid(noLowercase, context);

        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate(contains("lowercase letter"));
    }

    @Test
    @DisplayName("Should reject password without digit")
    void shouldRejectPasswordWithoutDigit() {
        setupConstraintViolationMock();
        String noDigit = "NoDigitPassword!";

        boolean result = validator.isValid(noDigit, context);

        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate(contains("digit"));
    }

    @Test
    @DisplayName("Should reject password without special character")
    void shouldRejectPasswordWithoutSpecialChar() {
        setupConstraintViolationMock();
        String noSpecialChar = "NoSpecialChar123";

        boolean result = validator.isValid(noSpecialChar, context);

        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate(contains("special character"));
    }

    @Test
    @DisplayName("Should accept password with various special characters")
    void shouldAcceptPasswordWithVariousSpecialChars() {
        String[] passwords = {
            "ValidPassword123!",
            "ValidPassword123@",
            "ValidPassword123#",
            "ValidPassword123$",
            "ValidPassword123%",
            "ValidPassword123^",
            "ValidPassword123&",
            "ValidPassword123*",
            "ValidPassword123(",
            "ValidPassword123)"
        };

        for (String password : passwords) {
            assertTrue(validator.isValid(password, context), 
                "Should accept password: " + password);
        }
    }

    @Test
    @DisplayName("Should accept password exactly 12 characters")
    void shouldAcceptPasswordExactly12Chars() {
        String password = "ValidPass12!";

        boolean result = validator.isValid(password, context);

        assertTrue(result);
    }

    @Test
    @DisplayName("Should accept very long password")
    void shouldAcceptVeryLongPassword() {
        String longPassword = "ValidPassword123!" + "a".repeat(100);

        boolean result = validator.isValid(longPassword, context);

        assertTrue(result);
    }
}
