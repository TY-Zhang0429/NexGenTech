# NexGen – Gamified Healthy Food Choices Platform

## 📖 Project Overview
**NexGen** is a **Vue 3** based frontend application that helps users make healthier food choices through gamification.  
Users can:
- Learn about the app’s purpose and features on the homepage  
- Use the **WheelSvg** to randomly select a game  
- Play a **Wordle-style food challenge**  
- Watch their **avatar (AvatarDoor)** evolve for immersive engagement  
- Explore FAQs and highlights  

This project combines nutrition education with interactive entertainment, designed for teenagers and general users to improve food awareness.

---

## 🛠 Tech Stack
- **Frontend Framework**: [Vue 3](https://vuejs.org/) + Composition API  
- **Routing**: Vue Router  
- **Styling**: CSS3 / custom theme (theme.css)  
- **Animations**: CSS animations + Canvas (confetti effect)  
- **Media Assets**: Local video backgrounds, PNG/SVG images, sprite sheets  

---

## 📂 Project Structure
```
src/
├── assets/
│   └── XXX.PNGS
│   ...                    # Website picture resources
├── App.vue                # Root component with global layout and video background
├── main.js                # Vue app entry point
├── router/
│   └── index.js           # Router configuration
├── styles/
│   └── theme.css          # Global theme variables and utilities
├── components/
│   ├── TopNav.vue         # Top navigation bar
│   ├── BreadcrumbNav.vue  # Breadcrumb Navigation bar 
│   ├── WheelSvg.vue       # Wheel of fortune (SVG)
│   └── AvatarDoor.vue     # Avatar and door interaction
└── views/
    ├── HomePage.vue       # Homepage (Hero + How It Works + Highlights + FAQ)
    ├── GamePage.vue       # Game hub with wheel and avatar door
    ├── WordleView.vue     # Wordle-style guessing game
    ├── FoodSwapView.vue   # Food swap page
    ├── Game2.vue          # Placeholder
    └── Game3.vue          # Placeholder
```

---

## 🚀 Setup & Run

### 1. Clone the repository
```bash
git clone https://github.com/your-username/nexgen.git
cd nexgen
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
npm run dev
```
Default: `http://localhost:5173/`

### 4. Build for production
```bash
npm run build
```

---

## ⚙️ Configuration
- **API Requests**:  
  In `Blank1View.vue`, `API_BASE` is defined. It defaults to an empty string and can be replaced with a proxy or CloudFront API.  
  ```js
  const API_BASE = ''  // replace with /proxy or remote API endpoint
  ```

- **Assets**:  
  All images, videos, and sprite sheets are stored in `/assets`. Ensure paths are correct.

---

## 🎮 Features

### Homepage (HomePage.vue)
- Hero banner with background video
- "How It Works" 3-step guide
- Highlights section with clickable game preview
- Expandable FAQ list

### Game Hub (GamePage.vue)
- Left: guide character and background scene
- Center: **WheelSvg** to select a game
- Right: boss preview for immersive gameplay
- Begin / Reset buttons

### Wordle Game (Blank1View.vue)
- Difficulty selection (Easy / Medium / Hard)
- In-game hints
- Keyboard + on-screen keyboard
- Confetti animation on win

### AvatarDoor Component
- Walking sprite animation
- Avatar runs to door and triggers glow
- Responsive scaling for different devices

### WheelSvg Component
- Wheel built with SVG
- Click sectors to navigate
- Spin button with random result
- Labels follow arc paths

---

## 🧪 Development Notes
- Test interactions on both desktop and mobile
- Ensure `/api/words` endpoint returns JSON in the format:
  ```json
  [
    { "word": "apple", "difficulty": "Easy", "hint": "A fruit" },
    { "word": "banana", "difficulty": "Medium", "hint": "Yellow fruit" }
  ]
  ```

---

## 📌 TODO
- [ ] Implement standalone FAQ page (`showMoreFaqs` function)
- [ ] Replace Blank2/Blank3 with real feature pages
- [ ] Add more games (Game2, Game3)
- [ ] Extend backend API for user progress and avatar state

---

## 📜 License
- This project is for learning and demonstration purposes.Will add an appropriate license (MIT / Apache 2.0) as needed.

