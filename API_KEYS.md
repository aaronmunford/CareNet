# API Keys & Cost Guide

This document explains how API keys work in CareNet and what costs you can expect.

## 🔑 How API Keys Work

### Architecture Overview

```
End Users → Your App (Frontend) → Your Backend → Third-party APIs
                                   ↑
                               (Your API Keys)
```

**Important:**
- **You (the app owner)** provide API keys as environment variables
- **End users** never see or need API keys
- **You pay** for API usage based on your users' activity

This is the standard model for production apps - you pay to run the service, your users use it for free.

---

## 📊 Features & API Requirements

| Feature | API Required | Fallback Behavior | Cost Impact |
|---------|--------------|-------------------|-------------|
| Hospital Search | ❌ None | Always works (JSON data) | Free |
| Interactive Map | ❌ None | Always works (Leaflet) | Free |
| Insurance Card Scan | Dedalus API | Demo mode with sample data | ~$0.01 per scan |
| Voice Triage | Dedalus API | Demo mode with keyword matching | ~$0.01 per triage |
| AI Booking Agent | ElevenLabs | Feature disabled, direct call option shown | ~$0.10-0.30 per call |
| Payments | Flowglad | N/A | Transaction fees |

---

## 💰 Cost Breakdown

### Option 1: Core Features Only (Free)
No API keys needed. Users can:
- ✅ Search hospitals by location
- ✅ Filter by facility type
- ✅ View cost estimates
- ✅ Get directions
- ✅ Call hospitals directly

**Monthly cost: $0**

---

### Option 2: With AI Features (Recommended)

#### Dedalus API (Required for card scanning & voice triage)
- **Cost:** ~$0.01 per API call
- **Monthly estimate for 1,000 users:**
  - Card scans: 1,000 × $0.01 = $10
  - Voice triage: 1,000 × $0.01 = $10
  - **Total: ~$20/month**

**Setup:**
1. Sign up at [dedaluslabs.ai](https://dedaluslabs.ai)
2. Get API key
3. Add to Vercel: `DEDALUS_API_KEY=your-key`

---

### Option 3: Full Feature Set

Add ElevenLabs for AI booking:

#### ElevenLabs API (Optional - for AI booking agent)
- **Cost:** ~$0.10-0.30 per call
- **Monthly estimate for 1,000 users:**
  - Assuming 30% use booking: 300 × $0.20 = $60
  - **Total: ~$60/month**

**Setup:**
1. Sign up at [elevenlabs.io](https://elevenlabs.io)
2. Create a Conversational AI agent
3. Get credentials
4. Add to Vercel:
   ```
   ELEVENLABS_API_KEY=your-key
   ELEVENLABS_AGENT_ID=your-agent-id
   ELEVENLABS_AGENT_PHONE_NUMBER_ID=your-phone-id
   ```

**Combined total with all features: ~$80/month for 1,000 active users**

---

## 🎯 Recommended Setup for Different Use Cases

### Personal Project / Portfolio
```env
# No API keys needed
# Use demo mode for AI features
```
**Cost: $0/month**

### Small Community / Beta (< 100 users)
```env
DEDALUS_API_KEY=your-key
# Skip ElevenLabs, users call directly
```
**Cost: ~$2/month**

### Production Launch (< 1,000 users)
```env
DEDALUS_API_KEY=your-key
ELEVENLABS_API_KEY=your-key
ELEVENLABS_AGENT_ID=your-agent-id
ELEVENLABS_AGENT_PHONE_NUMBER_ID=your-phone-id
```
**Cost: ~$80/month**

---

## 🚀 Getting Started (Step by Step)

### 1. Deploy Without API Keys First

```bash
# Deploy to Vercel with no API keys
vercel

# Your app works with:
# - Hospital search ✅
# - Map view ✅
# - Demo card scanning ✅
# - Demo voice triage ✅
# - Direct calling ✅
```

### 2. Add Dedalus When Ready

When you're ready for real AI features:

1. Go to [dedaluslabs.ai](https://dedaluslabs.ai) and sign up
2. Get your API key
3. In Vercel Dashboard → Settings → Environment Variables
4. Add: `DEDALUS_API_KEY=your-actual-key`
5. Redeploy

Now card scanning and voice triage use real AI!

### 3. Add ElevenLabs When Scaling

When you want AI booking:

1. Go to [elevenlabs.io](https://elevenlabs.io) and sign up
2. Create a Conversational AI agent
3. Configure it for medical appointment scheduling
4. Get your credentials
5. Add to Vercel environment variables
6. Redeploy

---

## 💡 Cost Optimization Tips

1. **Start with demo mode** - Test your app without API costs
2. **Add Dedalus first** - Core AI features, low cost
3. **Add ElevenLabs later** - When you have real users who want booking
4. **Monitor usage** - Most APIs have dashboards showing usage/costs
5. **Set spending limits** - Both Dedalus and ElevenLabs allow budget caps
6. **Cache results** - Consider caching common queries to reduce API calls

---

## 🔒 Security Best Practices

✅ **DO:**
- Store API keys in Vercel environment variables
- Use `.env.local` for local development (never commit this)
- Rotate keys if exposed
- Monitor API usage for unusual patterns

❌ **DON'T:**
- Hardcode API keys in code
- Commit API keys to Git
- Share API keys publicly
- Let users provide their own API keys (bad UX)

---

## ❓ FAQ

**Q: Do my users need API keys?**
A: No! You provide the keys, they use the app for free.

**Q: What if I don't add any API keys?**
A: The app still works! Card scanning and triage use demo mode, and users can call hospitals directly.

**Q: How do I monitor costs?**
A: Check your Dedalus and ElevenLabs dashboards for usage stats.

**Q: Can I set a spending limit?**
A: Yes, both Dedalus and ElevenLabs allow you to set monthly budget caps.

**Q: What happens if I hit my limit?**
A: The app gracefully falls back to demo mode for AI features.

---

## 📞 Support

- **Dedalus API:** Check their documentation at dedaluslabs.ai
- **ElevenLabs API:** Visit elevenlabs.io/docs
- **CareNet Issues:** Open an issue on GitHub

---

**Summary:** Start free with demo mode, add Dedalus (~$20/mo for AI), add ElevenLabs (~$60/mo for booking) when you scale.
