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

### 4.1 Link your project
```bash
vercel link --yes
```

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

## Step 6: Configure Environment Variables

### 6.1 Add environment variables one by one
```bash
# Example for each environment variable
echo "your_value_here" | vercel env add VARIABLE_NAME production
```

### 6.2 Add multiple environment variables
```bash
# Common Next.js environment variables
echo "true" | vercel env add NEXT_PUBLIC_APP_ENV production
echo "your_value" | vercel env add NEXT_PUBLIC_API_URL production
echo "your_secret" | vercel env add API_SECRET_KEY production
```

### 6.3 Verify environment variables
```bash
vercel env ls
```

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

## Troubleshooting Common Issues

### Issue 1: "Command not found: vercel"
**Solution:**
```bash
npm install -g vercel
# Or use npx
npx vercel
```

### Issue 2: Authentication errors
**Solution:**
```bash
vercel logout
vercel login
```

### Issue 3: Build failures
**Solution:**
```bash
# Check local build first
npm run build

# Clear Vercel cache
vercel build --force

# Check Node.js version
node --version
```

### Issue 4: Environment variables not working
**Solution:**
```bash
# Verify variables are set
vercel env ls

# Redeploy after adding variables
vercel --prod --yes
```

### Issue 5: Permission errors
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