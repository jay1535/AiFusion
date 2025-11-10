# 🤖 AiFusion

**AiFusion** is an **AI-powered multi-model chat platform** that allows users to interact with multiple AI models in real-time through a unified, responsive interface.  
Built using **Next.js 15**, **Tailwind CSS**, **Shadcn UI**, **Clerk**, **CodeRabbit**, and **Arcjet**, it ensures high performance, strong security, and seamless scalability.

---

## 🚀 Features

- 🧠 **Multi-Model Chat:** Interact with multiple AI models simultaneously in a single chat interface.  
- 🎙️ **Voice Input:** Send voice-based queries for hands-free interaction.  
- 📎 **File Sharing:** Upload and share files directly within chat sessions.  
- 🔄 **Dynamic Model Switching:** Instantly switch between AI models during conversation.  
- 💬 **Modern UI/UX:** Responsive, minimal, and accessible interface designed with Tailwind CSS and Shadcn UI.  
- 🔐 **Secure Authentication:** Integrated **Clerk** for user authentication and session management.  
- ⚡ **Performance & Security:** Enhanced with **CodeRabbit** and **Arcjet** for scalable and secure architecture.

---

## 🛠️ Tech Stack

| Category | Technologies |
|-----------|--------------|
| **Frontend** | Next.js 15, React, Tailwind CSS, Shadcn UI |
| **Backend** | Next.js Server Components, API Routes |
| **Authentication** | Clerk |
| **Security** | Arcjet, CodeRabbit |
| **Deployment** | Vercel |
| **Version Control** | Git & GitHub |

---

## 📂 Folder Structure

```
AI-FUSION/
│
├── .next/ # Next.js build and cache files (auto-generated)
│
├── app/ # Core Next.js application directory
│ ├── _components/ # Reusable app-level components
│ ├── api/ # API routes and server-side functions
│ ├── favicon.ico # App favicon
│ ├── globals.css # Global styles
│ ├── layout.js # Root layout structure
│ ├── page.js # Main landing page
│ └── provider.jsx # Global provider setup (Clerk, contexts, etc.)
│
├── components/ # UI components used across multiple pages
│
├── config/ # Configuration files (API keys, constants, etc.)
│
├── context/ # Global React context providers
│
├── hooks/ # Custom React hooks for state and data logic
│
├── lib/ # Utility and helper functions
│
├── public/ # Static assets (images, icons, etc.)
│
├── shared/ # Common reusable logic or shared modules
│
├── node_modules/ # Project dependencies (auto-generated)
│
├── .env # Environment variables file (not committed)
│
├── .gitignore # Files and folders ignored by Git
│
├── package.json # Project dependencies and npm scripts
│
├── jsconfig.json # JavaScript path alias configuration
│
└── README.md # Project documentation file
```


---

## ⚙️ Environment Variables

Create a `.env` file in the root directory and add the following variables (replace with your actual values):


## Firebase Configuration
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```
 ## Clerk Authentication
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```
## Arcjet API Key
```
ARCJET_KEY=
```
## Kravix Studio API Key
```
KRAVIX_STUDIO_API_KEY=

```
---


> ⚠️ **Note:** Never share or commit your `.env` file to GitHub.

---

## 🧠 Installation & Setup

Follow these steps to run AiFusion locally:

```bash
# 1️⃣ Clone the repository
git clone https://github.com/jay1535/AiFusion.git

# 2️⃣ Navigate into the project directory
cd AiFusion

# 3️⃣ Install dependencies
npm install

# 4️⃣ Create .env file and add environment variables
touch .env

# 5️⃣ Run the development server
npm run dev
```





