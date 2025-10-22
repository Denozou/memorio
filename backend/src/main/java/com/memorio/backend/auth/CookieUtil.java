package com.memorio.backend.auth;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.http.ResponseCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.core.env.Profiles;

@Component
public class CookieUtil {
    public static final String ACCESS_TOKEN_COOKIE = "accessToken";
    public static final String REFRESH_TOKEN_COOKIE = "refreshToken";

    @Value("${security.jwt.access-token-minutes:30}")
    private int accessTokenMinutes;
    @Value("${security.jwt.refresh-token-minutes:10080}") // 7 days!!!
    private int refreshTokenMinutes;

    private final Environment environment;
    public CookieUtil( Environment environment){
        this.environment = environment;
    }

    public void setAccessTokenCookie(HttpServletResponse response, String token){
        if (token == null || token.isBlank()){
            throw new IllegalArgumentException("Access token cannotbe null or empty");
        }
        ResponseCookie cookie = createSecureCookie(ACCESS_TOKEN_COOKIE, token, accessTokenMinutes * 60);
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public void setRefreshTokenCookie(HttpServletResponse response, String token){
        if(token == null || token.isBlank()){
            throw new IllegalArgumentException("Refresh token cannot be null or empty");
        }
        ResponseCookie cookie = createSecureCookie(REFRESH_TOKEN_COOKIE, token, refreshTokenMinutes *60);
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public void clearAuthCookies (HttpServletResponse response){
        ResponseCookie accessCookie = createSecureCookie(ACCESS_TOKEN_COOKIE, "", 0);
        ResponseCookie refreshCookie = createSecureCookie(REFRESH_TOKEN_COOKIE, "", 0);

        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
    }
    public String getAccessTokenFromCookies(HttpServletRequest request){
        return getCookieValue(request, ACCESS_TOKEN_COOKIE);
    }

    public String getRefreshTokenFromCookies(HttpServletRequest request){
        return getCookieValue(request, REFRESH_TOKEN_COOKIE);
    }

    private ResponseCookie createSecureCookie(String name, String value, int maxAgeSeconds){
        boolean isProduction = !environment.acceptsProfiles(Profiles.of("dev","development", "local"));

        return ResponseCookie.from(name,value)
                .httpOnly(true)
                .secure(isProduction)  // ДЛЯ ПРОДУ ЗМІНИТИ НА TRUE || set TRUE for production
                .path("/") // для проду треба буде поставити посилання на свій домен
                .maxAge(maxAgeSeconds)
                .sameSite("Lax")
                .build();
    }

    private String getCookieValue (HttpServletRequest request, String cookieName){
        if(request.getCookies() != null){
            for(Cookie cookie: request.getCookies()){
                if(cookieName.equals(cookie.getName())){
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}
