"use client";

import React, { useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRecipes } from '@/hooks/useRecipes';
import { useUsage } from '@/hooks/useUsage';
import { extractRecipeFromYouTube, extractRecipeFromYouTubeUrl, extractRecipeFromImage, ExtractedRecipe } from '@/lib/extract-recipe';
import { RecipePreview } from '@/components/recipe/RecipePreview';
import { UpgradePrompt } from '@/components/monetization/UpgradePrompt';
import { ProBadge } from '@/components/monetization/ProBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { 
  Sparkles, 
  CirclePlay, 
  Camera, 
  Loader2, 
  Upload, 
  ImageIcon, 
  AlertCircle
} from 'lucide-react';

const YOUTUBE_REGEX = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([-\w]{11})/;
const TIKTOK_REGEX = /(?:tiktok\.com\/@[\w.-]+\/video\/(\d+)|vm\.tiktok\.com\/([\w-]+)|tiktok\.com\/t\/([\w-]+))/;

function isYouTubeUrl(url: string): boolean {
  return YOUTUBE_REGEX.test(url);
}

function isTikTokUrl(url: string): boolean {
  return TIKTOK_REGEX.test(url);
}

function isValidVideoUrl(url: string): boolean {
  return isYouTubeUrl(url) || isTikTokUrl(url);
}

/**
 * Downscales an image File client-side to a max dimension (default 1920px)
 * and compresses to JPEG with quality 0.85 via HTMLCanvasElement.
 * Returns base64 data URL and normalized MIME type to prevent >4.5MB payload errors on huge photos.
 */
