# 📏 Object Dimension Tracker ( DimensiMeasure )

**DimensiMeasure** is a cutting-edge web application designed for **precise, real-time object dimension measurement** using **advanced computer vision** and **machine learning** technologies. With robust support for both real-time camera input and image uploads, the platform offers a seamless user experience for accurate measurement, object detection, and result analytics.  

### 🌐 Accessible on both desktop and mobile devices.

---

## 🚀 Features

- 🔐 **Secure Authentication** (Passport.js)
- 📸 **Real-time Object Measurement** via webcam
- 🖼️ **Image Upload Measurement** for offline analysis
- 🧠 **YOLO Object Detection** and Python-based CV pipeline
- 📊 **Interactive Dashboard** for history and analytics
- 🗂️ **Persistent Data Storage** using PostgreSQL
- 📱 **Responsive UI** for mobile & desktop
- 🔁 **RESTful API Integration** between frontend, backend, and CV model

---

## 🛠️ Tech Stack

### Frontend:
- **React** (with **TypeScript**)
- **TailwindCSS** for styling

### Backend:
- **Node.js** & **Express.js**
- **Passport.js** for authentication
- **PostgreSQL** for database

### Machine Learning & CV:
- **Python** with **Flask**
- **OpenCV** for image processing
- **YOLO** for real-time object detection

---

## 📷 System Architecture

```
[User Interface: React + TailwindCSS] 
        ⬇️
[REST API: Express.js + Node.js + Passport.js] 
        ⬇️
[Python Server: Flask + YOLO + OpenCV] 
        ⬇️
[PostgreSQL: Persistent Storage of Users, History, Analytics]
```

---

## 🧪 How to Run Locally

### 1. Clone the Repo

```bash
git clone https://github.com/yourusername/dimensimeasure.git
cd dimensimeasure
```

### 2. Setup Frontend (React + TS)

```bash
cd client
npm install
npm run dev
```

### 3. Setup Backend (Node + Express)

```bash
cd server
npm install
npm run dev
```

### 4. Setup Python Flask API

```bash
cd python-cv
pip install -r requirements.txt
python app.py
```

### 5. Database Setup (PostgreSQL)

Ensure PostgreSQL is running. Create a DB and update the credentials in your backend config file (`.env`).

```env
DB_HOST=localhost
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=dimensimeasure
```

---

## 🧩 Key Functionalities

- **Real-time Detection** with dimension overlay
- **History Page** with previous measurements
- **Analytics Page** (most common objects, average sizes, etc.)
- **Profile & Logout**

---

## 📁 Folder Structure (Simplified)

```
dimensimeasure/
│
├── client/                # React + Tailwind Frontend
├── server/                # Node.js + Express Backend
├── python-cv/             # Flask + YOLO + OpenCV
├── database/              # PostgreSQL schema/setup scripts
└── README.md
```

---

## ✅ Future Improvements

- Calibration for camera distance
- Multi-object measurement
- Export to PDF/CSV
- Voice input support
