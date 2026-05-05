import cv2
import asyncio
import json
import time
import datetime
from typing import List, Dict
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, File, UploadFile
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import threading
import os
import shutil
from database import SessionLocal, TrafficHistory, engine
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager

# Set YOLO config directory to /tmp for Render compatibility
os.environ["YOLO_CONFIG_DIR"] = "/tmp"

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start background threads
    threading.Thread(target=process_traffic_logic, daemon=True).start()
    threading.Thread(target=save_traffic_history, daemon=True).start()
    
    for rid in ["road1", "road2", "road3"]:
        threading.Thread(target=video_worker, args=(rid,), daemon=True).start()
    threading.Thread(target=uploaded_video_worker, daemon=True).start()
    
    yield
    # Shutdown logic if needed (daemon threads will stop automatically)

app = FastAPI(lifespan=lifespan)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False, # Changed to False to work with allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base directory for absolute paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Create uploads directory
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# Video sources with absolute paths
video_sources = {
    "road1": os.path.join(BASE_DIR, "traffic1.mp4"),
    "road2": os.path.join(BASE_DIR, "traffic2.mp4"),
    "road3": os.path.join(BASE_DIR, "traffic3.mp4"),
}

# Load YOLO model
try:
    model_path = os.path.join(BASE_DIR, "yolov8n.pt")
    print(f"Loading YOLO model from: {model_path}")
    model = YOLO(model_path)
    print("YOLO model loaded successfully.")
except Exception as e:
    print(f"Model load error: {e}")
    model = None

# Traffic state
traffic_data = {
    "road1": {"count": 0, "car": 0, "bike": 0, "truck": 0, "signal": "RED", "emergency": False},
    "road2": {"count": 0, "car": 0, "bike": 0, "truck": 0, "signal": "RED", "emergency": False},
    "road3": {"count": 0, "car": 0, "bike": 0, "truck": 0, "signal": "RED", "emergency": False},
    "uploaded": {"count": 0, "car": 0, "bike": 0, "truck": 0, "signal": "NONE", "emergency": False, "filename": None}
}

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

def save_traffic_history():
    while True:
        db = SessionLocal()
        try:
            for road_id, data in traffic_data.items():
                history = TrafficHistory(
                    road_id=road_id,
                    vehicle_count=data["count"],
                    signal_status=data["signal"]
                )
                db.add(history)
            db.commit()
        except Exception as e:
            print(f"Error saving history: {e}")
        finally:
            db.close()
        time.sleep(10)  # Save every 10 seconds

def process_traffic_logic():
    global traffic_data
    while True:
        roads = list(traffic_data.keys())
        counts = [traffic_data[r]["count"] for r in roads]
        
        emergency_road = None
        for r in roads:
            if traffic_data[r]["emergency"]:
                emergency_road = r
                break
        
        if emergency_road:
            for r in roads:
                traffic_data[r]["signal"] = "GREEN" if r == emergency_road else "RED"
        else:
            if max(counts) == 0:
                for r in roads:
                    traffic_data[r]["signal"] = "RED"
            else:
                max_idx = counts.index(max(counts))
                for i, r in enumerate(roads):
                    if i == max_idx:
                        traffic_data[r]["signal"] = "GREEN"
                    elif counts[i] > 5:
                        traffic_data[r]["signal"] = "YELLOW"
                    else:
                        traffic_data[r]["signal"] = "RED"
        
        time.sleep(1)

# Global Frame Buffer and Stop Signals
frame_buffer = {
    "road1": None,
    "road2": None,
    "road3": None,
    "uploaded": None
}
last_detections = {
    "road1": [],
    "road2": [],
    "road3": [],
    "uploaded": []
}
upload_stop_signal = threading.Event()

