# JinjjaAI (진짜AI) 🇰🇷✨

**JinjjaAI** is an immersive, production-grade, AI-powered Korean language learning universe. Unlike standard language apps that rely on boring, repetitive multiple-choice questions, JinjjaAI combines structured lessons with a fully interactive **Games Arcade**, a real-time **Bilingual AI Tutor (Gwan-Sik)**, **Speech Lab Pronunciation Analysis**, and **AI Model Benchmarks**.

---

## 🎮 Core Features

### 1. Structured Curriculum Path (`/lessons`)
* **7 Comprehensive Courses**: Spans from Hangeul Vowels & Consonants Bootcamp (Pre-A1) to Advanced C1 Korean.
* **42+ Progressive Phases**: Detailed textbook-aligned reading, interactive card flips, vocab drill cards, and adaptive listening quizzes.
* **Smart Dashboard Sync**: Completed lessons, earned XP, and badges dynamically update based on your actual study history.

### 2. Gwan-Sik (관식) AI Tutor (`/tutor`)
* **Dynamic Conversational Partner**: A supportive, bilingual Korean-English AI tutor powered by **Groq Cloud API**.
* **Model Selector**: Switch between elite cloud models like **Llama 3.3 70B** and **Qwen 2.5 32B** on the fly.
* **Interactive Settings Panel**: Adjust tutor response modes (Challenge Korean vs. Bilingual English), speech synthesizers (Google Online vs. Premium Microsoft Neural TTS), and playback speed.
* **Grammar Correction Hub**: Real-time analysis of your Korean inputs with descriptive syntax corrections, grammar footnotes, and instant translations.

### 3. Games Arcade (`/games`)
Four interactive games built to make language acquisition addictive:
* **🍊 Tangerine Orchard**: Collect vocab tangerines by matching Korean translations. Correct answers grow the tree, and master streaks unlock golden tangerines.
* **🎯 Korean Sniper**: Test your reaction times and recall by popping translation balloons before they float off-screen.
* **🧩 Sentence Builder**: Drag-and-drop word blocks to master Subject-Object-Verb (SOV) order.
* **⚔️ Grammar Boss Battles**: Fight the Particle King in a turn-based RPG layout where correct grammar handles spell damage.

### 4. Speech Lab & Pronunciation Hub
* Speak directly into your mic, record pronunciation attempts, and get real-time syllable-by-syllable correctness feedback powered by **Faster-Whisper**.

### 5. AI Benchmarks Dashboard (`/benchmarks`)
* Compare responses, latency, and JSON structure compliance between the top LLMs and TTS voices.

---

## 🛠️ Technology Stack

* **Frontend**: Next.js 16 (React 19, TypeScript, Vanilla CSS + Tailwind CSS utilities, Lucide Icons)
* **Backend**: FastAPI (Python 3.11+), SQLAlchemy 2.0 (Async Engine), Alembic Migrations
* **Databases**: PostgreSQL (progress, mastery stats, and conversation storage), Redis (cache and rate limiting)
* **AI Engine**: Groq Cloud SDK (Llama 3.3 70B / Qwen 2.5 32B)

---

## 🚀 Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/sambitcodes/JinjjaAI.git
cd JinjjaAI
```

### 2. Environment Configurations
Create a `.env` file in the `backend/` directory (see `backend/.env.example`):
```ini
GROQ_API_KEY="your_groq_api_key"
POSTGRES_SERVER="localhost"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="postgres"
POSTGRES_DB="hangeulai"
POSTGRES_PORT=5432
JWT_SECRET="SUPER_SECRET_DEV_KEY"
```

### 3. Run with Docker Compose
Spin up the complete system (Frontend, Backend, Postgres, Redis):
```bash
docker-compose up --build
```
* **Frontend**: http://localhost:3000
* **Backend Docs (Swagger)**: http://localhost:8000/docs

---

## ☁️ Deployment Guide (Render Hosting)

Render provides a straightforward, free cloud hosting path for PostgreSQL databases, Redis instances, and Dockerized web applications.

### Step 1: Deploy PostgreSQL
1. Go to your **Render Dashboard** and click **New > PostgreSQL**.
2. Name your database (e.g. `jinjja-db`) and choose the **Free** tier.
3. Once provisioned, copy the **Internal Database URL** (for backend communication) and the **External Database URL** (for local testing/migrations).

### Step 2: Deploy Redis
1. Click **New > Redis**.
2. Name your instance (e.g. `jinjja-redis`) and select the **Free** tier.
3. Copy the **Internal Redis URL**.

### Step 3: Deploy the FastAPI Backend
1. Click **New > Web Service**.
2. Connect your GitHub repository (`JinjjaAI`).
3. Set the following details:
   * **Name**: `jinjja-backend`
   * **Root Directory**: `backend`
   * **Runtime**: `Docker`
4. Add the following **Environment Variables** under the Advanced section:
   * `DATABASE_URL`: paste your **Internal Database URL** (replace `postgresql://` with `postgresql+asyncpg://`)
   * `REDIS_URL`: paste your **Internal Redis URL**
   * `GROQ_API_KEY`: paste your Groq API key
   * `JWT_SECRET`: choose a strong random secret key
   * `BACKEND_CORS_ORIGINS`: `https://jinjja-frontend.onrender.com` (or your eventual frontend URL)
5. Render will automatically build the service from `backend/Dockerfile`.

### Step 4: Deploy the Next.js Frontend
1. Click **New > Web Service**.
2. Connect your GitHub repository.
3. Set the following details:
   * **Name**: `jinjja-frontend`
   * **Root Directory**: `frontend`
   * **Build Command**: `npm run build`
   * **Start Command**: `npm run start` (or standard Next.js deploy commands)
4. Add the following **Environment Variables**:
   * `NEXT_PUBLIC_API_URL`: `https://jinjja-backend.onrender.com/api/v1` (your Render backend URL)
5. Click **Deploy Web Service**. Render will build the Next.js app and serve it online.

---

## 🧠 Machine Learning Pipelines
All fine-tuning and speech notebooks reside in `ml_pipelines/` for PEFT/QLoRA training and Wav2Vec2 phonetic alignment configurations.

## 📜 License
JinjjaAI is open-source software licensed under the **Apache 2.0 License**.
