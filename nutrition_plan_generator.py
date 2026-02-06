#!/usr/bin/env python3
"""
Personal Nutrition Plan Generator
Collects user preferences and generates personalised nutrition plans using Claude API
"""

import os
import json
from anthropic import Anthropic
from datetime import datetime
from pdf_generator import create_nutrition_plan_pdf

class NutritionPlanGenerator:
    def __init__(self):
        self.client = None
        self.user_data = {}

    def setup_api(self):
        """Initialise Anthropic API client"""
        api_key = os.environ.get('ANTHROPIC_API_KEY')
        if not api_key:
            print("\n⚠️  ANTHROPIC_API_KEY not found in environment variables.")
            api_key = input("Please enter your Anthropic API key: ").strip()
            if not api_key:
                raise ValueError("API key is required to generate nutrition plans")

        self.client = Anthropic(api_key=api_key)
        print("✅ API client initialised\n")

    def collect_user_info(self):
        """Collect user information through CLI prompts"""
        print("=" * 60)
        print("🥗 PERSONAL NUTRITION PLAN GENERATOR")
        print("=" * 60)
        print("\nLet's create your personalised nutrition plan!\n")

        # Personal Information
        print("📋 PERSONAL INFORMATION")
        print("-" * 60)
        self.user_data['name'] = input("What's your name? ").strip()
        self.user_data['age'] = input("Age: ").strip()

        # Gender - M or F only
        while True:
            gender = input("Gender (M/F): ").strip().upper()
            if gender in ['M', 'F']:
                self.user_data['gender'] = gender
                break
            else:
                print("Please enter M or F")

        self.user_data['height'] = input("Height (e.g., 5'10\" or 178cm): ").strip()
        self.user_data['weight'] = input("Current weight (e.g., 165lbs or 75kg): ").strip()
        self.user_data['ideal_weight'] = input("Ideal weight (e.g., 155lbs or 70kg): ").strip()

        # Activity Level
        print("\n🏃 ACTIVITY LEVEL")
        print("-" * 60)
        print("1. Sedentary (little or no exercise)")
        print("2. Lightly active (light exercise 1-3 days/week)")
        print("3. Moderately active (moderate exercise 3-5 days/week)")
        print("4. Very active (hard exercise 6-7 days/week)")
        print("5. Extra active (very hard exercise & physical job)")
        activity_choice = input("\nSelect your activity level (1-5): ").strip()
        activity_map = {
            '1': 'Sedentary',
            '2': 'Lightly active',
            '3': 'Moderately active',
            '4': 'Very active',
            '5': 'Extra active'
        }
        self.user_data['activity_level'] = activity_map.get(activity_choice, 'Moderately active')

        # Goals
        print("\n🎯 NUTRITION GOALS")
        print("-" * 60)
        print("1. Fat loss (maintain muscle)")
        print("2. Weight maintenance")
        print("3. Muscle gain / bulking")
        print("4. General health & wellness")
        goal_choice = input("\nWhat's your primary goal? (1-4): ").strip()
        goal_map = {
            '1': 'Fat loss (maintain muscle)',
            '2': 'Weight maintenance',
            '3': 'Muscle gain / bulking',
            '4': 'General health & wellness'
        }
        self.user_data['goal'] = goal_map.get(goal_choice, 'General health & wellness')

        # Dietary Requirements
        print("\n🚫 DIETARY REQUIREMENTS & RESTRICTIONS")
        print("-" * 60)
        self.user_data['dietary_type'] = input("Diet type (e.g., omnivore, vegetarian, vegan, pescatarian): ").strip() or "omnivore"
        self.user_data['allergies'] = input("Any allergies? (comma-separated): ").strip()
        self.user_data['dislikes'] = input("Foods you dislike or want to avoid: ").strip()
        self.user_data['preferences'] = input("Cuisine preferences (e.g., Mediterranean, Asian, Mexican): ").strip()

        # Practical Constraints
        print("\n💰 PRACTICAL CONSTRAINTS")
        print("-" * 60)
        self.user_data['budget'] = input("Weekly food budget (e.g., £50, £100): ").strip()

        print("\nCooking skill level:")
        print("1. Beginner (simple recipes)")
        print("2. Intermediate (moderate complexity)")
        print("3. Advanced (any complexity)")
        skill_choice = input("Select (1-3): ").strip()
        skill_map = {'1': 'Beginner', '2': 'Intermediate', '3': 'Advanced'}
        self.user_data['cooking_skill'] = skill_map.get(skill_choice, 'Intermediate')

        self.user_data['prep_time'] = input("Max time for meal prep per day (minutes): ").strip() or "30"
        self.user_data['meals_per_day'] = input("Meals per day (3-6): ").strip() or "3"

        # Plan Duration
        print("\n📅 PLAN DETAILS")
        print("-" * 60)
        self.user_data['plan_duration'] = input("Plan duration in days (e.g., 7 for one week): ").strip() or "7"
        self.user_data['meal_prep_style'] = input("Meal prep preference (daily/batch/mixed): ").strip() or "mixed"

        print("\n✅ All information collected!\n")

    def generate_nutrition_plan(self):
        """Generate nutrition plan using Claude API"""
        print("🤖 Generating your personalised nutrition plan...")
        print("⏳ This may take a moment...\n")

        # Build the prompt
        prompt = self._build_nutrition_prompt()

        # Call Claude API
        try:
            message = self.client.messages.create(
                model="claude-sonnet-4-5-20250929",
                max_tokens=16000,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )

            nutrition_plan = message.content[0].text
            self.user_data['generated_plan'] = nutrition_plan

            print("✅ Nutrition plan generated successfully!\n")
            return nutrition_plan

        except Exception as e:
            print(f"❌ Error generating nutrition plan: {e}")
            return None

    def _build_nutrition_prompt(self):
        """Build the prompt for Claude to generate nutrition plan"""
        prompt = f"""You are an expert nutritionist and meal planning specialist. Create a comprehensive, personalised nutrition plan based on the following client information.

IMPORTANT: Use British English spelling throughout (optimise, colour, fibre, etc.) and UK currency (£).

CLIENT PROFILE:
- Name: {self.user_data['name']}
- Age: {self.user_data['age']}, Gender: {self.user_data['gender']}
- Height: {self.user_data['height']}
- Current Weight: {self.user_data['weight']}
- Ideal Weight: {self.user_data['ideal_weight']}
- Activity Level: {self.user_data['activity_level']}

GOALS:
- Primary Goal: {self.user_data['goal']}
- CRITICAL: Muscle preservation is paramount. Calculate protein targets to maintain lean muscle mass.
- Calculate optimal daily calories to reach their ideal weight healthily

DIETARY REQUIREMENTS:
- Diet Type: {self.user_data['dietary_type']}
- Allergies: {self.user_data['allergies'] or 'None'}
- Foods to Avoid: {self.user_data['dislikes'] or 'None'}
- Cuisine Preferences: {self.user_data['preferences'] or 'Varied'}

PRACTICAL CONSTRAINTS:
- Weekly Budget: {self.user_data['budget']}
- Cooking Skill: {self.user_data['cooking_skill']}
- Available Prep Time: {self.user_data['prep_time']} minutes per day
- Meals Per Day: {self.user_data['meals_per_day']}
- Plan Duration: {self.user_data['plan_duration']} days
- Meal Prep Style: {self.user_data['meal_prep_style']}

Please create a comprehensive nutrition plan that includes:

1. **NUTRITIONAL ANALYSIS**
   - Calculate optimal daily calories based on their current weight, ideal weight, and activity level
   - Recommended macro split (protein/carbs/fats in grams and percentages)
   - Prioritise protein to preserve muscle mass (minimum 1.6-2.2g per kg of bodyweight)
   - Clear explanation of the nutritional strategy and why it works for their goals
   - Context about their journey and what to expect

2. **{self.user_data['plan_duration']}-DAY MEAL PLAN**
   - Complete meal plan for {self.user_data['plan_duration']} days
   - Format each day clearly with "DAY 1:", "DAY 2:", etc. as headers
   - Each day should include all meals (breakfast, lunch, dinner, snacks as needed)
   - Include portion sizes and estimated calories/macros per meal
   - Keep recipes within their cooking skill level and time constraints
   - Consider budget constraints
   - Use British spelling and terminology

3. **RECIPES**
   - Detailed recipes for each unique meal mentioned in the meal plan
   - Clearly label each recipe with its name as a header (use ** for bold)
   - Ingredients with quantities (use metric where possible)
   - Step-by-step cooking instructions
   - Prep time and cook time
   - Nutritional information (calories, protein, carbs, fats)
   - Use British spelling (e.g., courgette not zucchini, aubergine not eggplant)

4. **SHOPPING LIST**
   - Organised by category (produce, proteins, dairy, pantry, etc.)
   - Quantities needed for the full {self.user_data['plan_duration']}-day plan
   - Estimated cost breakdown to stay within {self.user_data['budget']} budget
   - Money-saving tips for staying within budget
   - Use UK terminology and £ for prices

5. **MEAL PREP GUIDE**
   - {self.user_data['meal_prep_style'].capitalize()} meal prep strategy
   - What to prep in advance to save time during the week
   - Storage instructions and how long meals keep
   - Reheating guidelines for best results
   - Time-saving tips for efficient meal preparation
   - Batch cooking suggestions

6. **ADDITIONAL TIPS & ADVICE**
   - Hydration recommendations for optimal performance and recovery
   - Supplement suggestions if appropriate for their goals (be specific and explain why)
   - Tips for staying on track when eating out or socialising
   - How to adjust portions if feeling too hungry or too full
   - Signs of progress to look for beyond the scales
   - Encouragement and motivation for staying consistent
   - What to do if they have a "bad" day

Make this plan practical, achievable, and tailored specifically to {self.user_data['name']}'s needs. Use a warm, encouraging, and supportive tone throughout - this is a premium service and should feel personalised and caring. Write as if you're speaking directly to them, not about them. Use British English spelling throughout."""

        return prompt

    def save_plan(self, plan):
        """Save the nutrition plan to a text file with unique timestamp"""
        if not plan:
            return

        # Add timestamp to make each file unique
        filename = f"nutrition_plan_{self.user_data['name'].replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        filepath = os.path.join(os.getcwd(), filename)

        # Save plan with user data
        with open(filepath, 'w') as f:
            f.write("=" * 80 + "\n")
            f.write("PERSONAL NUTRITION PLAN\n")
            f.write("=" * 80 + "\n\n")
            f.write(f"Generated: {datetime.now().strftime('%d %B %Y at %I:%M %p')}\n")
            f.write(f"Client: {self.user_data['name']}\n\n")
            f.write(plan)

        print(f"✅ Text plan saved to: {filename}")
        return filepath

    def generate_pdf(self, plan):
        """Generate a PDF version of the nutrition plan with unique timestamp"""
        if not plan:
            return None

        try:
            # Add timestamp to make each file unique
            pdf_filename = f"nutrition_plan_{self.user_data['name'].replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            pdf_filepath = os.path.join(os.getcwd(), pdf_filename)

            print("📄 Generating PDF...")
            create_nutrition_plan_pdf(plan, self.user_data, pdf_filepath)
            print(f"✅ PDF saved to: {pdf_filename}")

            return pdf_filepath

        except Exception as e:
            print(f"⚠️  PDF generation failed: {e}")
            print("   (Text version is still available)")
            return None

    def run(self):
        """Main execution flow"""
        try:
            self.setup_api()
            self.collect_user_info()
            plan = self.generate_nutrition_plan()

            if plan:
                text_filepath = self.save_plan(plan)

                # Ask about PDF generation
                print("\n" + "=" * 60)
                generate_pdf = input("Would you like a PDF version? (y/n): ").strip().lower()

                pdf_filepath = None
                if generate_pdf in ['y', 'yes']:
                    pdf_filepath = self.generate_pdf(plan)

                print("\n" + "=" * 60)
                print("✨ YOUR NUTRITION PLAN IS READY!")
                print("=" * 60)
                print(f"\n📄 Text version: {text_filepath}")
                if pdf_filepath:
                    print(f"📄 PDF version: {pdf_filepath}")
                print("\nNext steps:")
                print("  • Review your personalised plan")
                print("  • Use the shopping list for your grocery trip")
                print("  • Follow the meal plan")
                print("  • Track your progress!")
                print("\n💪 Let's achieve those goals!\n")

        except KeyboardInterrupt:
            print("\n\n👋 Plan generation cancelled. See you next time!")
        except Exception as e:
            print(f"\n❌ Error: {e}")


if __name__ == "__main__":
    generator = NutritionPlanGenerator()
    generator.run()
