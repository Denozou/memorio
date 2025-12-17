package com.memorio.backend.learning;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

@Service
public class ArticleCacheService {

    @CacheEvict(value = "articles", allEntries = true)
    public void evictAllArticleCache(){}

    @CacheEvict(value = "articles", key = "'slug:' + #slug")
    public void evictArticleBySlug(String slug){}

    @CacheEvict(value = "articles", key = "'category:' + #category")
    public void evictArticlesByCategory(TechniqueCategory category){}
}
