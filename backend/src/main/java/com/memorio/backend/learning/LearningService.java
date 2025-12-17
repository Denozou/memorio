package com.memorio.backend.learning;

import com.memorio.backend.user.User;
import com.memorio.backend.user.Role;
import com.memorio.backend.common.error.NotFoundException;
import com.memorio.backend.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.time.OffsetDateTime;
import java.util.stream.Collectors;

@Service
@Transactional
public class LearningService {
    private final ArticleRepository articleRepo;
    private final UserArticleProgressRepository progressRepo;
    private final UserRepository userRepo;

    public LearningService(ArticleRepository articleRepo, UserArticleProgressRepository progressRepo,
                           UserRepository userRepo){
        this.articleRepo = articleRepo;
        this.progressRepo = progressRepo;
        this.userRepo = userRepo;

    }
    public List<Article> getAccessibleArticles(UUID userId){
        if (userId == null){
            return articleRepo.findAllIntroArticles();
        }

        User user = userRepo.findById(userId)
                .orElseThrow(()->new NotFoundException("User not found"));
        
        if (user.getRole() == Role.ADMIN) {
            return articleRepo.findAllByOrderByTechniqueCategoryAscSequenceInCategoryAsc();
        }
        /*
        List<Article> allPublished = articleRepo.findAllPublishedOrderedByCategory();
        List<UserArticleProgress> completedProgress = progressRepo.findCompletedByUserId(userId);
        Set<UUID> completedArticleIds = completedProgress.stream()
                .map(UserArticleProgress::getArticleId)
                .collect(Collectors.toSet());
        
        return allPublished.stream()
                .filter(article->isArticleAccessible(article, completedArticleIds, allPublished))
                .collect(Collectors.toList());

        */

        return articleRepo.findAllPublishedOrderedByCategory();
    }
    /*
    private boolean isArticleAccessible(Article article, Set<UUID> completedIds, List<Article> allArticles){
        if (article.getIsIntroArticle()) return true;

        TechniqueCategory category = article.getTechniqueCategory();
        Integer prevSequence = article.getSequenceInCategory() - 1;

        Optional<Article> previousArticle = allArticles.stream()
                .filter(a->a.getTechniqueCategory().equals(category))
                .filter(a->a.getSequenceInCategory().equals(prevSequence))
                .findFirst();
        
        return previousArticle.isPresent() && completedIds.contains(previousArticle.get().getId());
    }
    */
    public Article getArticleBySlug(String slug, UUID userId){
        Article article = articleRepo.findBySlug(slug)
                .orElseThrow(()-> new NotFoundException("Article not found:" + slug));

        User user = null;
        if(userId != null){
            user = userRepo.findById(userId)
                    .orElseThrow(()-> new NotFoundException("User not found"));
        }
        
        boolean isAdmin = user != null && user.getRole() == Role.ADMIN;

        if(!article.getIsPublished() && !isAdmin){
            throw new NotFoundException("Article not published");
        }
        /*
        // Admins bypass skill level checks
        if (!isAdmin && userId != null){
            List<Article> accessibleArticles = getAccessibleArticles(userId);
            boolean isAccessible = accessibleArticles.stream()
                    .anyMatch(a->a.getId().equals(article.getId()));
            if (!isAccessible){
                throw new IllegalStateException("Article locked. Complete previous article in this category first.");
            }
        } else if (userId == null && !article.getIsIntroArticle()) {
            throw new IllegalStateException("Please log in to access this article");
        }
        */
        if(isAdmin){
            return article;
        }

        if(userId == null && !article.getIsIntroArticle()){
            throw new IllegalStateException("Please log int to access this articles");
        }
        if(userId != null){
            if(!article.getIsIntroArticle()){
                Integer prevSequence = article.getSequenceInCategory() -1;
                Optional<Article> previousArticle = articleRepo.findByCategoryAndSequence(
                        article.getTechniqueCategory(),
                        prevSequence
                );

                if (previousArticle.isEmpty()) {
                    throw new IllegalStateException("Invalid article sequence");
                }

                UserArticleProgress prevProgress = progressRepo
                        .findByUserIdAndArticleId(userId, previousArticle.get().getId())
                        .orElse(null);

                if (prevProgress == null || !prevProgress.getQuizCompleted()) {
                    throw new IllegalStateException("Article locked. Complete the quiz for the previous article first.");
                }
            }
        }

        return article;
    }


    public List<Article> getArticleByCategory(TechniqueCategory category){
        return articleRepo.findByTechniqueCategoryAndIsPublishedTrue(category);
    }

    public void markArticleAsRead(UUID articleId, UUID userId){
        Article article = articleRepo.findById(articleId)
                .orElseThrow(()-> new NotFoundException("Article not found"));

        // Allow admins to mark unpublished articles as read (for testing)
        User user = userRepo.findById(userId)
                .orElseThrow(()-> new NotFoundException("User not found"));
        boolean isAdmin = user.getRole() == Role.ADMIN;
        
        if(!article.getIsPublished() && !isAdmin){
            throw new IllegalStateException("Article not published");
        }


        UserArticleProgress progress = progressRepo.findByUserIdAndArticleId(userId,articleId)
                .orElseGet(() -> {
                    UserArticleProgress newProgress = new UserArticleProgress(
                            userId,
                            articleId,
                            false, //will be set later
                            null, //will be set later
                            false, //quiz completed
                            null, //quiz score
                            0, //quiz attempts
                            null //quiz completed at
                    );
                    return progressRepo.save(newProgress);
                });

            if (!progress.getHasRead()){
                progress.setHasRead(true);
                progress.setFirstReadAt(OffsetDateTime.now());
                progressRepo.save(progress);
            }

    }


    public UserArticleProgress getUserArticleProgress(UUID userId, UUID articleId){
        return progressRepo.findByUserIdAndArticleId(userId, articleId)
                .orElse(null);
    }

    public List<UserArticleProgress> getUserProgress(UUID userId){
        return progressRepo.findByUserId(userId);
    }

    public Double getCompletionPercentage(UUID userId){
        Double percentage = progressRepo.getCompletionPercentage(userId);
        return percentage != null ? percentage : 0.0;
    }
}
