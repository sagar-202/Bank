# VibeBank - Digital Banking Platform

VibeBank is a comprehensive digital banking solution designed to provide users with a secure, efficient, and intelligent financial management experience. The platform features a split architecture with a specialized AI assistant integrated directly into the corporate banking dashboard.

## Architecture Overview

The system is built using a modern decoupled architecture:

1. Backend Service: An Express.js server handling core banking logic, user authentication, and database interactions with PostgreSQL.
2. Frontend Application: A React-based Single Page Application (SPA) built with Vite, providing a responsive and dynamic user interface.
3. AI Assistant: A specialized FastAPI service deployed on Hugging Face Spaces, utilizing the Llama 3.2 3B instruct model via the Hugging Face Router for intelligent banking support.

## Core Features

- Secure Authentication: Full JWT-based user authentication system with secure session management.
- Financial Dashboard: Real-time overview of combined balances across all active accounts.
- Account Management: Ability to create and manage multiple account types including Savings and Current accounts.
- Transaction Tracking: Detailed transaction history with date filters and account-specific views.
- Fund Transfers: Support for both internal transfers between user accounts and external transfers to verified beneficiaries.
- AI Banking Assistant: Proactive chat assistant trained to help with banking queries and platform navigation.
- Security Infrastructure: Implementation of rate limiting, data validation, and secure password hashing.

## Technology Stack

- Backend: Node.js, Express.js
- Frontend: React 19, Vite, Tailwind CSS
- Database: PostgreSQL (Aiven)
- AI Model: meta-llama/Llama-3.2-3B-Instruct
- Deployment: Vercel (Web App) and Hugging Face (AI Service)

## Development Setup

### Prerequisites

- Node.js (Latest LTS version)
- PostgreSQL Instance (Aiven or local)
- Hugging Face API Token

### Installation

1. Clone the repository and install root dependencies:
   npm install

2. Install frontend dependencies:
   cd client
   npm install

3. Configure environment variables in a .env file:
   PORT=5000
   DATABASE_URL=your_postgresql_url
   JWT_SECRET=your_jwt_secret
   FRONTEND_URL=http://localhost:5173
   HF_SPACE_URL=your_hugging_face_space_url
   HF_API_TOKEN=your_hugging_face_token

### Running locally

- Start the Express server: npm run dev (from root)
- Start the React application: npm run dev (from client folder)

## Deployment Configuration

The project is optimized for deployment on Vercel. The vercel.json configuration handles the serverless function routing for the /api endpoints and ensures proper SPA routing for the React frontend.
