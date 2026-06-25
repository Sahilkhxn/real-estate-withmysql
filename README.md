# 🏠 PropFind — Real Estate Listing Platform

OLX-inspired real estate website. Node.js + Express + MongoDB + EJS.

---

## ⚡ Quick Setup (Windows)

### Step 1 — Prerequisites
- Node.js installed → https://nodejs.org
- MongoDB installed → https://www.mongodb.com/try/download/community
- MongoDB ko start karo: Start Menu → "MongoDB" → Run

### Step 2 — Project Setup
```bash
# Project folder mein jao
cd path/to/realestate2

# Dependencies install karo
npm install

# Database seed karo (25 sample properties + admin user)
npm run seed
```

### Step 3 — Server Start
```bash
npm run dev
# ya
npm start
```

Browser mein open karo: **http://localhost:3000**

---

## 🔐 Admin Login
- URL: http://localhost:3000/admin/login  
- Username: **admin**  
- Password: **admin123**

---

## 📁 Folder Structure
```
realestate2/
├── controllers/
│   ├── adminController.js    # Admin CRUD logic
│   └── propertyController.js # Public pages logic
├── middleware/
│   ├── auth.js               # JWT protection
│   └── upload.js             # Multer photo upload
├── models/
│   ├── Admin.js              # Admin schema
│   └── Property.js           # Property schema
├── public/
│   ├── css/style.css         # Main stylesheet
│   ├── js/main.js            # Frontend JS
│   └── uploads/              # Property photos (auto-created)
├── routes/
│   ├── admin.js              # /admin/* routes
│   └── public.js             # / and /properties routes
├── views/
│   ├── admin/
│   │   ├── login.ejs
│   │   ├── dashboard.ejs
│   │   ├── properties.ejs
│   │   └── property-form.ejs
│   ├── partials/
│   │   ├── header.ejs
│   │   ├── footer.ejs
│   │   └── property-card.ejs
│   ├── index.ejs             # Homepage
│   ├── properties.ejs        # Search/listing page
│   ├── property-detail.ejs   # Single property page
│   └── error.ejs
├── .env                      # Config (edit this)
├── seed.js                   # Sample data script
└── server.js                 # Entry point
```

---

## 🎯 Features
- ✅ Homepage with search + filters
- ✅ Property grid with pagination (200+ support)
- ✅ Detail page with photo gallery, WhatsApp button, Call button, Enquiry form
- ✅ Admin panel (JWT protected)
- ✅ Add/Edit/Delete properties
- ✅ Multi-photo upload (drag & drop)
- ✅ Status toggle (Available/Sold/Rented) — inline AJAX
- ✅ Featured property toggle
- ✅ Mobile responsive design

---

## 🔧 .env Config
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/realestate
JWT_SECRET=change_this_in_production
SESSION_SECRET=change_this_in_production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

---

## 📞 Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT + bcryptjs
- **Templates**: EJS
- **File Upload**: Multer
- **Frontend**: Vanilla JS, CSS3 (no React/Vue)
