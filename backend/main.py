from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io

from backend.model import run_inference
from backend.lookup import get_product_info
from backend.schemas import DetectionResponse, DetectionResult, BoundingBox, ProductDescription

app = FastAPI(
    title="Grocery Detection API",
    description="Real-time Egyptian supermarket product detection",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/detect", response_model=DetectionResponse)
async def detect_products(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    
    results, elapsed_ms = run_inference(image)
    
    detections = []
    for result in results:
        for box in result.boxes:
            class_id = int(box.cls[0])
            class_name = result.names[class_id]
            confidence = float(box.conf[0])
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            
            product_info = get_product_info(class_name)
            
            detections.append(DetectionResult(
                class_name=class_name,
                confidence=round(confidence, 3),
                bounding_box=BoundingBox(x1=x1, y1=y1, x2=x2, y2=y2, confidence=confidence),
                description=ProductDescription(**product_info)
            ))
    
    return DetectionResponse(
        total_detected=len(detections),
        results=detections,
        inference_time_ms=round(elapsed_ms, 2)
    )