package com.memorio.backend.auth;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;


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
        Cookie cookie = createSecureCookie(ACCESS_TOKEN_COOKIE, token, accessTokenMinutes * 60);
        response.addCookie(cookie);
    }

    public void setRefreshTokenCookie(HttpServletResponse response, String token){
        Cookie cookie = createSecureCookie(REFRESH_TOKEN_COOKIE, token, refreshTokenMinutes *60);
        response.addCookie(cookie);
    }

    public void clearAuthCookies (HttpServletResponse response){
        Cookie accessCookie = createSecureCookie(ACCESS_TOKEN_COOKIE, "", 0);
        Cookie refreshCookie = createSecureCookie(REFRESH_TOKEN_COOKIE, "", 0);

        response.addCookie(accessCookie);
        response.addCookie(refreshCookie);
    }
    public String getAccessTokenFromCookies(HttpServletRequest request){
        return getCookieValue(request, ACCESS_TOKEN_COOKIE);
    }

    public String getRefreshTokenFromCookies(HttpServletRequest request){
        return getCookieValue(request, REFRESH_TOKEN_COOKIE);
    }

    private Cookie createSecureCookie(String name, String value, int maxAgeSeconds){
        Cookie cookie = new Cookie(name, value);
        cookie.setHttpOnly(true);
        boolean isProduction = !environment.acceptsProfiles("dev", "development", "local");
        cookie.setSecure(isProduction); // ДЛЯ ПРОДУ ЗМІНИТИ НА TRUE || set TRUE for production
        cookie.setPath("/"); // для проду треба буде поставити посилання на свій домен
        cookie.setMaxAge(maxAgeSeconds);
        return cookie;
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
