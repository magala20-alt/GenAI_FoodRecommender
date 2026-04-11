# GenAI_FoodRecommender

GenAI Food Recommender is a diabetes-support platform that combines AI meal guidance, daily tracking, and clinician oversight. The system has two connected views: a patient mobile app for day-to-day self-management, and a clinician web app for monitoring and intervention.

## Two Views

### 1. Patient Mobile View (Expo React Native)
The expo app must be downloaded to run this.

Main functions:

- Secure patient login and onboarding
- Daily dashboard with health stats and meal progress
- AI chatbot for meal recommendations
- Meal logging from text, voice, or snapshot flows
- Personalized meal-plan and nutrition guidance

### 2. Clinician Web View (React + Vite)

Main functions:

- Clinician/admin authentication
- Patient list and risk-oriented monitoring
- Review of patient trends, alerts, and interventions
- Suggested meal governance and approvals
- Care coordination workflows tied to backend APIs

## How To Start The App

Open three terminals from the project root and run each service.

### 1. Start Backend API

1. Change directory to Backend
2. Install dependencies if needed: pip install -r requirements.txt
3. Start server: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

### 2. Start Patient Mobile App

1. Change directory to GenAI_FoodRecommender
2. Install dependencies if needed: npm install
3. Start Expo: npx expo start -c --port 8081

### 3. Start Clinician Web App

1. Change directory to clinician-web
2. Install dependencies if needed: npm install
3. Start dev server: npm run dev

## Default Local URLs

- Backend API: http://localhost:8000
- Clinician Web: http://localhost:5173
- Mobile: Expo QR flow or emulator launched from Expo CLI
