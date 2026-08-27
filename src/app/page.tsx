"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CirclePlay, Camera, Calendar, ArrowRight, Sparkles } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navbar */}
      <header className="px-6 py-4 flex items-center justify-between bg-white border-b border-slate-100">
        <div className="flex items-center gap-2 text-amber-600">
          <Sparkles className="w-6 h-6" />
          <span className="font-bold text-xl tracking-tight text-slate-900">PlateUp</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-slate-600 hover:text-amber-600">Log in</Button>
          </Link>
          <Link href="/login">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white">Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative px-6 py-24 md:py-32 flex flex-col items-center text-center overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-amber-50 rounded-full blur-3xl -z-10 opacity-50 pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/50 text-amber-800 text-sm font-medium mb-8 border border-amber-200">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Meal Planning</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl mb-6">
            What&apos;s for dinner? <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">Let AI decide.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed">
            Extract recipes from YouTube videos, snap photos of food, and let AI build your weekly meal plan. No more analysis paralysis.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center mb-16">
            <Link href="/login">
              <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white h-12 px-8 rounded-full text-base shadow-lg shadow-amber-600/20">
                Get Started <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Decorative Food Icons */}
          <div className="flex justify-center gap-6 text-4xl opacity-80 mt-4 select-none">
            <span className="animate-bounce" style={{ animationDelay: '0ms' }}>🍕</span>
            <span className="animate-bounce" style={{ animationDelay: '200ms' }}>🥗</span>
            <span className="animate-bounce" style={{ animationDelay: '400ms' }}>🍜</span>
            <span className="animate-bounce" style={{ animationDelay: '600ms' }}>🍣</span>
            <span className="animate-bounce" style={{ animationDelay: '800ms' }}>🥘</span>
            <span className="animate-bounce" style={{ animationDelay: '1000ms' }}>🍲</span>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-6 py-20 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Everything you need to eat well</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-4">
                    <CirclePlay className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl">YouTube to Recipe</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-slate-600">
                    Paste any cooking video URL and AI extracts the complete recipe with ingredients and instructions.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                    <Camera className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl">Photo to Recipe</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-slate-600">
                    Snap a photo of any dish and AI identifies it and gives you the full recipe to recreate it.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl">Smart Meal Planning</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-slate-600">
                    Your personal weekly menu that avoids repetition and removes the daily "what should I eat?" decision.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-slate-200 bg-white flex flex-col md:flex-row items-center justify-between">
        <p className="text-slate-500 text-sm">
          © {new Date().getFullYear()} PlateUp. All rights reserved.
        </p>
        <p className="text-slate-500 text-sm mt-4 md:mt-0 flex items-center gap-1">
          Built with <span className="text-red-500">❤️</span> and AI
        </p>
      </footer>
    </div>
  );
}
