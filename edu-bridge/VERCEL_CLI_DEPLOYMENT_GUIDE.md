# EduBridge+ Vercel CLI Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying EduBridge+ to Vercel using the Vercel CLI.

## Prerequisites
- Node.js 18+ installed locally
- Vercel account (free tier is sufficient)
- Git repository with EduBridge+ code
- Basic command line knowledge

## Step 1: Install Vercel CLI

### 1.1 Install globally via npm
```bash
npm install -g vercel
```

### 1.2 Verify installation
```bash
vercel --version
# Expected output: Vercel CLI X.X.X
```

## Step 2: Login to Vercel

### 2.1 Authenticate your account
```bash
vercel login
```

### 2.2 Follow the authentication flow
- The command will open your default browser
- Log in to your Vercel account (GitHub, GitLab, or email)
- Grant necessary permissions
- Return to terminal when authentication is complete

### 2.3 Verify login
```bash
vercel whoami
# Expected output: your-email@example.com
```

## Step 3: Navigate to Your Project Directory

### 3.1 Go to the Next.js app directory
```bash
# Navigate to your project root
cd /path/to/your/project

# Navigate to the Next.js app directory (if applicable)
cd edu-bridge  # or your app directory name
```

### 3.2 Verify you're in the correct directory
```bash
ls -la
# Should show package.json, src/, public/, etc.
```

## Step 4: Link Project to Vercel

### 4.1 Choose your linking strategy

**Option A: Link to New Project (First-time deployment)**
```bash
vercel link --yes
```

**Option B: Link to Existing Project (Update existing deployment)**
```bash
# Remove any existing .vercel directory first
rm -rf .vercel

# Link to existing project
vercel link
```
- Select "yes" to set up the directory
- Choose your scope (e.g., "Marsya Damia's projects")
- When asked "Found project", select "no" to link to different existing project
- Choose your existing project name (e.g., "edu-bridge-v1-06-fixed")

### 4.2 What happens during linking:
- Vercel detects your project type (Next.js)
- Creates a `.vercel` directory in your project
- Prompts for project scope (if you have multiple teams)
- Creates a new project or links to existing one
- Sets up automatic deployment configuration

### 4.3 Verify linking
```bash
cat .vercel/project.json
# Should show your project ID and configuration
```

### 4.4 Check available projects
```bash
vercel projects
# Lists all your Vercel projects with their names and URLs
```

## Step 5: Initial Deployment

### 5.1 Deploy to production
```bash
vercel --prod --yes
```

### 5.2 Deployment process:
1. **Upload**: Vercel uploads your project files
2. **Build**: Runs `npm install` and `npm run build`
3. **Deploy**: Deploys to production environment
4. **URL**: Provides deployment URL

### 5.3 Expected output:
```
Vercel CLI X.X.X
Retrieving project…
Deploying your-project-name
Uploading [====================] (100%)
Inspect: https://vercel.com/your-username/your-project/deployment-id
Production: https://your-project-name-random-hash.vercel.app
Queued
Building
Completing
```

## Step 6: Configure Firebase Environment Variables (Critical for EduBridge+)

### 6.1 EduBridge+ Firebase Variables Required
EduBridge+ requires these Firebase environment variables to function:

```bash
# Firebase Configuration (REQUIRED for EduBridge+)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCNlc-l1Mrfusljyw_9w0KUWpYkyKihHFc
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=edubridge-e5cba.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=edubridge-e5cba
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=edubridge-e5cba.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=936901717954
NEXT_PUBLIC_FIREBASE_APP_ID=1:936901717954:web:7db68d1923f1874040705b
```

### 6.2 Add Firebase Variables via CLI
```bash
# Method 1: Using echo (recommended)
echo "AIzaSyCNlc-l1Mrfusljyw_9w0KUWpYkyKihHFc" | vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
echo "edubridge-e5cba.firebaseapp.com" | vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production
echo "edubridge-e5cba" | vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production
echo "edubridge-e5cba.firebasestorage.app" | vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production
echo "936901717954" | vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production
echo "1:936901717954:web:7db68d1923f1874040705b" | vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production
```

### 6.3 Alternative: Add via Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com)
2. Navigate to your project
3. Go to **Settings** → **Environment Variables**
4. Add all Firebase variables with **Production** environment
5. Redeploy after adding variables

### 6.4 Verify environment variables
```bash
vercel env ls production
```

⚠️ **Important**: EduBridge+ has fallback values in `src/lib/firebase.ts`, but production environment variables are required for proper Firebase functionality.

