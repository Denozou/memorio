package com.memorio.backend.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI/Swagger configuration for API documentation.
 * Accessible at /swagger-ui.html
 */
@Configuration
public class OpenApiConfig {

    @Value("${frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Bean
    public OpenAPI memorioOpenAPI() {
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("Memorio API")
                        .description("""
                                REST API for Memorio - A Memory Training Application.

                                ## Overview
                                Memorio helps users improve their memory through various exercises,
                                learning articles, and gamification features.

                                ## Authentication
                                Most endpoints require JWT authentication. To authenticate:
                                1. Register a new account via `/auth/register`
                                2. Login via `/auth/login` to receive access and refresh tokens
                                3. Include the access token in the `Authorization` header as `Bearer <token>`

                                ## Features
                                - **Authentication**: Register, login, 2FA, OAuth2 (Google, Facebook)
                                - **Learning**: Articles with quizzes and progress tracking
                                - **Exercises**: Word linking, names & faces, number peg system
                                - **Gamification**: Points, badges, leaderboards
                                - **Adaptive Difficulty**: Personalized difficulty adjustment
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Memorio Support")
                                .email("support@memorio.app"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8080")
                                .description("Local Development Server"),
                        new Server()
                                .url(frontendUrl.replace(":3000", ":8080"))
                                .description("Production Server")))
                .tags(List.of(
                        new Tag().name("Authentication").description("User authentication and authorization"),
                        new Tag().name("Users").description("User profile and account management"),
                        new Tag().name("Learning").description("Learning articles and quizzes"),
                        new Tag().name("Exercises").description("Memory training exercises"),
                        new Tag().name("Gamification").description("Points, badges, and leaderboards"),
                        new Tag().name("Admin").description("Administrative operations"),
                        new Tag().name("Contact").description("Contact form and support")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("JWT access token. Obtain via `/auth/login` endpoint.")));
    }
}
