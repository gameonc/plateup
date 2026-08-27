"use client";

import React, { useState, useRef } from 'react';
import { useRecipes } from '@/hooks/useRecipes';
import { extractRecipeFromTranscript, extractRecipeFromImage, ExtractedRecipe } from '@/lib/extract-recipe';
import { RecipePreview } from '@/components/recipe/RecipePreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Sparkles, 
  CirclePlay, 
  Camera, 
  Loader2, 
  Upload, 
  ImageIcon, 
  AlertCircle 
} from 'lucide-react';
import Image from 'next/image';

const YOUTUBE_REGEX = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([-\w]{11})/;

export default function ExtractRecipePage() {
  const { addRecipe } = useRecipes();
  

  // YouTube State
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [isExtractingYoutube, setIsExtractingYoutube] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);

  // Photo State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isExtractingImage, setIsExtractingImage] = useState(false);
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
    
    const match = url.match(YOUTUBE_REGEX);
    if (match && match[1]) {
      setYoutubeVideoId(match[1]);
      setYoutubeError(null);
    } else {
      setYoutubeVideoId(null);
      if (url.trim() !== '') {
        setYoutubeError("Please enter a valid YouTube URL");
      } else {
        setYoutubeError(null);
      }
    }
  };

  const handleExtractYoutube = async () => {
    if (!youtubeUrl || !youtubeVideoId) return;
    
    setIsExtractingYoutube(true);
    setYoutubeError(null);
    setExtractedRecipe(null);
    setIsSaved(false);
    setCurrentSource('youtube');

    try {
      // 1. Call API to get transcript
      const response = await fetch('/api/youtube-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch video transcript. Make sure the video has captions.');
      }

      const data = await response.json();
      
      if (!data.transcript) {
        throw new Error('Could not extract transcript from this video.');
      }

      setThumbnailUrl(data.thumbnailUrl || `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`);

      // 2. Call Gemini to parse the recipe
      const recipe = await extractRecipeFromTranscript(
        data.title, 
        data.description, 
        data.transcript
      );

      setExtractedRecipe(recipe);
      
    } catch (error) {
      console.error("YouTube extraction error:", error);
      setYoutubeError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsExtractingYoutube(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImageError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleExtractImage = async () => {
    if (!selectedImage || !imageFile) return;

    setIsExtractingImage(true);
    setImageError(null);
    setExtractedRecipe(null);
    setIsSaved(false);
    setCurrentSource('image');

    try {
      // Extract base64 data (remove data:image/...;base64, prefix)
      const base64Data = selectedImage.split(',')[1];
      const mimeType = imageFile.type;

      const recipe = await extractRecipeFromImage(base64Data, mimeType);
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
      await addRecipe({
        name: extractedRecipe.name,
        description: extractedRecipe.description || '',
        source: currentSource || 'youtube',
        sourceUrl: currentSource === 'youtube' ? youtubeUrl : undefined,
        thumbnailUrl: currentSource === 'youtube' ? thumbnailUrl : undefined,
        prepTimeMinutes: extractedRecipe.prepTimeMinutes,
        cookTimeMinutes: extractedRecipe.cookTimeMinutes,
        servings: extractedRecipe.servings,
        difficulty: extractedRecipe.difficulty,
        tags: extractedRecipe.tags,
        ingredients: extractedRecipe.ingredients,
        instructions: extractedRecipe.instructions,
      });

      setIsSaved(true);
    } catch (error) {
      console.error("Failed to save recipe:", error);
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
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-orange-100 p-2 rounded-xl">
          <Sparkles className="h-6 w-6 text-orange-600" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Extract Recipe</h1>
      </div>

      {!extractedRecipe ? (
        <Tabs defaultValue="youtube" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 p-1 rounded-xl">
            <TabsTrigger 
              value="youtube" 
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm py-2.5 transition-all"
            >
              <CirclePlay className="w-4 h-4 mr-2" />
              YouTube Video
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
                      YouTube Cooking Video URL
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <CirclePlay className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="youtube-url"
                          placeholder="Paste YouTube cooking video URL..."
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
                      <h3 className="text-lg font-medium text-slate-800">AI is analyzing the video...</h3>
                      <p className="text-slate-500 text-sm mt-2 max-w-sm">
                        This usually takes about 10-20 seconds as we read the transcript and extract the ingredients and steps.
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
                <div className="flex flex-col gap-6">
                  
                  {!selectedImage ? (
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
                      <h3 className="text-lg font-medium text-slate-800">AI is identifying the dish...</h3>
                      <p className="text-slate-500 text-sm mt-2 max-w-sm">
                        This takes a few seconds while we analyze the image and generate the recipe.
                      </p>
                    </div>
                  )}

                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
