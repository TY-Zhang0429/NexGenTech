# NexGen – Gamified Healthy Food Choices Platform

## 📖 Project Overview
NexGen is a Vue 3 + Vite based frontend application that helps users make healthier food choices through gamification.  
Users can:
- Learn about the app’s purpose and features on the homepage
- Use the WheelSvg to randomly select a game
- Play a Wordle-style food challenge or Match-3 game
- Watch their avatar (AvatarDoor) evolve for immersive engagement
- Explore FAQs, calculator, and support page

This project combines nutrition education with interactive entertainment, designed for teenagers and general users to improve food awareness.

---

## 🛠 Tech Stack
- Frontend Framework: Vue 3 + Composition API
- Bundler & Dev Server: Vite 7
- Routing: Vue Router (History / Hash mode, with archive toggle)
- Styling: CSS3 / custom theme (theme.css)
- Animations: CSS animations + Canvas (canvas-confetti)
- Media Assets: Local video backgrounds, PNG/SVG images, sprite sheets
- Linting & Formatting: ESLint 9 + Prettier 3
- DevTools: vite-plugin-vue-devtools

---

## 📂 Project Structure
src/
├── assets/                 // Website picture/video resources
├── App.vue                 // Root component with global layout and video background
├── main.js                 // Vue app entry point
├── router/
│   └── index.js            // Router configuration
├── styles/
│   └── theme.css           // Global theme variables and utilities
├── components/
│   ├── TopNav.vue          // Top navigation bar
│   ├── BreadcrumbNav.vue   // Breadcrumb Navigation bar
│   ├── WheelSvg.vue        // Wheel of fortune (SVG)
│   └── AvatarDoor.vue      // Avatar and door interaction
└── views/
    ├── HomePage.vue        // Homepage (Hero + How It Works + Highlights + FAQ)
    ├── GamePage.vue        // Game hub with wheel and avatar door
    ├── WordleGameView.vue  // Wordle-style guessing game
    ├── Match3View.vue      // Match-3 puzzle game
    ├── FoodSwapView.vue    // Food swap page
    ├── CalculatorView.vue  // Nutrient calculator
    └── SupportView.vue     // Support & FAQ

---

## 🚀 Setup & Run

1. Clone the repository
   git clone https://github.com/your-username/nexgen.git
   cd nexgen

2. Install dependencies
   npm install

3. Start development server
   npm run dev
   Default: http://localhost:5173/

4. Build for production
   npm run build
   npm run preview

---

## ⚙️ Configuration

Environment Variables:
Create a .env file in the project root:
VITE_ARCHIVE=0   # Use Hash mode for archive builds (avoids 404 on static hosting)

API Proxy:
In vite.config.js, all /api requests are proxied in dev mode to:
https://nexgentech-api.onrender.com

So in your code, just call relative endpoints:
fetch('/api/words')

Assets:
- Static resources in public/ will be copied as-is
- Imported resources in src/assets/ are processed by Vite
- .mp4 files are explicitly included via assetsInclude

---

## 🎮 Features

Homepage (HomePage.vue)
- Hero banner with background video
- "How It Works" 3-step guide
- Highlights section with clickable game preview
- Expandable FAQ list

Game Hub (GamePage.vue)
- Left: guide character and background scene
- Center: WheelSvg to select a game
- Right: boss preview for immersive gameplay
- Begin / Reset buttons

Wordle Game (WordleGameView.vue)
- Difficulty selection (Easy / Medium / Hard)
- In-game hints
- Keyboard + on-screen keyboard
- Confetti animation on win

Match-3 Game (Match3View.vue)
- Tile-swapping gameplay
- Cascading elimination animations
- Visual and sound effects for better feedback

AvatarDoor Component
- Walking sprite animation
- Avatar runs to door and triggers glow
- Responsive scaling for different devices

WheelSvg Component
- Wheel built with SVG
- Click sectors to navigate
- Spin button with random result
- Labels follow arc paths

CalculatorView
- Nutrient calculator to support healthy food choices

SupportView
- FAQs and contact/help section

---

## 🧪 Development Notes
- Test interactions on both desktop and mobile
- Ensure /api/words endpoint returns JSON in the format:
  [
    { "word": "apple", "difficulty": "Easy", "hint": "A fruit" },
    { "word": "banana", "difficulty": "Medium", "hint": "Yellow fruit" }
  ]

---

## 📌 TODO
- [x] Implement mobile-friendly navigation menu
- [x] Extend backend API for user progress and avatar state
- [ ] Add more mini-games
- [ ] Improve animations and mobile responsiveness

---

## 📜 License
This project is for learning and demonstration purposes.  
An appropriate license (MIT / Apache 2.0) can be added as needed.
