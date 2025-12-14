
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

This app uses a separated architecture: **Frontend** on Vercel and **Backend** on Render (or similar Node.js hosting).

### 1. Frontend Deployment (Vercel)

1.  Push your code to GitHub.
2.  Import the project into Vercel.
3.  **Configure Project Settings (Critical):**
    *   **Framework Preset:** Vite
    *   **Build Command:** `npm run build`  <-- *Do NOT use `npm run dev`*
    *   **Output Directory:** `dist`
    *   **Install Command:** `npm install`
4.  **Environment Variables:**
    *   `VITE_API_KEY`: Your Google Gemini API Key.
    *   *Note: `VITE_API_URL` is optional. The app automatically connects to the Royal Hub Backend on Render if not specified.*
5.  Deploy.

### 2. Backend Deployment (Render / Railway)

1.  Connect your repository to Render or Railway.
2.  **Build Command:** `npm install`
3.  **Start Command:** `npm run server`
4.  **Environment Variables:**
    *   `MONGO_URL`: Your MongoDB connection string.
5.  Deploy.
