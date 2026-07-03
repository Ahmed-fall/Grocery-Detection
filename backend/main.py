# main.py
import os
import time
from uuid import uuid4
from datetime import datetime, timezone
from typing import List
from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

from database import init_db, get_db, AsyncClient
from schemas import InferenceRequest, InferenceResponse, DetectionItem, BoundingBox, CatalogItem
from inference import YOLOv8Engine

# Initialize standardized systems logger
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Global memory caches for performance tuning
CLASS_METADATA_CACHE = {}
inference_engine: YOLOv8Engine = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Asynchronous lifecycle manager. 
    Handles DB initialization, memory caching, and ONNX model loading on startup.
    Ensures clean memory teardown on shutdown.
    """
    global inference_engine
    
    # --- STARTUP LOGIC ---
    try:
        await init_db()
        db = await get_db()
    except Exception as e:
        logger.critical(f"Database Engine Failure: Lifespan process aborted. Trace: {str(e)}")
        raise RuntimeError("Failed to establish non-blocking connection to database.")

    try:
        response = await db.table("products").select("*").execute()
        for item in response.data:
            CLASS_METADATA_CACHE[int(item['class_id'])] = {
                "name_en": item['name_en'],
                "name_ar": item['name_ar'],
                "price": float(item['base_price'])
            }
        logger.info(f"System State: Warmed memory cache with {len(CLASS_METADATA_CACHE)} product matrices.")
    except Exception as e:
        logger.error(f"Catalog Caching Fault: Slower fallbacks will apply. Error: {str(e)}")

    model_path = os.getenv("ONNX_MODEL_PATH", "./best.onnx")
    if not os.path.exists(model_path):
        logger.warning(f"ONNX Weights Matrix missing at path: '{model_path}'. Running mock fallback modes.")
    else:
        try:
            inference_engine = YOLOv8Engine(model_path=model_path, conf_threshold=0.45, iou_threshold=0.40)
            logger.info("ONNX Graph successfully mapped into memory space.")
        except Exception as e:
            logger.error(f"Failed to allocate memory array space for ONNX Session execution: {str(e)}")

    # Yield control to FastAPI to start accepting requests
    yield
    
    # --- SHUTDOWN LOGIC ---
    logger.info("Initiating system shutdown. Clearing memory caches...")
    CLASS_METADATA_CACHE.clear()
    inference_engine = None

# Instantiation of FastAPI app with modernized lifespan
app = FastAPI(
    title="Egyptian Market Automated Checkout & Recognition Engine",
    version="1.0.0",
    docs_url="/api/v1/docs",
    lifespan=lifespan
)

# Enforce strict CORS parameters for safe front-end application access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def persist_telemetry_async(session_id: str, timestamp_iso: str, duration: float, detections: List[dict]):
    """
    Asynchronous persistent worker designed to write bounding box spatial fields 
    and transaction telemetry metrics to Supabase tables out-of-band.
    """
    try:
        db = await get_db()
        
        await db.table("scan_sessions").insert({
            "session_id": session_id,
            "timestamp": timestamp_iso,
            "inference_time_ms": duration,
            "total_items_detected": len(detections)
        }).execute()
        
        if detections:
            bulk_events = [
                {
                    "session_id": session_id,
                    "class_id": item['class_id'],
                    "confidence_score": item['confidence'],
                    "bounding_box": {
                        "x_min": item['box'][0],
                        "y_min": item['box'][1],
                        "x_max": item['box'][2],
                        "y_max": item['box'][3]
                    }
                } for item in detections
            ]
            await db.table("detection_events").insert(bulk_events).execute()
            
        logger.info(f"Telemetry Worker: Successfully offloaded tracking log metrics for Session {session_id}")
    except Exception as e:
        logger.error(f"Telemetry Worker Fault: Out-of-band storage operation failed: {str(e)}")

@app.get("/health", status_code=status.HTTP_200_OK)
async def api_health_pulse():
    return {
        "status": "operational",
        "timestamp": datetime.now(timezone.utc),
        "onnx_loaded": inference_engine is not None
    }

@app.get("/api/v1/products", response_model=List[CatalogItem])
async def get_synchronized_catalog(db: AsyncClient = Depends(get_db)):
    try:
        response = await db.table("products").select("*").execute()
        return response.data
    except Exception as e:
        logger.error(f"API Catalog Resolution Exception: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal processing error querying catalog properties.")

@app.post("/api/v1/detect", response_model=InferenceResponse, status_code=status.HTTP_200_OK)
async def process_frame_inference(
    payload: InferenceRequest, 
    background_tasks: BackgroundTasks, 
    db: AsyncClient = Depends(get_db)
):
    start_compute_tick = time.time()
    
    raw_detections = []
    if inference_engine is not None:
        try:
            raw_detections = inference_engine.infer(payload.image_base64)
        except Exception as engine_err:
            logger.error(f"ONNX Graphics Processor Core Trap Exception: {str(engine_err)}")
            raise HTTPException(status_code=422, detail="Failed to run spatial inference pipeline on current image format.")
    else:
        logger.warning("Engine Uninitialized. Yielding system mock response arrays.")
        raw_detections = [([0.10, 0.15, 0.40, 0.55], 0.88, 8)]
    
    elapsed_inference_ms = (time.time() - start_compute_tick) * 1000
    
    session_uuid = uuid4()
    current_time_obj = datetime.now(timezone.utc)
    utc_timestamp_iso = current_time_obj.isoformat()
    
    structured_detections = []
    worker_telemetry_payload = []
    
    for box, confidence, cid in raw_detections:
        if cid not in CLASS_METADATA_CACHE:
            logger.warning(f"Anomaly Detected: Model localized Class ID [{cid}], which is missing from global configurations.")
            continue
            
        metadata = CLASS_METADATA_CACHE[cid]
        
        item_node = DetectionItem(
            class_id=cid,
            name_en=metadata['name_en'],
            name_ar=metadata['name_ar'],
            confidence_score=confidence,
            bounding_box=BoundingBox(x_min=box[0], y_min=box[1], x_max=box[2], y_max=box[3]),
            price=metadata['price']
        )
        structured_detections.append(item_node)
        
        worker_telemetry_payload.append({
            "class_id": cid,
            "confidence": confidence,
            "box": box
        })

    background_tasks.add_task(
        persist_telemetry_async,
        str(session_uuid),
        utc_timestamp_iso,
        elapsed_inference_ms,
        worker_telemetry_payload
    )

    return InferenceResponse(
        session_id=session_uuid,
        timestamp=current_time_obj,
        inference_time_ms=elapsed_inference_ms,
        total_detections=len(structured_detections),
        detections=structured_detections
    )