## Step 7: Redeploy with Environment Variables

### 7.1 Redeploy to apply changes
```bash
vercel --prod --yes
```

### 7.2 Monitor deployment
```bash
# Watch deployment progress
vercel logs your-project-name.vercel.app
```

## Step 8: Verify Deployment

### 8.1 Visit your deployed app
- Open the provided URL in your browser
- Test all features and functionality
- Check for any console errors

### 8.2 Check deployment status
```bash
vercel ls
# Shows all deployments with status
```

## Step 9: Deployment Management

### 9.1 View deployment history
```bash
vercel ls
```

### 9.2 View deployment logs
```bash
vercel logs your-deployment-url.vercel.app
```

### 9.3 Rollback to previous deployment
```bash
vercel rollback your-deployment-url.vercel.app
```

### 9.4 Remove deployment
```bash
vercel remove your-deployment-url.vercel.app
```

## Step 10: Custom Domain (Optional)

### 10.1 Add custom domain
```bash
vercel domains add your-custom-domain.com
```

### 10.2 Verify domain configuration
```bash
vercel domains ls
```

## Step 11: Git-Based Deployment (Optional but Recommended)

### 11.1 Push your code to GitHub
```bash
git add .
git commit -m "Deployment ready"
git push origin main
```

### 11.2 Connect to GitHub via Vercel CLI
```bash
vercel git connect
```

### 11.3 Enable auto-deployment
- Go to Vercel dashboard
- Navigate to your project
- Go to Settings → Git
- Connect your GitHub repository
- Select the branch to deploy
- Enable auto-deployment on push

## Common Vercel CLI Commands

### Project Management
```bash
vercel ls                    # List all deployments
vercel whoami               # Show current user
vercel projects             # List all projects
vercel switch               # Switch between projects
```

### Environment Variables
```bash
vercel env ls               # List environment variables
vercel env rm VAR_NAME      # Remove environment variable
vercel env pull .env        # Pull environment variables to file
```

### Domain Management
```bash
vercel domains add          # Add custom domain
vercel domains ls           # List domains
vercel domains remove       # Remove domain
```

### Logs and Debugging
```bash
vercel logs                 # View logs for deployment
vercel inspect              # Inspect deployment details
vercel info                 # Show project information
```

### Advanced Options
```bash
vercel --local-config        # Use local configuration
vercel --debug              # Enable debug mode
vercel --force              # Force deployment
vercel --with-cache         # Use build cache
```

## EduBridge+-Specific Troubleshooting

### Issue 1: Firebase "auth/invalid-api-key" Error
**Symptoms:** Build fails with Firebase authentication error
**Solution:**
```bash
# Add Firebase environment variables (see Step 6)
echo "AIzaSyCNlc-l1Mrfusljyw_9w0KUWpYkyKihHFc" | vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
# Add all other Firebase variables...

# Redeploy after adding variables
vercel --prod --yes
```

### Issue 2: Build Fails with TypeScript Errors
**Symptoms:** TypeScript compilation fails during build
**Solution:**
```bash
# Check local build first
npm run build

# Fix TypeScript errors locally
# Common issues: Missing type definitions, incorrect imports

# Clear build cache and redeploy
rm -rf .next .vercel
vercel --prod --yes
```

### Issue 3: Firebase Connection Issues in Production
**Symptoms:** "Failed to get document because the client is offline" errors
**Solution:**
EduBridge+ includes Firebase v10.12.0 with Vercel optimizations. If issues persist:
```bash
# Verify Firebase environment variables are set
vercel env ls production

# Check browser console for "Firebase initialized successfully"
# The app should show this message on load
```

### Issue 4: Lecturer Dashboard Shows "Unknown Programme"
**Symptoms:** Lecturer dashboard displays incorrect programme information
**Solution:**
This is automatically fixed in the latest version. The dashboard includes auto-fix logic that updates lecturer profiles with correct programme names.

### Issue 5: Deploying to Wrong Project (Creating New URLs Instead of Updating)

**Symptoms:**
- Each deployment creates a new URL with random hash (e.g., `edu-bridge-abc123.vercel.app`)
- Want to update existing deployment (e.g., `edu-bridge-v1-06-fixed.vercel.app`)
- Multiple projects listed in `vercel projects`

