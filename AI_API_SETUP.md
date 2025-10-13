# 🤖 AI API Setup Guide

## Free LLM APIs You Can Use

### 1. **Groq API** (Recommended - Fastest & Free)
- **Website**: https://console.groq.com/
- **Free Tier**: 14,400 requests/day
- **Speed**: Very fast (sub-second responses)
- **Models**: Llama-2-70b, Mixtral-8x7b

**Setup Steps:**
1. Go to https://console.groq.com/
2. Sign up for free account
3. Get your API key
4. Replace `gsk_your_groq_api_key_here` in the code with your actual key

### 2. **Hugging Face Inference API** (Free)
- **Website**: https://huggingface.co/inference-api
- **Free Tier**: 1,000 requests/month
- **Speed**: Slower but reliable
- **Models**: Various open-source models

**Setup Steps:**
1. Go to https://huggingface.co/settings/tokens
2. Create a free token
3. Replace `hf_your_token_here` in the code

### 3. **OpenAI API** (Paid but Cheap)
- **Website**: https://platform.openai.com/
- **Cost**: $0.002 per 1K tokens
- **Speed**: Very fast
- **Models**: GPT-3.5-turbo, GPT-4

**Setup Steps:**
1. Go to https://platform.openai.com/api-keys
2. Create API key
3. Add $5 credit (lasts months for this app)
4. Replace `sk-your-openai-key-here` in the code

## 🚀 How to Enable Real AI

### Option 1: Quick Setup with Groq (Recommended)
1. Get free Groq API key
2. In `src/views/CalculatorView.vue`, find line 1518:
   ```javascript
   'Authorization': 'Bearer gsk_your_groq_api_key_here',
   ```
3. Replace with your actual key:
   ```javascript
   'Authorization': 'Bearer gsk_1234567890abcdef...',
   ```

### Option 2: Enable All APIs
1. Get API keys for all services
2. Replace all placeholder keys in the code
3. The system will automatically try each API in order

## 🎯 Current Status

**✅ Working Now**: Smart rule-based system that handles:
- Benefits questions: "What are the benefits of this recipe?"
- Nutrition questions: "Is this recipe healthy?"
- Cooking questions: "How do I cook this?"
- Ingredient questions: "What's in this recipe?"
- Modification questions: "Can I change this recipe?"
- Difficulty questions: "Is this recipe easy?"
- Taste questions: "How does this taste?"

**🔄 With API Keys**: Real AI responses for ANY question!

## 💡 Test Questions to Try

1. **Benefits**: "What are the benefits of this recipe?"
2. **Nutrition**: "Is this recipe healthy?"
3. **Cooking**: "How do I prepare this?"
4. **Ingredients**: "What ingredients are in this?"
5. **Modifications**: "Can I make this vegetarian?"
6. **Difficulty**: "Is this recipe hard to make?"
7. **Taste**: "How does this recipe taste?"

## 🔧 Troubleshooting

**If APIs don't work:**
- Check your API key is correct
- Ensure you have credits/quota remaining
- The system will automatically fall back to the smart rule-based system

**Current fallback system is already very intelligent and handles most questions!**
