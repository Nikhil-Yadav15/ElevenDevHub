# 🎯 Eleven's Deployment Hub

A Stranger Things-themed deployment platform for deploying static sites and projects to Cloudflare Pages with GitHub integration.

## ✨ Features

- 🚀 Deploy from existing GitHub repositories
- ✨ Create new projects with templates or file uploads
- 📂 Upload files, folders, or ZIP archives
- 🤖 AI-powered build error analysis (OpenRouter)
- 📊 Real-time deployment tracking
- 🔄 Instant rollback to previous deployments
- 📝 Deployment logs viewer
- 🔐 GitHub OAuth authentication
- 💾 Cloudflare D1 database (SQLite)

---

## 📋 Prerequisites

Before running this project, ensure you have:

- **Node.js 18+** installed
- **npm** or **yarn** package manager
- **GitHub Account** with OAuth App configured
- **Cloudflare Account** with:
  - Pages enabled
  - D1 database created
  - API token with Pages & D1 permissions
- **OpenRouter API Key** (for AI features)

---

## 🚀 Setup Instructions

### **1. Clone the Repository**

```bash
git clone https://github.com/Nikhil-Yadav15/ElevenDevHub.git
cd ElevenDevHub
```

### **2. Install Dependencies**

```bash
npm install
```

### **3. Configure Environment Variables**

Create a `.dev.vars` file in the root directory:

```bash
# .dev.vars (for local development)

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/callback

# Cloudflare
CF_ACCOUNT_ID=your_cloudflare_account_id
CF_API_TOKEN=your_cloudflare_api_token

# OpenRouter (for AI features)
OPENROUTER_API_KEY=your_openrouter_api_key

# Session Secret (generate a random string)
SESSION_SECRET=your-random-session-secret-min-32-chars
```

**How to get credentials:**

#### **GitHub OAuth App:**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Homepage URL: `http://localhost:3000`
4. Set Callback URL: `http://localhost:3000/api/auth/callback`
5. Copy Client ID and Client Secret

#### **Cloudflare:**
1. Get Account ID from Cloudflare Dashboard URL: `dash.cloudflare.com/<ACCOUNT_ID>`
2. Create API Token:
   - Go to [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
   - Click "Create Token"
   - Use "Edit Cloudflare Workers" template
   - Add permissions: `Cloudflare Pages:Edit` and `D1:Edit`
   - Copy the token

#### **OpenRouter:**
1. Visit [OpenRouter](https://openrouter.ai/)
2. Sign up/login
3. Go to [API Keys](https://openrouter.ai/keys)
4. Create new API key

### **4. Create Cloudflare D1 Database**

```bash
# Create the database
wrangler d1 create eleven-db

# Copy the database_id from output and add to wrangler.toml
```

Update `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "eleven-db"
database_id = "your-database-id-here"
```

### **5. Run Database Migrations**

```bash
# Apply migrations to local development database
npm run db:migrate:local

# (Optional) View database in Drizzle Studio
npm run db:studio
```

### **6. Start Development Server**

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

---

## 🗄️ Database Commands

```bash
# Generate new migration files
npm run db:generate

# Apply migrations (local)
npm run db:migrate:local

# Apply migrations (production)
npm run db:migrate:prod

# Open Drizzle Studio (database GUI)
npm run db:studio
```

---

## 🏗️ Build & Deploy

### **Development:**
```bash
npm run dev
```

### **Production Build:**
```bash
npm run build
npm start
```

### **Deploy to Cloudflare Pages:**
```bash
npm run deploy
```

---

## 📁 Project Structure

```
ElevenDevHub/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── auth/            # GitHub OAuth
│   │   ├── projects/        # Project management
│   │   └── repos/           # Repository creation
│   ├── dashboard/           # Main dashboard
│   ├── new-project/         # Project creation UI
│   └── projects/[id]/       # Project detail page
├── components/              # React components
│   ├── AIAnalysis.js       # AI error analysis
│   └── LogViewer.js        # Deployment logs
├── lib/
│   ├── auth/               # Authentication & sessions
│   ├── cloudflare/         # Cloudflare Pages API
│   ├── db/                 # Database schema & queries
│   ├── github/             # GitHub API integration
│   ├── ai/                 # OpenRouter AI integration
│   └── templates/          # Project templates
├── drizzle/                # Database migrations
├── .dev.vars               # Environment variables (local)
├── wrangler.toml           # Cloudflare configuration
└── package.json
```

---

## 🎨 Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4
- **Backend:** Next.js API Routes, Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite) with Drizzle ORM
- **Authentication:** GitHub OAuth
- **Deployment:** Cloudflare Pages
- **AI:** OpenRouter API (Claude, GPT)
- **Version Control:** GitHub API

---

## 🧪 Testing

1. **Login:** Visit `http://localhost:3000` and login with GitHub
2. **Create Project:** Click "New Project" and try:
   - Deploy existing repository
   - Create from template
   - Upload files/folders/ZIP
3. **View Deployment:** Check logs and AI analysis
4. **Rollback:** Try rolling back to previous deployment

---

## 🐛 Troubleshooting

### **Issue: Database not found**
```bash
# Recreate local database
npm run db:migrate:local
```

### **Issue: GitHub OAuth fails**
- Check `GITHUB_REDIRECT_URI` matches your OAuth app settings
- Ensure callback URL is exactly: `http://localhost:3000/api/auth/callback`

### **Issue: Cloudflare API errors**
- Verify `CF_API_TOKEN` has correct permissions
- Check `CF_ACCOUNT_ID` is correct

### **Issue: Port 3000 already in use**
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
PORT=3001 npm run dev
```

---

## 📝 License

MIT License - feel free to use this project for learning and personal projects!

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📧 Support

For issues or questions, open an issue on GitHub.

---

**Made with 💜 by Stranger Things fans**
