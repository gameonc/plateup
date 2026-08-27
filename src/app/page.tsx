"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  CirclePlay, 
  Camera, 
  Calendar, 
  ShoppingCart, 
  ArrowRight, 
  Check, 
  Star, 
  ChefHat, 
  Clock, 
  Flame, 
  ShieldCheck, 
  ChevronDown, 
  Users, 
  Utensils 
} from "lucide-react";

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "Is PlateUp free to use?",
      a: "Yes, get started for free! You can extract recipes, create meal plans, and generate shopping lists with no credit card required.",
    },
    {
      q: "How does AI recipe extraction work?",
      a: "Powered by Google Gemini 2.5 Flash, PlateUp reads video transcripts and analyzes food images to extract clean, structured recipes with exact measurements and step-by-step instructions in seconds.",
    },
    {
      q: "Can PlateUp accommodate my dietary preferences?",
      a: "Absolutely. PlateUp supports Vegetarian, Vegan, Keto, Gluten-Free, Dairy-Free, Low-Carb, and more. Our smart auto-fill strictly matches your preferences.",
    },
    {
      q: "Does the grocery shopping list combine duplicate ingredients?",
      a: "Yes! If three recipes this week require onions, garlic, or butter, PlateUp automatically normalizes units and sums the quantities together into one organized grocery list by supermarket aisle.",
    },
    {
      q: "Is PlateUp optimized for mobile devices?",
      a: "PlateUp is built mobile-first. Plan meals on your couch, check off ingredients at the grocery store, and cook in your kitchen with interactive ingredient checklists.",
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans selection:bg-orange-100 selection:text-orange-900">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between bg-white/95 backdrop-blur border-b border-stone-200/80">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-sm">
            <ChefHat className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-stone-900">PlateUp</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-stone-700 hover:text-primary font-medium">
              Log In
            </Button>
          </Link>
          <Link href="/login">
            <Button className="bg-primary hover:bg-orange-700 text-primary-foreground font-semibold shadow-sm rounded-lg px-4 sm:px-5">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-24 md:pb-28 max-w-7xl mx-auto flex flex-col items-center text-center overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] sm:w-[900px] h-[450px] bg-orange-200/40 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-amber-200/30 rounded-full blur-3xl -z-10 pointer-events-none" />

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100/80 text-orange-900 text-sm font-semibold mb-6 border border-orange-200/80 shadow-xs">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>AI-Powered Recipe & Meal Planning</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-stone-900 max-w-5xl mb-6 leading-[1.12]">
            Turn Any YouTube Cooking Video or Food Photo into a Complete Recipe & Meal Plan{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-600 to-primary">
              in Seconds
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-stone-600 max-w-3xl mb-10 leading-relaxed font-normal">
            Extract recipes from YouTube videos and dish photos, automatically build balanced weekly meal plans without repetition, and generate organized grocery shopping lists in one click.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full sm:w-auto mb-14">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-orange-700 text-primary-foreground h-13 px-8 rounded-xl text-base font-semibold shadow-lg shadow-orange-600/25 transition-all hover:scale-[1.02] active:scale-95">
                Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-13 px-8 rounded-xl text-base font-semibold border-stone-300 text-stone-700 hover:bg-stone-100 hover:text-stone-900 transition-all">
                Explore Recipes
              </Button>
            </Link>
          </div>

          {/* Social Proof Snippet */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-stone-600 text-sm font-medium mb-12">
            <div className="flex items-center gap-1.5">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-500" />
                ))}
              </div>
              <span className="font-semibold text-stone-900">4.9/5</span> from home cooks
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-600" />
              <span>50,000+ recipes planned</span>
            </div>
          </div>

          {/* Interactive UI Mockup Card Preview */}
          <div className="w-full max-w-4xl rounded-2xl border border-stone-200 bg-white/95 shadow-2xl shadow-stone-900/10 p-4 sm:p-6 text-left relative overflow-hidden backdrop-blur">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-stone-100 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-primary font-bold">
                  <ChefHat className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-stone-900 text-lg sm:text-xl">Creamy Tuscan Garlic Chicken</h3>
                    <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs gap-1">
                      <CirclePlay className="w-3 h-3" /> YouTube Extracted
                    </Badge>
                  </div>
                  <p className="text-xs text-stone-500">Extracted from 12-minute cooking video in 3.4 seconds</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-none font-medium">Gluten-Free</Badge>
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-none font-medium">High-Protein</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
              {/* Quick Metrics */}
              <div className="md:col-span-1 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-100">
                    <Clock className="w-4 h-4 text-primary mx-auto mb-1" />
                    <div className="text-xs text-stone-500">Prep + Cook</div>
                    <div className="font-semibold text-sm text-stone-900">25 min</div>
                  </div>
                  <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-100">
                    <Users className="w-4 h-4 text-primary mx-auto mb-1" />
                    <div className="text-xs text-stone-500">Servings</div>
                    <div className="font-semibold text-sm text-stone-900">4 People</div>
                  </div>
                </div>

                <div className="p-3 bg-orange-50/70 rounded-xl border border-orange-100 text-xs text-orange-950 space-y-1.5">
                  <div className="font-semibold flex items-center gap-1.5 text-primary">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Smart Suggestion
                  </div>
                  <p className="leading-relaxed">
                    Assigned to <strong>Wednesday Dinner</strong> to avoid repeating poultry from Tuesday.
                  </p>
                </div>
              </div>

              {/* Ingredients Checklist Preview */}
              <div className="md:col-span-2 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Extracted Ingredients (6 items)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {[
                    "2 lbs Chicken breast, cubed",
                    "1 cup Heavy cream",
                    "1/2 cup Sun-dried tomatoes",
                    "3 cups Fresh baby spinach",
                    "4 cloves Garlic, minced",
                    "1/2 cup Grated Parmesan cheese",
                  ].map((ing, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg border border-stone-100 text-stone-700">
                      <div className="w-4 h-4 rounded bg-primary/15 text-primary flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="truncate text-xs font-medium">{ing}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="px-4 sm:px-6 lg:px-8 py-20 bg-white border-y border-stone-200">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight mb-4">
                Everything you need to eat well, cooked from scratch
              </h2>
              <p className="text-lg text-stone-600">
                PlateUp combines cutting-edge AI recipe understanding with smart weekly meal planning and automated grocery math.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <Card className="border-stone-200/80 shadow-sm hover:shadow-md hover:border-orange-200 transition-all rounded-2xl">
                <CardHeader>
                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-3">
                    <CirclePlay className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl text-stone-900">AI YouTube Extraction</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-stone-600 leading-relaxed">
                    Paste any cooking video URL and get clean, formatted recipes with exact quantities, cook times, and instructions in seconds.
                  </CardDescription>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="border-stone-200/80 shadow-sm hover:shadow-md hover:border-orange-200 transition-all rounded-2xl">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-3">
                    <Camera className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl text-stone-900">Food Photo Recognition</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-stone-600 leading-relaxed">
                    Snap a photo of any restaurant dish or food picture. Gemini vision AI identifies ingredients and reconstructs the step-by-step recipe.
                  </CardDescription>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="border-stone-200/80 shadow-sm hover:shadow-md hover:border-orange-200 transition-all rounded-2xl">
                <CardHeader>
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-3">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl text-stone-900">Smart Weekly Planner</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-stone-600 leading-relaxed">
                    Auto-fill 7 days × 3 meals with balanced variety. The algorithm avoids recent repeats and adapts to your cooking habits.
                  </CardDescription>
                </CardContent>
              </Card>

              {/* Feature 4 */}
              <Card className="border-stone-200/80 shadow-sm hover:shadow-md hover:border-orange-200 transition-all rounded-2xl">
                <CardHeader>
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl text-stone-900">Intelligent Grocery List</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-stone-600 leading-relaxed">
                    Aggregates ingredients from your weekly meal plan, intelligently sums duplicate quantities, and sorts items by supermarket department.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Dietary Personalization Showcase */}
        <section className="px-4 sm:px-6 lg:px-8 py-20 bg-stone-50">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider">
                Personalized Nutrition
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
                Dietary preferences built directly into your meal plans
              </h2>
              <p className="text-stone-600 text-base sm:text-lg leading-relaxed">
                Whether you are strictly vegan, keeping it keto, or managing family allergies, PlateUp tags extracted recipes and auto-fills plans matching your lifestyle.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                {[
                  "Vegetarian",
                  "Vegan",
                  "Keto",
                  "Gluten-Free",
                  "Dairy-Free",
                  "Low-Carb",
                  "Pescatarian",
                  "Nut-Free",
                ].map((diet) => (
                  <div key={diet} className="flex items-center gap-1.5 p-2 bg-white rounded-lg border border-stone-200 text-stone-800 text-xs font-semibold shadow-2xs">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{diet}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:w-1/2 w-full">
              <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <span className="font-bold text-stone-900">Your Dietary Profile</span>
                  <Badge className="bg-emerald-600 text-white">Active Filters</Badge>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                    <span className="font-medium text-stone-800">Dietary Restrictions</span>
                    <span className="text-emerald-700 font-semibold">Gluten-Free, Dairy-Free</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                    <span className="font-medium text-stone-800">Recipe Repeat Window</span>
                    <span className="text-primary font-semibold">5 Days Minimum</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                    <span className="font-medium text-stone-800">Meals Per Day</span>
                    <span className="text-stone-700 font-semibold">Breakfast, Lunch, Dinner</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials / Social Proof */}
        <section className="px-4 sm:px-6 lg:px-8 py-20 bg-white border-t border-stone-200">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl font-extrabold text-stone-900 tracking-tight mb-3">
                Loved by busy home chefs
              </h2>
              <p className="text-stone-600">
                Here is how PlateUp transforms weeknight cooking for real households.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-stone-200 shadow-xs p-6 flex flex-col justify-between rounded-2xl bg-stone-50/50">
                <div className="space-y-4">
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-500" />
                    ))}
                  </div>
                  <p className="text-stone-700 text-sm sm:text-base leading-relaxed italic">
                    &quot;I used to bookmark dozens of YouTube cooking videos that I never actually made. PlateUp extracts the recipe in 5 seconds and puts it right into my grocery list.&quot;
                  </p>
                </div>
                <div className="pt-6 border-t border-stone-200/60 mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-200 text-primary font-bold flex items-center justify-center text-sm">
                    SK
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm">Sarah K.</h4>
                    <p className="text-xs text-stone-500">Home Cook & Parent of 2</p>
                  </div>
                </div>
              </Card>

              <Card className="border-stone-200 shadow-xs p-6 flex flex-col justify-between rounded-2xl bg-stone-50/50">
                <div className="space-y-4">
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-500" />
                    ))}
                  </div>
                  <p className="text-stone-700 text-sm sm:text-base leading-relaxed italic">
                    &quot;The meal plan auto-fill is a game changer. It makes sure we don&apos;t eat the same chicken dish twice in one week and generates our grocery list with all duplicate garlic and onions combined.&quot;
                  </p>
                </div>
                <div className="pt-6 border-t border-stone-200/60 mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-200 text-amber-800 font-bold flex items-center justify-center text-sm">
                    MR
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm">Marcus R.</h4>
                    <p className="text-xs text-stone-500">Fitness Enthusiast (Keto)</p>
                  </div>
                </div>
              </Card>

              <Card className="border-stone-200 shadow-xs p-6 flex flex-col justify-between rounded-2xl bg-stone-50/50">
                <div className="space-y-4">
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-500" />
                    ))}
                  </div>
                  <p className="text-stone-700 text-sm sm:text-base leading-relaxed italic">
                    &quot;Snapping a photo of a restaurant meal and having PlateUp identify the ingredients and steps to recreate it at home feels like pure magic.&quot;
                  </p>
                </div>
                <div className="pt-6 border-t border-stone-200/60 mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-200 text-emerald-800 font-bold flex items-center justify-center text-sm">
                    EL
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm">Elena L.</h4>
                    <p className="text-xs text-stone-500">Culinary Blogger</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Accordion Section */}
        <section className="px-4 sm:px-6 lg:px-8 py-20 bg-stone-50 border-t border-stone-200">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-stone-900 tracking-tight mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-stone-600">
                Have questions about PlateUp? We&apos;ve got answers.
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="bg-white rounded-xl border border-stone-200 overflow-hidden transition-all shadow-xs"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(index)}
                      className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-semibold text-stone-900 hover:text-primary transition-colors cursor-pointer"
                      aria-expanded={isOpen}
                    >
                      <span className="text-base sm:text-lg">{faq.q}</span>
                      <ChevronDown
                        className={`w-5 h-5 shrink-0 text-stone-400 transition-transform duration-200 ${
                          isOpen ? "transform rotate-180 text-primary" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 pt-1 text-stone-600 text-sm sm:text-base leading-relaxed border-t border-stone-100">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-br from-orange-600 via-primary to-amber-600 text-white text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Ready to take the stress out of dinner?
            </h2>
            <p className="text-lg sm:text-xl text-orange-100 max-w-2xl mx-auto font-normal">
              Join thousands of home cooks who extract recipes, plan meals, and shop smarter with PlateUp.
            </p>
            <div className="pt-4">
              <Link href="/login">
                <Button size="lg" className="bg-white hover:bg-stone-100 text-orange-700 h-14 px-10 rounded-xl text-lg font-bold shadow-xl transition-all hover:scale-105 active:scale-95">
                  Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Modern Footer */}
      <footer className="px-4 sm:px-6 lg:px-8 py-10 border-t border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
              <ChefHat className="w-4 h-4" />
            </div>
            <span className="font-bold text-stone-900">PlateUp</span>
            <span className="text-xs text-stone-400 ml-2">© {new Date().getFullYear()} PlateUp. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-stone-500">
            <Link href="/login" className="hover:text-primary transition-colors">Sign In</Link>
            <Link href="/login" className="hover:text-primary transition-colors">Sign Up</Link>
            <span className="flex items-center gap-1 text-stone-400">
              Built with <Utensils className="w-3.5 h-3.5 text-primary inline" /> & AI
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
