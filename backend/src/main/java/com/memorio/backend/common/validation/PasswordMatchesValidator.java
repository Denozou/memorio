package com.memorio.backend.common.validation;
import com.memorio.backend.auth.dto.RegisterRequest;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PasswordMatchesValidator implements ConstraintValidator<PasswordMatches, RegisterRequest>{
    @Override
    public void initialize(PasswordMatches constraintAnnotation){


    }
    @Override
    public boolean isValid(RegisterRequest request,
                           ConstraintValidatorContext context){
        if(request == null) return true; //let @NotNull handle null checks

        String password = request.getPassword();
        String confirmPassword = request.getConfirmPassword();
        if(password == null || confirmPassword == null) return true; //let @NotBlank handle null/empty checks

        return password.equals(confirmPassword);
    }
}