**Solution:**
```bash
# 1. Check current project configuration
cat .vercel/project.json
# Shows which project you're currently linked to

# 2. List all available projects
vercel projects
# Shows all your projects with their URLs

# 3. Remove current configuration
rm -rf .vercel

# 4. Link to correct existing project
vercel link
# - Select "yes" to set up directory
# - Choose your scope
# - When asked "Found project", select "no"
# - Choose your existing project name (e.g., "edu-bridge-v1-06-fixed")

# 5. Deploy to correct project
vercel --prod --yes
```

**Example workflow for edu-bridge-v1-06-fixed:**
```bash
# From the edu-bridge directory (where package.json is located)
rm -rf .vercel
vercel link
# Answer: yes → Marsya Damia's projects → no → edu-bridge-v1-06-fixed
vercel --prod --yes
```

### Issue 6: Multiple .vercel Directories Causing Conflicts

**Symptoms:**
- "The provided path does not exist" errors
- Deployment works from parent directory but not subdirectory
- Conflicting project configurations

**Solution:**
```bash
# Check for multiple .vercel directories
find . -name ".vercel" -type d

# Remove all .vercel directories
find . -name ".vercel" -type d -exec rm -rf {} +

# Navigate to correct directory (where package.json is)
cd edu-bridge

# Relink to correct project
vercel link
# Choose your existing project

# Deploy
vercel --prod --yes
```

### Issue 7: General Vercel CLI Issues

#### "Command not found: vercel"
**Solution:**
```bash
npm install -g vercel
# Or use npx
npx vercel
```

#### Authentication errors
**Solution:**
```bash
vercel logout
vercel login
```

#### Build failures
**Solution:**
```bash
# Check local build first
npm run build

# Clear Vercel cache
rm -rf .vercel
vercel --prod --yes

# Check Node.js version
node --version
```

### Issue 8: Environment variables not working
**Solution:**
```bash
# Verify variables are set
vercel env ls

# Redeploy after adding variables
vercel --prod --yes
```

### Issue 9: Permission errors
**Solution:**
```bash
# Check file permissions
ls -la

# Use sudo if needed (not recommended)
sudo vercel --prod
```

## Best Practices

### 1. Use Git Integration
- Connect your GitHub repository
- Enable auto-deployment on push
- Use different branches for different environments

### 2. Environment Management
- Use different environment variables for staging and production
- Never commit sensitive information to git
- Use `.env.local` for local development

### 3. Deployment Strategy
- Deploy to preview URL first for testing
- Use feature branches for development
- Keep production deployments stable

### 4. Monitoring and Maintenance
- Regularly check deployment logs
- Monitor performance metrics
- Keep dependencies updated

### 5. Cost Optimization
- Use Vercel's free tier effectively
- Monitor usage and upgrade when needed
- Optimize build times

## Vercel Free Tier Limits

### What's Included:
- 100 GB bandwidth per month
- 6 serverless functions (unlimited invocations)
- 1 production deployment
- Unlimited preview deployments
- 1 GB built-in storage

### When to Upgrade:
- High traffic applications
- Custom domain requirements
- Advanced analytics needs
- Team collaboration features

## EduBridge+ Quick Reference

### One-Command Deployment (After Setup)
```bash
# From your project directory
cd edu-bridge
git push origin <your-branch>
vercel --prod --yes
```

### Quick Reference: Deploy to Existing Project
```bash
# When you want to update an existing deployment instead of creating new URLs
cd edu-bridge  # Navigate to directory with package.json
rm -rf .vercel  # Remove current configuration
vercel link     # Link to existing project (choose "no" when asked about found project)
vercel --prod --yes  # Deploy to existing project
```

### Firebase Variables Checklist
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` 
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`

### Post-Deployment Testing
1. **Check Firebase**: Browser console should show "Firebase initialized successfully"
2. **Test Auth**: Login/logout functionality
3. **Test Dashboard**: Verify programme names display correctly
4. **Test Features**: Material upload, approval workflow

### Expected Console Messages
```
✅ Firebase initialized successfully
✅ Firestore initialized with serverless optimizations
✅ Found programme via programmes array: Diploma in Business Information System
```

## Support Resources

### Documentation
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Next.js on Vercel](https://vercel.com/guides/deploying-nextjs-with-vercel)
- [Vercel Guides](https://vercel.com/guides)

### Community Support
- [Vercel Community](https://vercel.com/community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/vercel)
- [GitHub Issues](https://github.com/vercel/vercel/issues)

### Getting Help
```bash
vercel help                    # Show CLI help
vercel help command            # Show help for specific command
vercel --version              # Check CLI version
```

---

This guide covers everything needed to deploy EduBridge+ using the Vercel CLI. Follow these steps carefully, and you'll have your app deployed in no time!