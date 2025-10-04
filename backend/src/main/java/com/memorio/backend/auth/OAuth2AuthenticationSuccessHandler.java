package com.memorio.backend.auth;
import com.memorio.backend.common.security.JwtService;
import com.memorio.backend.user.User;
import com.memorio.backend.user.UserIdentity;
import com.memorio.backend.user.UserRepository;
import com.memorio.backend.user.UserIdentityRepository;
import com.memorio.backend.user.Role;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler{
    private final UserRepository userRepository;
    private final UserIdentityRepository userIdentityRepository;
    private final JwtService jwtService;
    private final CookieUtil cookieUtil;
    public OAuth2AuthenticationSuccessHandler(UserRepository userRepository,
                                              UserIdentityRepository userIdentityRepository,
                                              JwtService jwtService, CookieUtil cookieUtil){
        this.userRepository = userRepository;
        this.userIdentityRepository = userIdentityRepository;
        this.jwtService = jwtService;
        this.cookieUtil = cookieUtil;
    }
    @Override
    @Transactional
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException{
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        String provider = extractProvider(request);

        String providerUserId = extractProviderUserId(oauth2User, provider);
        if (providerUserId == null){
            providerUserId = oauth2User.getAttribute("id");
        }
        String email = extractStringAttribute(oauth2User, "email");
        String name = extractStringAttribute(oauth2User, "name");
        String pictureUrl = extractPictureUrl(oauth2User, provider);
        /// ////////////////////////
        System.out.println("=== OAuth2 Debug Info ===");
        System.out.println("Provider: " + provider);
        System.out.println("Provider User ID (sub): " + providerUserId);
        System.out.println("Email: " + email);
        System.out.println("Name: " + name);
        System.out.println("Picture URL: " + pictureUrl);
        System.out.println("All attributes: " + oauth2User.getAttributes());
        System.out.println("========================");
        if (providerUserId == null || email == null) {
            throw new IllegalArgumentException("Missing required OAuth2 user information: providerUserId=" + providerUserId + ", email=" + email);
        }
        /// ////////////////////////
        User user = findOrCreateUser(email, name, pictureUrl);
        findOrCreateUserIdentity(user, provider, providerUserId);

        String accessToken = jwtService.generateAccessToken(
                user.getId().toString(),
                user.getEmail(),
                List.of(user.getRole().name())
        );
        String refreshToken = jwtService.generateRefreshToken(user.getId().toString());
        Instant expiresAt = jwtService.getExpiration(accessToken);

        cookieUtil.setAccessTokenCookie(response, accessToken);
        cookieUtil.setRefreshTokenCookie(response, refreshToken);

        redirectToFrontendWithTokens(response);
    }

    /**
     * Extracts the OAuth2 provider name from the request URL.
     * For example: /login/oauth2/code/google -> "google"
     */
    private String extractProvider(HttpServletRequest request) {
        String requestURI = request.getRequestURI();
        System.out.println("Debug - Request URI: " + requestURI); // Debug logging

        // The callback URL format is: /login/oauth2/code/{provider}
        if(requestURI.contains("/login/oauth2/code/")){
            String[] parts = requestURI.split("/");
            String provider = parts[parts.length - 1];
            System.out.println("Debug - Extracted provider: " + provider);
            return provider;
        }

        // Fallback for authorization URL format: /oauth2/authorization/{provider}
        if(requestURI.contains("/oauth2/authorization/")){
            String[] parts = requestURI.split("/");
            String provider = parts[parts.length - 1];
            System.out.println("Debug - Extracted provider (fallback): " + provider);
            return provider;
        }

        System.out.println("Debug - Could not extract provider from URI: " + requestURI);
        return "unknown";
    }

    private String extractProviderUserId(OAuth2User oauth2User, String provider){
        switch(provider.toLowerCase()){
            case "google":
                return extractStringAttribute(oauth2User, "sub");
            case "facebook":
                return extractStringAttribute(oauth2User, "id");
            default:
                String userId = extractStringAttribute(oauth2User, "sub");
                if(userId == null){
                    userId = extractStringAttribute(oauth2User, "id");
                }
                return userId;
        }
    }

    private String extractPictureUrl (OAuth2User oauth2User, String provider){
        switch(provider.toLowerCase()){
            case "google":
                return extractStringAttribute(oauth2User, "picture");
            case "facebook":
                Object pictureObj = oauth2User.getAttribute("picture");
                if(pictureObj instanceof Map){
                    @SuppressWarnings("unchecked")
                    Map<String, Object> pictureMap = (Map<String, Object>) pictureObj;
                    Object dataObj = pictureMap.get("data");
                    if(dataObj instanceof Map){
                        @SuppressWarnings("unchecked")
                        Map<String, Object> dataMap = (Map<String, Object>) dataObj;
                        Object urlObj = dataMap.get("url");
                        return urlObj != null ? urlObj.toString() : null;
                    }
                }
                return null;
            default:
                return extractStringAttribute(oauth2User, "picture");
        }


    }
    private String extractStringAttribute(OAuth2User oauth2User, String attributeName){
        Object attribute = oauth2User.getAttribute(attributeName);
        return attribute != null ? attribute.toString() : null;
    }

    private User findOrCreateUser(String email, String name, String pictureUrl){
        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent()){
            User user = existingUser.get();
            if(pictureUrl != null && !pictureUrl.isEmpty()){
                user.setPictureUrl(pictureUrl);
                userRepository.save(user);
            }
            return user;
        }else{
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setPasswordHash(null);
            newUser.setRole(Role.USER);
            newUser.setPictureUrl(pictureUrl);

            return userRepository.save(newUser);
        }
    }

    private UserIdentity findOrCreateUserIdentity(User user, String provider, String providerUserId){
        Optional<UserIdentity> existingIdentity = userIdentityRepository.findByUserIdAndProvider(
                user.getId(), provider
        );
        if (existingIdentity.isPresent()){
            return existingIdentity.get();
        } else{
            UserIdentity newIdentity = new UserIdentity();
            newIdentity.setUser(user);
            newIdentity.setProvider(provider);
            newIdentity.setProviderUserId(providerUserId);

            return userIdentityRepository.save(newIdentity);
        }
    }

    private void redirectToFrontendWithTokens(
            HttpServletResponse response
            ) throws IOException
    {
        String frontEndUrl = "http://localhost:5173";
        String redirectUrl = frontEndUrl + "auth/oauth2/success";
        response.sendRedirect(redirectUrl);

    }

}
