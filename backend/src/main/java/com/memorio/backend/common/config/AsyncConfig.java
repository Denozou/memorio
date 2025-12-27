package com.memorio.backend.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Configuration to enable async method execution.
 * Used for non-blocking operations like cache warming on startup.
 */
@Configuration
@EnableAsync
public class AsyncConfig {
    // Spring Boot auto-configures a default TaskExecutor
    // Custom executor can be added here if needed for production tuning
}