def video_worker(road_id: str):
    """Background thread to process video frames and update global state"""
    global traffic_data, frame_buffer, last_detections
    
    source = video_sources.get(road_id)
    print(f"Starting video worker for {road_id} using source: {source}")
    
    if road_id == "uploaded":
        return

    if not os.path.exists(source):
        print(f"CRITICAL ERROR: Video file not found at {source}")
        return

    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        print(f"Error: Could not open video source {source}")
        return

    frame_count = 0
    while True:
        success, frame = cap.read()
        if not success:
            cap.release()
            cap = cv2.VideoCapture(source)
            continue

        frame_count += 1
        frame = cv2.resize(frame, (640, 480))
        
        # Inference every 5 frames
        if frame_count % 5 == 0 and model is not None:
            try:
                results = model(frame, verbose=False, conf=0.3)
                count = 0
                car_count = 0
                bike_count = 0
                truck_count = 0
                emergency = False
                current_boxes = []

                for r in results:
                    for box in r.boxes:
                        cls = int(box.cls[0])
                        # car(2), motorcycle(3), bus(5), truck(7)
                        if cls in [2, 3, 5, 7]:
                            count += 1
                            if cls == 2: car_count += 1
                            elif cls == 3: bike_count += 1
                            elif cls == 5: truck_count += 1 # Counting bus as truck for simplicity or keep separate if needed
                            elif cls == 7: 
                                truck_count += 1
                                if box.conf[0] > 0.8:
                                    emergency = True
                            
                            x1, y1, x2, y2 = map(int, box.xyxy[0])
                            conf = float(box.conf[0])
                            current_boxes.append({'box': (x1, y1, x2, y2), 'cls': cls, 'conf': conf})
                
                last_detections[road_id] = current_boxes
                traffic_data[road_id]["count"] = count
                traffic_data[road_id]["car"] = car_count
                traffic_data[road_id]["bike"] = bike_count
                traffic_data[road_id]["truck"] = truck_count
                traffic_data[road_id]["emergency"] = emergency
            except Exception as e:
                print(f"Inference error on {road_id}: {e}")

        # Draw persistent boxes
        for det in last_detections[road_id]:
            x1, y1, x2, y2 = det['box']
            cls = det['cls']
            color = (0, 255, 0) if cls == 2 else (255, 255, 0) # Car: Green, Bike: Cyan/Yellowish
            if cls in [5, 7]: color = (0, 0, 255) # Truck/Bus: Red
            
            label = "CAR" if cls == 2 else "BIKE" if cls == 3 else "TRUCK" if cls == 7 else "BUS"
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, f"{label} {det['conf']:.2f}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

        # UI Overlay
        signal = traffic_data[road_id]["signal"]
        sig_color = (0, 255, 0) if signal == "GREEN" else (0, 255, 255) if signal == "YELLOW" else (0, 0, 255)
        cv2.rectangle(frame, (10, 10), (320, 110), (0, 0, 0), -1)
        cv2.putText(frame, f"NODE: {road_id.upper()}", (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.putText(frame, f"TOTAL: {traffic_data[road_id]['count']}", (20, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.6, sig_color, 2)
        cv2.putText(frame, f"C:{traffic_data[road_id]['car']} B:{traffic_data[road_id]['bike']} T:{traffic_data[road_id]['truck']}", (20, 95), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

        _, buffer = cv2.imencode('.jpg', frame)
        frame_buffer[road_id] = buffer.tobytes()
        time.sleep(0.03)

def uploaded_video_worker():
    """Special worker for uploaded video that stops when video ends or new upload arrives"""
    global traffic_data, frame_buffer, upload_stop_signal, last_detections
    
    while True:
        filename = traffic_data["uploaded"]["filename"]
        if filename:
            upload_stop_signal.clear()
            file_path = os.path.join(UPLOAD_DIR, filename)
            cap = cv2.VideoCapture(file_path)
            
            if not cap.isOpened():
                print(f"Error opening uploaded video: {file_path}")
                traffic_data["uploaded"]["filename"] = None
                time.sleep(1)
                continue

            frame_count = 0
            while cap.isOpened() and not upload_stop_signal.is_set():
                if not traffic_data["uploaded"]["filename"]:
                    break

                success, frame = cap.read()
                if not success:
                    break 

                frame_count += 1
                frame = cv2.resize(frame, (640, 480))
                
                if frame_count % 5 == 0 and model is not None:
                    try:
                        results = model(frame, verbose=False, conf=0.3)
                        count = 0
                        car_count = 0
                        bike_count = 0
                        truck_count = 0
                        current_boxes = []

                        for r in results:
                            for box in r.boxes:
                                cls = int(box.cls[0])
                                if cls in [2, 3, 5, 7]:
                                    count += 1
                                    if cls == 2: car_count += 1
                                    elif cls == 3: bike_count += 1
                                    elif cls in [5, 7]: truck_count += 1
                                    
                                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                                    conf = float(box.conf[0])
                                    current_boxes.append({'box': (x1, y1, x2, y2), 'cls': cls, 'conf': conf})
                        
                        last_detections["uploaded"] = current_boxes
                        traffic_data["uploaded"]["count"] = count
                        traffic_data["uploaded"]["car"] = car_count
                        traffic_data["uploaded"]["bike"] = bike_count
                        traffic_data["uploaded"]["truck"] = truck_count
                    except: pass

                # Draw persistent boxes
                for det in last_detections["uploaded"]:
                    x1, y1, x2, y2 = det['box']
                    cls = det['cls']
                    color = (0, 255, 0) if cls == 2 else (255, 255, 0)
                    if cls in [5, 7]: color = (0, 0, 255)
                    label = "CAR" if cls == 2 else "BIKE" if cls == 3 else "TRUCK"
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                    cv2.putText(frame, f"{label} {det['conf']:.2f}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

                # UI Overlay
                cv2.rectangle(frame, (10, 10), (320, 110), (0, 0, 0), -1)
                cv2.putText(frame, "NODE: UPLOADED", (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                cv2.putText(frame, f"TOTAL: {traffic_data['uploaded']['count']}", (20, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                cv2.putText(frame, f"C:{traffic_data['uploaded']['car']} B:{traffic_data['uploaded']['bike']} T:{traffic_data['uploaded']['truck']}", (20, 95), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

                _, buffer = cv2.imencode('.jpg', frame)
                frame_buffer["uploaded"] = buffer.tobytes()
                time.sleep(0.03)
            
            cap.release()
            if not upload_stop_signal.is_set() and traffic_data["uploaded"]["filename"]:
                print(f"Finished processing: {filename}")
                time.sleep(2)
            else:
                frame_buffer["uploaded"] = None
                last_detections["uploaded"] = []
                print(f"Stopped processing: {filename}")
        
        time.sleep(0.5)

async def get_video_stream(road_id: str):
    """Async generator for streaming frames from buffer"""
    while True:
        if frame_buffer.get(road_id) is not None:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_buffer[road_id] + b'\r\n')
        else:
            await asyncio.sleep(0.1)
            continue
        await asyncio.sleep(0.04)

@app.post("/upload")
def upload_video(file: UploadFile = File(...)):
    global upload_stop_signal, traffic_data, frame_buffer, last_detections
    print(f"Received upload request for file: {file.filename}")
    try:
        # 1. Signal stop and clear buffers
        upload_stop_signal.set()
        frame_buffer["uploaded"] = None
        last_detections["uploaded"] = []
        traffic_data["uploaded"]["filename"] = None # Temporarily clear to stop worker
        
        # 2. Wait for worker to acknowledge stop
        time.sleep(0.5) 
        upload_stop_signal.clear()
        
        # 3. Save new file
        if not os.path.exists(UPLOAD_DIR):
            os.makedirs(UPLOAD_DIR)
            
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        print(f"Saving file to: {file_path}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 4. Set new state to trigger worker
        traffic_data["uploaded"]["filename"] = file.filename
        traffic_data["uploaded"]["count"] = 0
        
        print(f"New video uploaded and ready: {file.filename}")
        return JSONResponse(content={"message": "File uploaded successfully", "filename": file.filename})
    except Exception as e:
        print(f"Upload error: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/reset-upload")
async def reset_upload():
    global traffic_data, frame_buffer, upload_stop_signal, last_detections
    upload_stop_signal.set()
    traffic_data["uploaded"] = {"count": 0, "car": 0, "bike": 0, "truck": 0, "signal": "NONE", "emergency": False, "filename": None}
    frame_buffer["uploaded"] = None
    last_detections["uploaded"] = []
    return {"message": "Upload state reset"}

@app.get("/video-feed/{road_id}")
async def video_feed(road_id: str):
    if road_id not in traffic_data:
        return {"error": "Invalid road ID"}
    return StreamingResponse(get_video_stream(road_id), 
                             media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.datetime.now().isoformat()}

@app.get("/traffic-data")
async def get_traffic_data():
    return traffic_data

@app.get("/history")
async def get_history(db: Session = Depends(get_db)):
    # Get last 20 records for each node
    nodes = ["road1", "road2", "road3", "uploaded"]
    result = {}
    for node in nodes:
        history = db.query(TrafficHistory).filter(TrafficHistory.road_id == node).order_by(TrafficHistory.timestamp.desc()).limit(20).all()
        result[node] = [{"count": h.vehicle_count, "time": h.timestamp.strftime("%H:%M:%S")} for h in reversed(history)]
    return result

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.send_text(json.dumps(traffic_data))
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
