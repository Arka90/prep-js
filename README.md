# PrepJS - JavaScript Interview Quiz App 🧠

A full-featured JavaScript interview preparation web application with AI-powered quiz generation, progress tracking, and detailed analytics.

![PrepJS](https://img.shields.io/badge/PrepJS-JavaScript%20Quiz-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4)

## ✨ Features

- **AI-Powered Quizzes**: Generate unique JavaScript questions using OpenAI GPT-4
- **15 Core JavaScript Topics**: Closures, Hoisting, this Keyword, Type Coercion, and more
- **Progressive Difficulty**: Questions adapt based on your practice day
- **Timed Quizzes**: 20-minute quizzes with countdown timer
- **Detailed Analytics**: Track performance by topic, view trends over time
- **Gamification**: Streaks, achievements, points, and level progression
- **Dark Mode**: Toggle between light and dark themes
- **Mobile Responsive**: Works great on all device sizes
- **PWA Support**: Install as a progressive web app

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/prep-js.git
   cd prep-js
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env.local` and fill in your credentials:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up the database**
   
   Go to your Supabase project's SQL Editor and run the contents of `supabase-schema.sql`.
   
   The default access key is `prepjs2024`. You can change this by:
   ```javascript
   const bcrypt = require('bcryptjs');
   const hash = bcrypt.hashSync('your-secret-key', 10);
   console.log(hash);
   ```
   Then update the `access_key` in the `users` table.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the app**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── quiz/          # Quiz generation & submission
│   │   └── user/          # User stats & achievements
│   ├── analytics/         # Analytics page
│   ├── dashboard/         # Dashboard page
│   ├── login/             # Login page
│   ├── profile/           # Profile page
│   └── quiz/              # Quiz pages
├── components/            # React components
│   ├── analytics/         # Analytics components
│   ├── auth/              # Authentication components
│   ├── layout/            # Layout components (Navbar, etc.)
│   ├── quiz/              # Quiz components
│   └── ui/                # Reusable UI components
├── lib/                   # Utility functions
│   ├── quiz.ts           # Quiz logic & OpenAI integration
│   ├── store.ts          # Zustand state management
│   ├── supabase-client.ts # Browser Supabase client
│   └── supabase-server.ts # Server Supabase client
└── types/                 # TypeScript type definitions
```

## 🎯 JavaScript Topics Covered

1. Closures
2. Hoisting
3. The `this` Keyword
4. Type Coercion
5. Prototypes and Inheritance
6. Event Loop and Asynchronous Execution
7. Scope (Lexical vs Block)
8. Equality Operators (`==` vs `===`)
9. Arrow Functions
10. Truthy/Falsy Values
11. Operator Precedence and Associativity
12. Array and Object Behaviors
13. IIFEs (Immediately Invoked Function Expressions)
14. Promises and Async/Await
15. Strict Mode

## 🏆 Achievements

- **Perfect Score**: Score 10/10 on any quiz
- **Speed Demon**: Complete a quiz under 10 minutes with >80%
- **Week Warrior**: Maintain a 7-day streak
- **Month Master**: Maintain a 30-day streak
- **Century Champion**: Maintain a 100-day streak
- And more!

## 📊 Progressive Difficulty

| Days | Easy | Medium | Hard |
|------|------|--------|------|
| 1-7  | 5    | 3      | 2    |
| 8-14 | 2    | 4      | 4    |
| 15+  | 1    | 2      | 7    |

## 🛠️ Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4
- **State Management**: Zustand
- **Charts**: Recharts
- **Icons**: Lucide React
- **Syntax Highlighting**: Prism.js

## 📱 Screenshots

The app includes:
- **Login Page**: Secure access key authentication
- **Dashboard**: Overview of stats, recent quizzes, and quick actions
- **Quiz Page**: Timed questions with syntax-highlighted code
- **Results Page**: Detailed breakdown with explanations
- **Analytics Page**: Charts and topic performance analysis
- **Profile Page**: User stats and account actions

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set these in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_APP_URL`

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

If you have any questions or issues, please open an issue on GitHub.
