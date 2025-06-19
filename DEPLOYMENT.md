# 🚀 Deployment Guide

This guide covers deploying Algorhythm to production environments.

## 📋 Prerequisites

- Supabase project set up
- Netlify account (for frontend)
- n8n instance (optional, for automation)
- Domain name (optional)

## 🔧 Environment Setup

### 1. Supabase Configuration

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the database migrations from `supabase/migrations/`
3. Deploy the edge functions from `supabase/functions/`
4. Note your project URL and anon key

### 2. Environment Variables

Create a `.env` file with your production values:

```env
# Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional (for n8n integration)
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
VITE_N8N_API_KEY=your-secure-api-key
```

## 🌐 Frontend Deployment (Netlify)

### Automatic Deployment

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Deploy!

### Manual Deployment

```bash
# Build the project
npm run build

# Deploy to Netlify (install netlify-cli first)
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

## 🗄️ Database Deployment (Supabase)

### 1. Run Migrations

In your Supabase dashboard SQL editor, run each migration file in order:

```sql
-- Run files from supabase/migrations/ in chronological order
-- Start with: 20250617184659_white_oasis.sql
-- End with: 20250617205250_sunny_sea.sql
```

### 2. Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Deploy functions
supabase functions deploy upload-solution
supabase functions deploy trigger-n8n
```

### 3. Configure RLS Policies

Ensure Row Level Security is enabled and policies are active:

- Public can insert questions
- Users can read their own questions
- Service role has full access
- Authenticated users can delete questions

## 🤖 n8n Automation (Optional)

### 1. Set Up n8n Instance

Deploy n8n using:
- [n8n Cloud](https://n8n.io/cloud/)
- Self-hosted Docker
- Railway/Heroku deployment

### 2. Import Workflow

1. Create a new workflow in n8n
2. Import the workflow configuration (contact for workflow file)
3. Configure credentials:
   - Supabase URL and service key
   - AI service credentials (Gemini/OpenAI)
   - Upload endpoint API key

### 3. Test Integration

1. Submit a test question in the app
2. Check n8n execution logs
3. Verify question status updates
4. Confirm HTML solution generation

## 🔒 Security Configuration

### 1. Supabase Security

- Enable RLS on all tables
- Configure proper policies
- Use service role key only in n8n
- Rotate keys regularly

### 2. API Security

- Use strong API keys for n8n
- Enable CORS only for your domain
- Monitor API usage
- Set up rate limiting

### 3. Frontend Security

- Use HTTPS only
- Configure CSP headers
- Validate all user inputs
- Sanitize HTML content

## 📊 Monitoring & Analytics

### 1. Error Tracking

Set up error monitoring:
- Sentry for frontend errors
- Supabase logs for backend
- n8n execution logs

### 2. Performance Monitoring

Monitor:
- Page load times
- Database query performance
- n8n workflow execution time
- User engagement metrics

### 3. Uptime Monitoring

Set up monitoring for:
- Frontend availability
- Supabase API status
- n8n workflow health
- Database connectivity

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run lint
      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=dist
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check TypeScript errors
   - Verify environment variables
   - Update dependencies

2. **Database Connection Issues**
   - Verify Supabase URL and keys
   - Check RLS policies
   - Confirm migrations ran successfully

3. **n8n Integration Problems**
   - Test webhook connectivity
   - Verify API keys
   - Check workflow configuration

### Debug Steps

1. Check browser console for errors
2. Verify network requests in DevTools
3. Check Supabase logs
4. Review n8n execution history
5. Test with minimal data

## 📞 Support

If you encounter issues:
- Check the troubleshooting section
- Review Supabase documentation
- Check n8n community forums
- Create a GitHub issue

---

**Happy Deploying! 🎉**