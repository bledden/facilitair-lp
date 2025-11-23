# Improved Survey Questions for Beta Users

Based on analyzing the Facilitair codebase, here are enhanced survey questions that will provide more actionable insights:

---

## Current Questions (Keep These)

1. **How do you plan to use FACILITAIR?** (Required, Textarea)
2. **Anticipated Usage** (Required, Dropdown)
3. **How did you find out about FACILITAIR?** (Required, Dropdown)

---

## NEW QUESTIONS TO ADD

### 4. Which AI Services Do You Currently Use? (Optional, Multi-select)

This helps identify BYOK opportunities and integration priorities.

**Options:**
- [ ] OpenAI (GPT-4, GPT-4o, etc.)
- [ ] Anthropic (Claude)
- [ ] OpenRouter (access to 343+ models)
- [ ] Google AI (Gemini)
- [ ] Local models (Ollama, LMStudio, etc.)
- [ ] Development tools (Daytona, Vercel, etc.)
- [ ] Data tools (Morph, Unsiloed, Metorial)
- [ ] Other: _______________
- [ ] None yet

**Why this matters:**
- 60% of users will want Bring Your Own Key (BYOK) for their existing OpenRouter account
- Identifies which of the 7 integrated YC Agent Jam sponsors users already use
- Helps prioritize which API integrations to expose first

---

### 5. What Type of Tasks Will You Automate? (Optional, Multi-select)

Maps directly to Facilitair's V13 routing model capabilities.

**Options:**
- [ ] Code Generation (creating new features/components)
- [ ] Debugging (finding and fixing bugs)
- [ ] Testing (writing unit/integration tests)
- [ ] Documentation (READMEs, API docs, comments)
- [ ] Refactoring (improving existing code)
- [ ] Data Analysis (processing/analyzing datasets)
- [ ] Design (architecture planning, system design)
- [ ] Optimization (performance improvements)
- [ ] Other: _______________

**Why this matters:**
- These align with the 8 capability types in the V13 model
- Helps prioritize which capabilities to improve first
- Identifies if users need capabilities we haven't trained for yet

---

### 6. Which Domains Do You Work In? (Optional, Multi-select)

Maps to the 19 domain types the V13 model can route to.

**Options:**
- [ ] Frontend Development (React, Vue, etc.)
- [ ] Backend Development (APIs, servers)
- [ ] Machine Learning / AI
- [ ] Data Engineering / Processing
- [ ] DevOps / Infrastructure
- [ ] Mobile Development
- [ ] Database Design
- [ ] Cloud / Serverless
- [ ] Security
- [ ] UI/UX Design
- [ ] Testing / QA
- [ ] Other: _______________

**Why this matters:**
- V13 model routes to 19 different domains
- Helps identify if certain domains need better routing accuracy
- Shows which domains are most popular for beta priority

---

### 7. Would You Bring Your Own API Keys? (Optional)

**Options:**
- Yes, I have OpenRouter credits and want to use them
- Yes, I have OpenAI/Anthropic credits and want to use them
- Maybe, depending on pricing
- No, I prefer Facilitair to handle it
- I don't understand what this means

**Follow-up if "Yes":**
- Which services do you have API keys for? (Multi-select)
  - [ ] OpenRouter
  - [ ] OpenAI
  - [ ] Anthropic
  - [ ] Google AI
  - [ ] Other: _______________

**Why this matters:**
- BYOK feature is already implemented (`backend/services/llm_service_with_byok.py`)
- Need to know if beta users want this exposed in the UI
- Helps set pricing strategy (pay for what you use vs. Facilitair markup)

---

### 8. What's Your Biggest Pain Point with Current AI Tools? (Optional, Textarea)

**Placeholder:** "e.g., too expensive, unreliable results, hard to integrate, can't chain tasks together..."

**Why this matters:**
- Identifies what Facilitair should emphasize in messaging
- Surfaces problems users expect Facilitair to solve
- Helps prioritize feature development

---

### 9. What Would Make You Choose Facilitair Over Direct API Calls? (Optional, Multi-select)

**Options:**
- [ ] Automatic model selection (don't have to choose GPT-4 vs Claude)
- [ ] Cost optimization (automatically pick cheapest model that works)
- [ ] Multi-step orchestration (breaking complex tasks into subtasks)
- [ ] Better results through routing (right tool for the job)
- [ ] Unified API (one interface for 343+ models)
- [ ] Task persistence and history
- [ ] Built-in retry/fallback logic
- [ ] Don't know yet
- [ ] Other: _______________

**Why this matters:**
- These are all features Facilitair actually has
- Helps understand which features to highlight in beta onboarding
- Identifies value props that resonate most

---

### 10. Your Background (Keep, but make it more specific)

**Updated label:** "What's your role?" (Optional, Dropdown)

**Options:**
- Software Engineer / Developer
- Data Scientist / ML Engineer
- Product Manager
- Engineering Manager / CTO
- DevOps / Platform Engineer
- Designer
- Researcher / Academic
- Student
- Founder / Entrepreneur
- Other: _______________

**Why this matters:**
- More structured than freeform text
- Helps segment users for tailored onboarding
- Identifies if we're reaching the right audience (devs vs. PMs vs. founders)

---

## UPDATED SURVEY STRUCTURE

### Section 1: Usage Intent (Required)
1. How do you plan to use FACILITAIR? (Textarea)
2. Anticipated usage frequency (Dropdown)
3. Type of tasks you'll automate (Multi-select) **NEW**
4. Domains you work in (Multi-select) **NEW**

### Section 2: Context (Required for #5, Rest Optional)
5. How did you find FACILITAIR? (Dropdown)
6. Your role (Dropdown) **UPDATED**
7. Which AI services do you currently use? (Multi-select) **NEW**

### Section 3: Product Fit (Optional)
8. Biggest pain point with current AI tools (Textarea) **NEW**
9. What would make you choose Facilitair? (Multi-select) **NEW**
10. Would you bring your own API keys? (Radio + Follow-up) **NEW**

### Section 4: Open Feedback (Optional)
11. Anything else? (Textarea)

---

## WHY THESE CHANGES MATTER

### For Product Development:
- **Questions 4 & 7**: Identifies BYOK demand (feature is built, just needs UI)
- **Questions 5 & 6**: Maps to actual V13 model capabilities/domains
- **Question 8**: Reveals competitive positioning opportunities
- **Question 9**: Tests messaging and value prop resonance

### For Go-to-Market:
- **Question 10**: Enables role-based segmentation
- **Questions 8 & 9**: Provides copy for landing page and marketing
- **Question 4**: Shows which ecosystems to target

### For Pricing:
- **Question 2**: Usage frequency = pricing tier fit
- **Question 7**: BYOK users might need different pricing
- **Question 9**: Shows if cost optimization resonates

---

## IMPLEMENTATION NOTES

1. **Survey length**: 11 questions (up from 5)
   - But most are multi-select (faster than typing)
   - 3 required, 8 optional
   - Still ~3-5 minutes

2. **Data value**: Every question maps to an actual product decision or codebase capability

3. **Progressive disclosure**: Could split into 2 pages:
   - Page 1: Basic info (Q1-7)
   - Page 2: Product fit (Q8-11)

4. **Analysis ready**: Questions designed for easy segmentation and analysis
