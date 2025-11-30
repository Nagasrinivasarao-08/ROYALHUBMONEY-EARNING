
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
    Create a `.env` file in the root directory:
    ```env
    MONGO_URL=your_mongodb_connection_string
    VITE_API_KEY=your_gemini_api_key
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

## Deployment

- **Frontend**: Vercel / Netlify
- **Backend**: Render / Railway / Heroku
