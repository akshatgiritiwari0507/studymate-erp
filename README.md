# studymate-erp
# 🎓 ERP & LMS Management System with Role-Based Access Control (RBAC)

A **full-stack ERP and LMS platform** designed for educational institutions to manage academic and administrative workflows efficiently.  
The system provides **secure authentication, role-based authorization, and dedicated dashboards** for **Admin, Teacher, and Student** users.

Built with a scalable architecture using **React.js, Node.js, Express.js, and MongoDB**.

---

## 🚀 Tech Stack

### 🎨 Frontend
- React.js
- Context API
- JavaScript
- CSS
- REST API Integration

### ⚙️ Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Role-Based Middleware
- Modular Route Architecture

---

## ✨ Core Features

### 🔐 Authentication & Security
- Secure Login / Signup
- JWT-based Authentication
- Role-based route protection
- Password reset module
- Authorization middleware

### 👨‍💼 Admin Module
- Admin dashboard
- Teacher account creation
- Teacher role management
- Course & section management
- Bus route management
- Event creation
- Lost & found management
- Notice publishing
- Password reset controls
- Audit logs

### 👨‍🏫 Teacher Module
- Teacher dashboard
- Section-wise student management
- Assignment creation
- Attendance marking by section
- Notice management
- Timetable management
- Todo system
- Lost & found module

### 👨‍🎓 Student Module
- Student dashboard
- Assignment submission
- Attendance records
- Timetable view
- Notice board
- Events section
- Bus route details
- Todo tracking
- Lost & found
- Profile/about section

---

## 📂 Project Structure

```bash
erp/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── models/
│   │   │   ├── main/
│   │   │   └── user/
│   │   ├── routes/
│   │   └── app.js
│   └── package.json
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── api/
    │   ├── components/
    │   ├── context/
    │   ├── hooks/
    │   └── pages/
    └── package.json
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository
```bash
git clone <your-github-repo-link>
cd erp
```

---

### 2️⃣ Backend Setup
```bash
cd backend
npm install
npm start
```

---

### 3️⃣ Frontend Setup
```bash
cd frontend
npm install
npm start
```

---

## 🔐 Environment Variables
Create a `.env` file inside the `backend` folder.

```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
DEEPSEEK_API_KEY=your_api_key
```

---

## 📌 Key Highlights
- 🏢 Enterprise-style ERP architecture
- 🔑 Secure RBAC implementation
- 📦 Modular backend structure
- 🎯 Real-world academic workflow use case
- 📊 Multiple dashboards
- 🧩 Clean separation of modules
- 📚 Scalable for future features

---

## 🚀 Future Improvements
- 📱 Mobile responsive UI
- 📊 Analytics dashboard
- 📧 Email notifications
- 💬 Real-time chat system
- 📁 File upload support
- 🌐 Deployment on cloud

---

## 👨‍💻 Developed By
**Akshat Giri Tiwari**  
Final Year Student | Full Stack Developer | DSA Enthusiast

🔗 LinkedIn: https://www.linkedin.com/in/akshat0507/  
🔗 GitHub: https://github.com/akshatgiritiwari0507  
🌐 Portfolio: https://akshat05-portfolio.netlify.app/
