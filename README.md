# 🌿 AyurClinic - Ayurvedic Clinic Management System

**AyurClinic** is a modern, full-stack clinic management solution specifically designed for Ayurvedic practices. It streamlines patient record-keeping, appointment scheduling, prescriptions, inventory, and billing within a premium, user-friendly interface.

---

## ✨ Features

- 🏥 **Patient Management**: Track comprehensive patient profiles and medical history.
- 📅 **Appointment Scheduling**: Effortlessly manage and track patient visits.
- 💊 **Prescription Builder**: Dynamic prescription generation with Ayurvedic medicine support.
- 📦 **Inventory Control**: Real-time tracking of medicine stock and pricing.
- 💳 **Billing & Invoices**: Simplified billing system for clinic services and medicines.
- 📊 **Insightful Dashboard**: Get a birds-eye view of clinic performance and patient flow.
- 🎨 **Premium UI**: Modern, responsive design with glassmorphism aesthetics and elegant animations.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Styling**: Custom CSS (Glassmorphism & Modern Design Tokens)

### Backend
- **Environment**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Communication**: REST API with CORS enabled

---

## 📂 Project Structure

```text
.
├── backend/               # Express backend & Prisma schema
│   ├── prisma/            # Database schema & migrations
│   ├── index.js           # Main server entry point
│   └── .env.example       # Backend environment variables
├── src/                   # React frontend source code
│   ├── components/        # Reusable UI components
│   ├── pages/             # Main view components
│   ├── App.jsx            # Main app router & layout
│   └── index.css          # Global styles & design system
├── index.html             # Frontend entry point
└── package.json           # Frontend dependencies
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file in the `backend` folder.
   - Add your PostgreSQL connection string:
     ```env
     DATABASE_URL="postgresql://user:password@localhost:5432/ayurclinic"
     PORT=5000
     ```
4. Initialize the database with Prisma:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
5. Start the server:
   ```bash
   node index.js
   ```

### 2. Frontend Setup
1. From the project root, install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open your browser at `http://localhost:5173`.

---

## 📝 Environment Variables

### Backend
| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://janedoe:mypassword@localhost:5432/mydb?schema=public` |
| `PORT` | Local server port | `5000` |

---

## 📸 Screenshots
*(Coming soon - Add your clinic dashboard screenshots here!)*

---

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
This project is licensed under the [ISC](LICENSE) License.
