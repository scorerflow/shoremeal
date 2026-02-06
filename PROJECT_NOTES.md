# Nutrition Plan Generator - Quick Reference

**Status:** MVP Complete
**Version:** V4 (Final Working)
**Date:** 5 Feb 2026

## What We Built
CLI tool that generates personalized nutrition plans using Claude API.
- Input: Client info (age, weight, goals, diet, budget)
- Output: 7-day meal plan with recipes, shopping list, tips (text + PDF)

## Key Requirements
✅ Gender M/F only
✅ Removed calorie/protein questions (auto-calculated)
✅ Added "ideal weight" question
✅ Goal: "Fat loss (maintain muscle)" - muscle preservation focus
✅ UK format (British spellings, £)
✅ Verbose encouraging content (meal prep, tips, motivation)
✅ Unique timestamp filenames

## Costs (7-day plan)
- API cost: £0.16 per plan
- Generation time: 30-60 seconds
- Token usage: ~11,000 tokens

## SaaS Pricing (Planned)
- Starter: £29/month (10 plans) = 94% margin
- Professional: £79/month (50 plans) = 90% margin  
- Studio: £199/month (unlimited) = 84% margin
- Year 1 target: 200 users, £13k MRR

## Known Issues
1. 30-day plans truncate (16k token limit)
2. Real-world need: 4-week plans (to match training programmes)
3. PDF layout needs improvement

## Solutions
- 4-week plans: Generate 4× weekly (£0.64 total)
- Cost optimization: Template aftercare content (save 20%)
- When build SaaS: Increase max_tokens or use chunks

## Quick Start
```bash
pip3 install -r requirements.txt
export ANTHROPIC_API_KEY='your-key'
python3 nutrition_plan_generator.py
```

## Next Steps
1. Test with real clients
2. Fix PDF layout
3. Implement template optimization
4. Plan 4-week solution
5. Build web MVP

## Contact
David - bigwave1x@gmail.com
Golden Ticket Project → SaaS for PTs
