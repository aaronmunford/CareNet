# CareNet Deployment Guide

This guide covers deploying CareNet to production on Vercel.

## 📋 Quick Start

**You can deploy CareNet immediately without any API keys!** The app works with demo mode for AI features. Add API keys later when you're ready for real AI capabilities.

📚 **[Read the complete API Keys & Cost Guide →](./API_KEYS.md)** for detailed pricing and setup.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **API Keys** (Optional - see below):
   - Dedalus API Key (for real card scanning & triage) - ~$20/mo for 1,000 users
   - ElevenLabs API Key and Agent ID (for AI booking agent) - ~$60/mo for 1,000 users

## Step 1: Prepare Your Repository

Make sure your code is pushed to GitHub:

```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

## Step 2: Deploy Backend to Vercel

The FastAPI backend can be deployed alongside the frontend.

1. Navigate to your backend directory:
```bash
cd backend
```

2. Create a `vercel.json` in the backend directory:
```json
{
  "builds": [
    {
      "src": "main.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "main.py"
    }
  ]
}
```

3. Create a `requirements.txt` if not already present:
```bash
pip freeze > requirements.txt
```

## Step 3: Deploy Frontend to Vercel

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Navigate to frontend directory:
```bash
cd frontend
```

3. Deploy:
```bash
vercel
```

4. Follow the prompts to link your project

### Option 2: Deploy via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Select the `frontend` directory as the root
4. Configure environment variables (see below)
5. Click "Deploy"

## Step 4: Configure Environment Variables (Optional)

**The app works without any API keys!** You can deploy first and add keys later.

### Option 1: Deploy Without API Keys (Free)

No configuration needed! Your app will:
- ✅ Show all hospitals and facilities
- ✅ Display cost estimates and insurance info
- ✅ Provide maps and directions
- ✅ Use demo mode for card scanning (shows sample data)
- ✅ Use demo mode for voice triage (keyword-based)
- ✅ Allow direct phone calls to hospitals

**Monthly cost: $0**

### Option 2: Add Real AI Features

In your Vercel project settings → Environment Variables, add:

#### For Real Card Scanning & Voice Triage (~$20/mo for 1k users)

```
DEDALUS_API_KEY=your-dedalus-api-key-here
```

Get your key at [dedaluslabs.ai](https://dedaluslabs.ai)

#### For AI Booking Agent (~$60/mo for 1k users)

```
ELEVENLABS_API_KEY=your-elevenlabs-api-key-here
ELEVENLABS_AGENT_ID=your-agent-id-here
ELEVENLABS_AGENT_PHONE_NUMBER_ID=your-phone-number-id-here
```

**How to get ElevenLabs credentials:**

1. Sign up at [elevenlabs.io](https://elevenlabs.io)
2. Navigate to "Conversational AI" in the dashboard
3. Create a new AI agent for appointment booking
4. Configure the agent with appropriate prompts for medical appointment scheduling
5. Get your API key from Settings → API Keys
6. Get your Agent ID and Phone Number ID from the agent settings

**Recommendation:** Start without API keys (free), add Dedalus when you have users, add ElevenLabs when you need booking automation.

### Optional Variables

```
# Override the backend API URL if hosting separately
NEXT_PUBLIC_API_URL=/api

# Enable demo mode for testing (no real calls made)
ELEVENLABS_DEMO_MODE=false

# Override phone number for testing
# ELEVENLABS_CALL_TO_NUMBER_OVERRIDE=+15551234567
```

## Step 5: Configure Custom Domain (Optional)

1. In Vercel Dashboard, go to Settings > Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Wait for SSL certificate to be issued

## Step 6: Configure Backend API Proxy

The frontend is configured to proxy API requests to the backend. Ensure your `next.config.ts` has the following:

```typescript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: process.env.BACKEND_URL || 'http://localhost:8000/:path*',
    },
  ];
}
```

For production, you may want to deploy the backend separately and set `BACKEND_URL` to your backend's URL.

## Step 7: Verify Deployment

After deployment:

1. Visit your deployment URL
2. Test insurance card scanning
3. Test voice triage
4. Test hospital search and filtering
5. Test appointment booking (use demo mode if needed)
6. Test payment flow

## Troubleshooting

### Build Errors

If you encounter build errors:

1. Check that all environment variables are set
2. Verify `package.json` dependencies are up to date
3. Check build logs in Vercel Dashboard

### API Connection Issues

If the frontend can't connect to the backend:

1. Verify `NEXT_PUBLIC_API_URL` is set correctly
2. Check CORS settings in `backend/main.py`
3. Ensure backend is deployed and accessible

### Environment Variable Issues

If features aren't working:

1. Verify all required API keys are set in Vercel
2. Check that variable names match exactly (case-sensitive)
3. Redeploy after adding/changing variables

## Production Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Backend API accessible
- [ ] Insurance card scanning tested
- [ ] Voice triage tested
- [ ] Hospital search tested
- [ ] Appointment booking tested
- [ ] Payment processing tested
- [ ] Error logging configured
- [ ] Analytics configured (optional)

## Monitoring

Consider setting up:

1. **Vercel Analytics**: Built-in performance monitoring
2. **Error Tracking**: Sentry or similar service
3. **API Monitoring**: Track backend performance
4. **User Analytics**: Google Analytics or similar

## Scaling Considerations

As your user base grows:

1. **Database**: Migrate from JSON to PostgreSQL or similar
2. **Caching**: Add Redis for frequently accessed data
3. **CDN**: Leverage Vercel's edge network
4. **Backend**: Consider containerizing and deploying to AWS/GCP

## Support

For issues:

1. Check Vercel deployment logs
2. Review browser console for errors
3. Verify all API keys are valid
4. Contact support for specific service issues

---

**CareNet is now live! 🚀**