async function downscaleImageFile(
  file: File,
  maxDimension: number = 1920,
  quality: number = 0.85
): Promise<{ dataUrl: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Invalid file type. Please provide an image (JPEG, PNG, WebP, HEIC).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read selected image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for processing.'));
      img.onload = () => {
        try {
          let { width, height } = img;

          // Downscale if width or height exceeds maxDimension
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({
              dataUrl: reader.result as string,
              mimeType: file.type || 'image/jpeg',
            });
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Standardize to image/jpeg with 0.85 quality for optimal payload compression
          const mimeType = 'image/jpeg';
          const dataUrl = canvas.toDataURL(mimeType, quality);

          resolve({ dataUrl, mimeType });
        } catch {
          // Graceful fallback to unscaled data URL if canvas operations encounter error
          resolve({
            dataUrl: reader.result as string,
            mimeType: file.type || 'image/jpeg',
          });
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function ExtractRecipeContent() {
  const { addRecipe } = useRecipes();
  const { plan, remaining, isLimitReached, recordUsage } = useUsage();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [selectedTab, setSelectedTab] = useState<'youtube' | 'photo' | null>(null);
  const activeTab = selectedTab ?? (tabParam === 'photo' ? 'photo' : 'youtube');

  // YouTube State
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [isExtractingYoutube, setIsExtractingYoutube] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [isWatchingVideo, setIsWatchingVideo] = useState(false);

  // Photo State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isExtractingImage, setIsExtractingImage] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Shared State
  const [extractedRecipe, setExtractedRecipe] = useState<ExtractedRecipe | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [currentSource, setCurrentSource] = useState<'youtube' | 'image' | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(undefined);

  const handleYoutubeUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setYoutubeUrl(url);
    
    const ytMatch = url.match(YOUTUBE_REGEX);
    if (ytMatch && ytMatch[1]) {
      setYoutubeVideoId(ytMatch[1]);
      setYoutubeError(null);
    } else if (isTikTokUrl(url)) {
      setYoutubeVideoId('tiktok'); // flag to indicate valid TikTok URL
      setYoutubeError(null);
    } else {
      setYoutubeVideoId(null);
      if (url.trim() !== '') {
        setYoutubeError("Please enter a valid YouTube or TikTok URL");
      } else {
        setYoutubeError(null);
      }
    }
  };

  const handleExtractYoutube = async () => {
    if (!youtubeUrl || !youtubeVideoId) return;

    if (isLimitReached && plan !== 'pro') {
      toast.create({
        title: "Ready for More Recipes? ✨",
        description: "You've used your 5 free extractions this month. Upgrade to PlateUp Pro for unlimited recipe extractions anytime!",
        type: "warning",
      });
      return;
    }
    
    setIsExtractingYoutube(true);
    setYoutubeError(null);
    setExtractedRecipe(null);
    setIsSaved(false);
    setCurrentSource('youtube');
    setIsWatchingVideo(false);

    const isTikTok = isTikTokUrl(youtubeUrl);

    try {
      if (!isTikTok) {
        setThumbnailUrl(`https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`);
      } else {
        setThumbnailUrl(undefined); // TikTok doesn't have easy thumbnail URLs
      }

      if (isTikTok) {
        // TikTok goes straight to Gemini — no description path
        setIsWatchingVideo(true);
        const recipe = await extractRecipeFromYouTubeUrl(youtubeUrl);
        await recordUsage();
        setExtractedRecipe(recipe);
      } else {
        // YouTube: try description first, fall back to video
        const recipe = await extractRecipeFromYouTube(youtubeUrl, () =>
          setIsWatchingVideo(true)
        );
        await recordUsage();
        setExtractedRecipe(recipe);
      }
      
    } catch (error) {
      console.error("Extraction error:", error);
      setYoutubeError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsExtractingYoutube(false);
      setIsWatchingVideo(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImageError(null);
    setIsProcessingImage(true);

    try {
      const { dataUrl } = await downscaleImageFile(file, 1920, 0.85);
      setSelectedImage(dataUrl);
    } catch (error) {
      console.error("Image processing error:", error);
      setImageError(error instanceof Error ? error.message : 'Failed to process selected image');
      setSelectedImage(null);
      setImageFile(null);
    } finally {
      setIsProcessingImage(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleExtractImage = async () => {
    if (!selectedImage || !imageFile) return;

    if (isLimitReached && plan !== 'pro') {
      toast.create({
        title: "Ready for More Recipes? ✨",
        description: "You've used your 5 free extractions this month. Upgrade to PlateUp Pro for unlimited recipe extractions anytime!",
        type: "warning",
      });
      return;
    }

    setIsExtractingImage(true);
    setImageError(null);
    setExtractedRecipe(null);
    setIsSaved(false);
    setCurrentSource('image');

    try {
      // Extract base64 data (remove data:image/...;base64, prefix)
      const base64Data = selectedImage.split(',')[1];
      const mimeMatch = selectedImage.match(/^data:([^;]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : (imageFile.type || 'image/jpeg');

      if (selectedImage) {
        setThumbnailUrl(selectedImage);
      }

      const recipe = await extractRecipeFromImage(base64Data, mimeType);
      await recordUsage();
      setExtractedRecipe(recipe);
      
    } catch (error) {
      console.error("Image extraction error:", error);
      setImageError(error instanceof Error ? error.message : 'An unexpected error occurred while analyzing the image');
    } finally {
      setIsExtractingImage(false);
    }
  };

  const handleSaveRecipe = async () => {
    if (!extractedRecipe) return;

    setIsSaving(true);
    try {
      const finalThumbnailUrl = currentSource === 'youtube'
        ? thumbnailUrl
        : (selectedImage || thumbnailUrl || undefined);

      await addRecipe({
        name: extractedRecipe.name,
        description: extractedRecipe.description || '',
        source: currentSource || 'youtube',
        sourceUrl: currentSource === 'youtube' ? youtubeUrl : undefined,
        thumbnailUrl: finalThumbnailUrl,
        prepTimeMinutes: extractedRecipe.prepTimeMinutes,
        cookTimeMinutes: extractedRecipe.cookTimeMinutes,
        servings: extractedRecipe.servings,
        difficulty: extractedRecipe.difficulty,
        tags: extractedRecipe.tags,
        dietaryTags: extractedRecipe.dietaryTags || [],
        ingredients: extractedRecipe.ingredients,
        instructions: extractedRecipe.instructions,
      });

      setIsSaved(true);
      toast.create({
        title: "Recipe Saved! 📖",
        description: `"${extractedRecipe.name}" added to your recipes.`,
        type: "success",
      });
    } catch (error) {
      console.error("Failed to save recipe:", error);
      toast.create({
        title: "Failed to Save",
        description: "An error occurred while saving the recipe.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setExtractedRecipe(null);
    setIsSaved(false);
    setYoutubeUrl('');
    setYoutubeVideoId(null);
    setSelectedImage(null);
    setImageFile(null);
  };

  return (
    <div className="container max-w-4xl py-8 px-4 sm:px-6 lg:px-8 mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-orange-100 p-2 rounded-xl">
            <Sparkles className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Extract Recipe</h1>
            <p className="text-sm text-slate-500 mt-0.5">Turn any YouTube or TikTok cooking video, or food photo into a recipe</p>
          </div>
        </div>

        {plan === 'pro' ? (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border border-amber-300 text-amber-900 text-xs sm:text-sm font-semibold shadow-xs">
            <ProBadge size="xs" variant="gradient" />
            <span>Unlimited AI Extractions</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium">
            <Sparkles className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <span>{remaining} of 5 free extractions remaining this month</span>
          </div>
        )}
      </div>

      {!extractedRecipe ? (
        isLimitReached && plan !== 'pro' ? (
          <UpgradePrompt
            title="Unlock Unlimited Extractions with PlateUp Pro"
            description="You've made great use of your 5 free AI extractions this month. Upgrade to PlateUp Pro for unlimited recipe extractions and smart meal planning tools!"
          />
        ) : (
          <Tabs value={activeTab} onValueChange={(val) => setSelectedTab(val as 'youtube' | 'photo')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 p-1 rounded-xl">
              <TabsTrigger 
                value="youtube" 
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm py-2.5 transition-all"
              >
                <CirclePlay className="w-4 h-4 mr-2" />
                Video Link
              </TabsTrigger>
              <TabsTrigger 
                value="photo" 
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm py-2.5 transition-all"
              >
                <Camera className="w-4 h-4 mr-2" />
                Photo / Camera
              </TabsTrigger>
            </TabsList>

            <TabsContent value="youtube" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4">
                    <div className="space-y-2">
                      <label htmlFor="youtube-url" className="text-sm font-medium text-slate-700">
                        YouTube or TikTok Video URL
                      </label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <CirclePlay className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            id="youtube-url"
                            placeholder="Paste YouTube or TikTok cooking video URL..."
                            value={youtubeUrl}
                            onChange={handleYoutubeUrlChange}
                            className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-orange-500"
                            disabled={isExtractingYoutube}
                          />
                        </div>
                        <Button 
                          onClick={handleExtractYoutube} 
                          disabled={!youtubeUrl || !youtubeVideoId || isExtractingYoutube}
                          className="bg-orange-600 hover:bg-orange-700 text-white min-w-[140px]"
                        >
                          {isExtractingYoutube ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Extract Recipe
                            </>
                          )}
                        </Button>
                      </div>
                      {youtubeError && (
                        <p className="text-sm text-red-500 flex items-center mt-2">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {youtubeError}
                        </p>
                      )}
                    </div>

                    {youtubeVideoId && !isExtractingYoutube && !youtubeError && (
                      <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative aspect-video w-full max-w-lg mx-auto">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={`https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`}
                          alt="Video thumbnail"
                          className="object-cover w-full h-full"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="bg-red-600 text-white rounded-full p-3 shadow-lg">
                            <CirclePlay className="h-8 w-8" />
                          </div>
                        </div>
                      </div>
                    )}

                    {isExtractingYoutube && (
                      <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
                        <div className="relative mb-4">
                          <div className="absolute inset-0 bg-orange-200 rounded-full animate-ping opacity-75"></div>
                          <div className="relative bg-orange-100 text-orange-600 p-4 rounded-full">
                            <Sparkles className="h-8 w-8 animate-pulse" />
                          </div>
                        </div>
                        <h3 className="text-lg font-medium text-slate-800">
                          {isWatchingVideo ? '👨‍🍳 Chef is watching the video...' : '👨‍🍳 Chef is analyzing this recipe...'}
                        </h3>
                        <p className="text-slate-500 text-sm mt-2 max-w-sm">
                          {isWatchingVideo
                            ? 'No ingredient list found in the description, so our chef is watching the full video. Hang tight!'
                            : 'Our chef is pulling out all the ingredients and steps. Just a few seconds!'}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="photo" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="pt-6">
                    {isProcessingImage ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 rounded-xl border border-slate-200">
                        <Loader2 className="h-8 w-8 animate-spin text-orange-600 mb-3" />
                        <h4 className="text-sm font-semibold text-slate-800">Optimizing photo for extraction...</h4>
                        <p className="text-xs text-slate-500 mt-1">Scaling photo down to prevent upload size limits</p>
                      </div>
                    ) : !selectedImage ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Upload Area */}
                        <div 
                          className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-slate-50 hover:bg-slate-100 hover:border-orange-300 transition-colors cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div className="bg-white p-3 rounded-full shadow-sm">
                            <Upload className="h-6 w-6 text-slate-600" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-slate-800">Upload Photo</p>
                            <p className="text-xs text-slate-500 mt-1">Drag & drop or click to browse</p>
                          </div>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleImageSelect}
                          />
                        </div>

                        {/* Camera Area */}
                        <div 
                          className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-slate-50 hover:bg-slate-100 hover:border-orange-300 transition-colors cursor-pointer"
                          onClick={() => cameraInputRef.current?.click()}
                        >
                          <div className="bg-white p-3 rounded-full shadow-sm">
                            <Camera className="h-6 w-6 text-slate-600" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-slate-800">Take Photo</p>
                            <p className="text-xs text-slate-500 mt-1">Use your device camera</p>
                          </div>
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment"
                            className="hidden" 
                            ref={cameraInputRef}
                            onChange={handleImageSelect}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 mb-6 max-w-md w-full aspect-[4/3]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={selectedImage} 
                            alt="Selected food or recipe" 
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className="flex gap-3 w-full max-w-md">
                          <Button 
                            variant="outline" 
                            onClick={() => { setSelectedImage(null); setImageFile(null); }}
                            disabled={isExtractingImage}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleExtractImage} 
                            disabled={isExtractingImage}
                            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                          >
                            {isExtractingImage ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Extract Recipe
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {imageError && (
                      <p className="text-sm text-red-500 flex items-center justify-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {imageError}
                      </p>
                    )}

                    {isExtractingImage && (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="relative mb-4">
                          <div className="absolute inset-0 bg-orange-200 rounded-full animate-ping opacity-75"></div>
                          <div className="relative bg-orange-100 text-orange-600 p-4 rounded-full">
                            <ImageIcon className="h-8 w-8 animate-pulse" />
                          </div>
                        </div>
                        <h3 className="text-lg font-medium text-slate-800">👨‍🍳 Chef is analyzing this dish...</h3>
                        <p className="text-slate-500 text-sm mt-2 max-w-sm">
                          Our chef is identifying the food and building you a complete recipe. Just a moment!
                        </p>
                      </div>
                    )}

                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={handleReset}
              className="text-slate-500 hover:text-slate-800"
            >
              &larr; Extract another recipe
            </Button>
          </div>
          <RecipePreview 
            recipe={extractedRecipe} 
            isSaving={isSaving}
            isSaved={isSaved}
            onSave={handleSaveRecipe}
          />
        </div>
      )}
    </div>
  );
}

export default function ExtractRecipePage() {
  return (
    <Suspense fallback={
      <div className="container max-w-4xl py-8 px-4 sm:px-6 lg:px-8 mx-auto flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    }>
      <ExtractRecipeContent />
    </Suspense>
  );
}
