<div align="center">
  <img src="src/assets/typo_logo.png" alt="Kallanum Policeum Logo" width="500"/>
  
  <br/>
  
  **A thrilling multiplayer game of deception, deduction, and high stakes!**
  
  <br/>

</div>

## 🕵️‍♂️ Overview

**Kallanum Policeum** (Thief & Police) is a modern, real-time web adaptation of the classic South Indian parlor game. Gather your friends around a digital table, assign secret roles, and test your deductive skills. The Police must find the Thief before time runs out, while the Thief must cleverly escape detection.

Built with cutting-edge web technologies, the game features server-side synchronized timers, real-time multiplayer networking, procedural sound design, and a stunning, responsive UI that works perfectly on both mobile and desktop.

## ✨ Features

- **⚡ Real-Time Multiplayer:** Instant state synchronization using Supabase Realtime Channels.
- **⏱️ Un-Hackable Server Timers:** Timers are calculated server-side, meaning no player can cheat by refreshing their browser.
- **🎵 Procedural Audio Engine:** All sound effects (from dramatic losing trombones to winning fanfares) are generated procedurally using the native Web Audio API—no heavy asset downloads required!
- **📱 True Responsive Design:** Fully playable on any device. The UI seamlessly morphs from a mobile-friendly stack to a beautiful desktop layout.
- **🛡️ Robust Edge Cases:** Handles host disconnections gracefully. If the host leaves, the next round unlock system automatically falls back to any connected player.
- **🗑️ Automated Garbage Collection:** Expired game rooms are automatically cleaned up from the database to ensure maximum performance.
- **🎭 "Guest" Frictionless Auth:** Join games instantly without needing a password. The backend securely uses Supabase Anonymous Authentication to generate secure JWTs on the fly.

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Backend & Database:** Supabase (PostgreSQL)
- **Real-time:** Supabase Channels
- **Serverless:** Supabase Edge Functions (Deno)

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js installed, as well as a Supabase project created.

### 1. Clone & Install
```bash
git clone https://github.com/spigelspike/Kallanum-Policeum.git
cd Kallanum-Policeum
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Database Setup
Go to your Supabase Dashboard's SQL Editor and run the migrations found in the `supabase/migrations/` folder in order.

### 4. Run the Game
```bash
npm run dev
```
Open your browser to `http://localhost:5173` and start playing!

---

<div align="center">
  <i>Developed with ❤️ by Spigelspike</i>
</div>
