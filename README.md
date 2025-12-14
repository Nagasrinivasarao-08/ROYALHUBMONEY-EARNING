
# Royal Hub - Premium Investment Application

A full-stack MERN (MongoDB, Express, React, Node.js) investment simulation platform.

## Features

- **User Investment Dashboard**: Track assets, daily income, and active products.
- **Admin Panel**: Full control to manage users, products, settings, and approvals.
- **Wallet System**: Simulate Recharges (UPI/QR) and Withdrawals (Bank/UPI).
- **Referral System**: Earn bonuses when invited users invest.
- **AI Assistant**: Integrated Google Gemini AI for financial advice.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons, Recharts
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **AI**: Google Gemini API

## Getting Started

### Prerequisites

- Node.js installed
- MongoDB connection string

### Installation

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Configure Environment**
    Create a `.env` file in the root directory for the backend:
    ```env
    MONGO_URL=your_mongodb_connection_string
    ```
    
    Create a `.env` or set environment variables for the frontend:
    ```env
    VITE_API_KEY=your_gemini_api_key
    VITE_API_URL=http://localhost:5000/api
    ```

3.  **Run the Application**
    
    You need two terminals:

    **Terminal 1 (Backend):**
    ```bash
    npm run server
    ```

    **Terminal 2 (Frontend):**
    ```bash
    npm run dev
    ```

## Admin Access (Default)

- **Email**: `srinivas@gmail.com`
- **Password**: `srinivas@9121`

## Deployment Guide

This is a Full Stack app, so it is recommended to deploy the **Frontend** and **Backend** separately for best results.

### 1. Frontend Deployment (Netlify)

1.  Connect your repository to Netlify.
2.  **Build Command:** `npm run build`
3.  **Publish Directory:** `dist`
4.  **Environment Variables:**
    - `VITE_API_KEY`: Your Google Gemini API Key.
    - `VITE_API_URL`: The URL of your deployed Backend (e.g., `https://royal-hub-backend.onrender.com/api`).
5.  Deploy.

### 2. Backend Deployment (Render / Railway)

1.  Connect your repository to Render or Railway.
2.  **Build Command:** `npm install`
3.  **Start Command:** `npm run server` (or `node server/index.js`)
4.  **Environment Variables:**
    - `MONGO_URL`: Your MongoDB connection string.
5.  Deploy.
6.  Copy the backend URL and update the `VITE_API_URL` in your Netlify settings.

### Note on `netlify.toml`
The included `netlify.toml` file handles Single Page Application (SPA) routing, ensuring pages like `/dashboard` work correctly upon refresh.
