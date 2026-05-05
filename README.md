# AI Smart Traffic Management System

A complete, modern traffic management solution using YOLOv8 for vehicle detection and a React dashboard for real-time monitoring and control.

## 🔹 Features
- **Real-time Detection**: Uses YOLOv8 to detect vehicles from 3 simultaneous road feeds.
- **Modern Dashboard**: Built with React.js, Tailwind CSS, and Framer Motion.
- **Smart Logic**: Dynamically assigns GREEN signals to roads with the highest traffic.
- **Emergency Priority**: Automatically detects emergency vehicles (simulated via high-confidence truck/bus detection) and overrides signals.
- **Data Analytics**: Stores traffic history in SQLite and visualizes density via charts.
- **Live Streaming**: Low-latency video streaming from backend to browser.
- **Real-time Updates**: WebSockets for instantaneous traffic data synchronization.
- **Dark/Light Mode**: Full support for system themes.

## 🔹 Project Structure
```
traffic_project/
├── backend/
│   ├── main.py            # FastAPI Application
│   ├── database.py        # SQLite & SQLAlchemy Setup
│   ├── requirements.txt   # Python Dependencies
│   └── traffic*.mp4       # Video Sources
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main Dashboard UI
│   │   └── index.css      # Tailwind Styles
│   ├── package.json       # Node Dependencies
│   └── tailwind.config.js # Tailwind Config
├── model/
│   └── yolov8n.pt         # YOLOv8 Weights
└── README.md              # Documentation
```

## 🔹 Setup Instructions

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python main.py
```
The backend will run on `http://localhost:8000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The dashboard will be available at `http://localhost:5173`.

## 🔹 Technologies Used
- **Backend**: FastAPI, OpenCV, YOLOv8 (Ultralytics), SQLAlchemy.
- **Frontend**: React.js, Tailwind CSS, Recharts, Lucide Icons, Framer Motion.
- **Database**: SQLite.
- **Communication**: WebSockets, REST API.

## 🔹 Deployment
- **Backend**: Can be deployed using Docker or Gunicorn/Uvicorn on a Linux server.
- **Frontend**: Can be built using `npm run build` and hosted on Vercel, Netlify, or Nginx.
