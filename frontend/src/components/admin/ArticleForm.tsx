import { useState, useEffect, useRef } from "react";
import { api } from "../../lib/api";
import { X, Save, Loader2, Upload, Image as ImageIcon } from "lucide-react";
import type { CreateArticleRequest, ImageUploadResponse } from "../../types/admin";
import type { TechniqueCategory, ArticleListDto } from "../../types/learning";

interface ArticleFormProps {
  article: ArticleListDto | null;
  onClose: () => void;
}

export default function ArticleForm({ article, onClose }: ArticleFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<CreateArticleRequest>({
    slug: "",
    title: "",
    subtitle: "",
    techniqueCategory: "METHOD_OF_LOCI",
    difficultyLevel: 1,
    contentMarkdown: "",
    coverImageUrl: "",
    author: "",
    estimatedReadMinutes: 5,
    requiredSkillLevel: 1,
    sequenceInCategory: 1,
    isIntroArticle: false,
    isPublished: false,
    language: "en",
  });

  useEffect(() => {
    if (article) {
      setFormData({
        slug: article.slug,
        title: article.title,
        subtitle: article.subtitle || "",
        techniqueCategory: article.techniqueCategory,
        difficultyLevel: article.difficultyLevel,
        contentMarkdown: article.contentMarkdown,
        coverImageUrl: article.coverImageUrl || "",
        author: article.author || "",
        estimatedReadMinutes: article.estimatedReadMinutes,
        requiredSkillLevel: article.requiredSkillLevel || undefined,
        sequenceInCategory: article.sequenceInCategory,
        isIntroArticle: article.isIntroArticle,
        isPublished: article.isPublished,
        language: article.language || "en",
      });
      // Mark slug as manually edited for existing articles
      setSlugManuallyEdited(true);
      // Set image preview if article has cover image
      if (article.coverImageUrl) {
        setImagePreview(article.coverImageUrl);
      }
    }
  }, [article]);

  // Reset selected file when article changes
  useEffect(() => {
    setSelectedFile(null);
  }, [article]);

  // Auto-generate slug from title
  useEffect(() => {
    // Only auto-generate for new articles and if slug hasn't been manually edited
    if (!article && !slugManuallyEdited && formData.title) {
      const generatedSlug = generateSlugFromTitle(formData.title);
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.title, article, slugManuallyEdited]);

  function generateSlugFromTitle(title: string): string {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 100);
  }

  function handleSlugChange(value: string) {
    // Sanitize the slug input in real-time
    const sanitized = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .substring(0, 100);
    
    setFormData({ ...formData, slug: sanitized });
    setSlugManuallyEdited(true);
  }

  async function handleImageUpload(file: File, articleId: string) {
    try {
      setUploadingImage(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      const { data } = await api.post<ImageUploadResponse>(
        `/api/admin/learning/articles/${articleId}/upload-image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Image upload response:", data);

      if (data.imageId) {
        // Create preview URL for the uploaded image
        const imageUrl = `/api/learning/images/${data.imageId}`;
        setImagePreview(imageUrl);
        console.log("Image uploaded successfully, URL:", imageUrl);
        return data.imageId;
      } else {
        console.error("Image upload failed:", data.message);
        throw new Error(data.message || "Failed to upload image");
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to upload image");
      return null;
    } finally {
      setUploadingImage(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    // If we're editing an existing article, upload immediately
    if (article?.id) {
      handleImageUpload(file, article.id);
    } else {
      // For new articles, store file and show preview - we'll upload after article creation
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (article) {
        // Update existing article
        const response = await api.put(`/api/admin/learning/articles/${article.id}`, formData);
        console.log("Article updated:", response.data);
        console.log("Updated language to:", response.data.language);
        // Small delay to ensure backend cache is cleared
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log("Calling onClose callback...");
        onClose();
      } else {
        // Create new article
        const response = await api.post("/api/admin/learning/articles", formData);
        console.log("Article created:", response.data);
        const newArticleId = response.data.id;
        
        // If user selected an image file, upload it now
        if (selectedFile) {
          console.log("Uploading image for new article...");
          await handleImageUpload(selectedFile, newArticleId);
        }
        
        onClose();
      }
    } catch (e: any) {
      console.error("Save error:", e);
      console.error("Save error:", e);
      console.log("Response headers:", e?.response?.headers);
      console.log("Response data:", e?.response?.data);

      // Check for custom error message in response header
      const errorMessage = e?.response?.headers?.["x-error-message"] 
        || e?.response?.data?.message 
        || e?.response?.data?.error 
        || e?.message
        || "Failed to save article";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="min-h-screen px-4 py-6 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header - Sticky */}
          <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-50">
              {article ? "Edit Article" : "Create New Article"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form - Scrollable */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
            <div className="space-y-4 sm:space-y-5">
              {/* Error Message */}
              {error && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center mt-0.5">
                      <span className="text-red-600 dark:text-red-400 text-xs font-bold">!</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-red-900 dark:text-red-200 mb-1">
                        {error.includes("intro article already exists") ? "Intro Article Conflict" : "Error"}
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {error}
                      </p>
                      {error.includes("intro article already exists") && (
                        <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                          💡 Tip: Go to the existing intro article and uncheck "Introduction Article" first.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300/70 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="Enter article title"
                />
                {!article && !slugManuallyEdited && formData.title && (
                  <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-300 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                    Auto-generating slug from title
                  </p>
                )}
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                  Slug <span className="text-red-500">*</span>
                  {!article && slugManuallyEdited && (
                    <button
                      type="button"
                      onClick={() => {
                        setSlugManuallyEdited(false);
                        const generatedSlug = generateSlugFromTitle(formData.title);
                        setFormData({ ...formData, slug: generatedSlug });
                      }}
                      className="ml-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-normal"
                    >
                      Reset to auto-generate
                    </button>
                  )}
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300/70 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-mono"
                  placeholder="article-slug"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {!article && !slugManuallyEdited ? (
                    <span className="text-emerald-600 dark:text-emerald-400">✨ Auto-generated from title • Edit to customize</span>
                  ) : (
                    "URL-friendly identifier (lowercase, hyphens only)"
                  )}
                </p>
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                  Subtitle
                </label>
                <input
                  type="text"
                  maxLength={300}
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300/70 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="Brief description"
                />
              </div>

              {/* Two Column Layout on Desktop */}
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Technique Category */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.techniqueCategory}
                    onChange={(e) => setFormData({ ...formData, techniqueCategory: e.target.value as TechniqueCategory })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300/70 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  >
                    <option value="METHOD_OF_LOCI">Method of Loci</option>
                    <option value="STORY_METHOD">Story Method</option>
                    <option value="PEG_SYSTEM">Peg System</option>
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                    Language <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300/70 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  >
                    <option value="en">🇬🇧 English</option>
                    <option value="pl">🇵🇱 Polish</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Users will only see articles in their preferred language
                  </p>
                </div>

                {/* Difficulty Level */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                    Difficulty (1-5) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={5}
                    value={formData.difficultyLevel}
                    onChange={(e) => setFormData({ ...formData, difficultyLevel: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300/70 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Sequence in Category */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                    Sequence in Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.sequenceInCategory}
                    onChange={(e) => setFormData({ ...formData, sequenceInCategory: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300/70 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Order within the selected category (1, 2, 3...)
                  </p>
                </div>

                {/* Estimated Read Minutes */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                    Read Time (min) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={120}
                    value={formData.estimatedReadMinutes}
                    onChange={(e) => setFormData({ ...formData, estimatedReadMinutes: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300/70 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Author */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                    Author
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300/70 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    placeholder="Author name"
                  />
                </div>
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                  Cover Image
                </label>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Image Preview or Upload Button */}
                {imagePreview ? (
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                      <img
                        src={imagePreview}
                        alt="Cover preview"
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="px-4 py-2 rounded-lg bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-slate-50 text-sm font-medium hover:bg-white dark:hover:bg-slate-900 transition-colors disabled:opacity-50"
                        >
                          {uploadingImage ? "Uploading..." : "Change Image"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-full px-4 py-8 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors flex flex-col items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-sm font-medium">Uploading image...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">Click to upload cover image</p>
                          <p className="text-xs mt-1">PNG, JPG, GIF up to 5MB</p>
                        </div>
                      </>
                    )}
                  </button>
                )}

                {/* Alternative: URL Input */}
                <div className="mt-3">
                  <details className="group">
                    <summary className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      Or enter image URL
                    </summary>
                    <div className="mt-2">
                      <input
                        type="url"
                        value={formData.coverImageUrl}
                        onChange={(e) => {
                          setFormData({ ...formData, coverImageUrl: e.target.value });
                          if (e.target.value) {
                            setImagePreview(e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300/70 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </details>
                </div>
              </div>

              {/* Content Markdown */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                  Content (Markdown) <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={12}
                  value={formData.contentMarkdown}
                  onChange={(e) => setFormData({ ...formData, contentMarkdown: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300/70 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-mono resize-y"
                  placeholder="# Article Content&#10;&#10;Write your article content in Markdown format..."
                />
              </div>

              {/* Intro Article Toggle */}
              <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-indigo-50 dark:bg-indigo-900/20">
                <input
                  type="checkbox"
                  id="isIntroArticle"
                  checked={formData.isIntroArticle}
                  onChange={(e) => setFormData({ ...formData, isIntroArticle: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <label htmlFor="isIntroArticle" className="text-sm font-medium text-slate-900 dark:text-slate-50 cursor-pointer block">
                    Introduction Article
                  </label>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    First article in this category (always accessible to all users)
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1.5 font-medium">
                    ⚠️ Note: Only one intro article per category is allowed
                  </p>
                </div>
              </div>

              {/* Published Toggle */}
              <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                />
                <label htmlFor="isPublished" className="text-sm font-medium text-slate-900 dark:text-slate-50 cursor-pointer">
                  Publish article (make visible to users)
                </label>
              </div>
            </div>
          </form>

          {/* Footer - Sticky */}
          <div className="px-4 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border border-slate-300/70 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {article ? "Update Article" : "Create Article"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
