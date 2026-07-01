#  Webjinny — Real Estate Listing Platform

OLX-inspired real estate website built with Node.js, Express.js, MongoDB, and EJS.

---
## Quick Setup (Windows)

### Step 1 — Prerequisites

Install Node.js → https://nodejs.org
Install MongoDB → https://www.mongodb.com/try/download/community
Start MongoDB from the Start Menu or run it as a service.

### Step 2 — Project Setup

```bash
# Navigate to the project folder
cd path/to/realestate2

# Install dependencies
npm install

# Seed the database (25 sample properties + admin user)
npm run seed
```

### Step 3 — Start the Server

```bash
npm run dev

# or

npm start
```

Open your browser and visit:

**http://localhost:3000**

---

##  Admin Login

 URL: http://localhost:3000/admin/login
 Username: ****
Password: ****

---

##  Folder Structure

```text
realestate2/
├── controllers/
│   ├── adminController.js      # Admin CRUD operations
│   └── propertyController.js   # Public page logic
├── middleware/
│   ├── auth.js                 # JWT authentication middleware
│   └── upload.js               # Multer file upload configuration
├── models/
│   ├── Admin.js                # Admin schema
│   └── Property.js             # Property schema
├── public/
│   ├── css/style.css           # Main stylesheet
│   ├── js/main.js              # Frontend JavaScript
│   └── uploads/                # Property images (auto-created)
├── routes/
│   ├── admin.js                # Admin routes
│   └── public.js               # Public routes
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
│   ├── index.ejs               # Homepage
│   ├── properties.ejs          # Property listing/search page
│   ├── property-detail.ejs     # Single property details page
│   └── error.ejs
├── .env                        # Environment configuration
├── seed.js                     # Sample data generation script
└── server.js                   # Application entry point
```

---

##  Features

 Homepage with search and filtering options
 Property listing grid with pagination (supports 200+ properties)
 Property detail page with:

Photo gallery
WhatsApp contact button
 Call button
 Inquiry form
 Secure admin dashboard (JWT protected)
 Create, edit, and delete property listings
 Multi-image upload with drag-and-drop support
 Inline AJAX status updates (Available / Sold / Rented)
 Featured property toggle
 Fully responsive mobile-friendly design

---

##  Environment Configuration

Configure all required environment variables inside the `.env` file before running the application.

---

##  Tech Stack

Backend:** Node.js, Express.js
Database:** MongoDB + Mongoose
Authentication:** JWT + bcryptjs
Templating Engine:** EJS
File Uploads:** Multer
Frontend:** Vanilla JavaScript, CSS3 (No React or Vue)
