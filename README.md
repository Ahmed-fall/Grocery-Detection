# 🛒 Egyptian Market Automated Checkout Engine

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg)](https://fastapi.tiangolo.com/)
[![ONNX Runtime](https://img.shields.io/badge/ONNX_Runtime-FP16-blueviolet.svg)](https://onnxruntime.ai/)
[![Next.js](https://img.shields.io/badge/Next.js-React_18-black.svg)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg)](https://supabase.com/)

An enterprise-grade, edge-optimized computer vision self-checkout platform designed specifically for the Egyptian retail sector. This system replaces manual barcode scanning by detecting, classifying, and pricing multiple consumer items simultaneously from a single camera frame.

---

## 📖 System Architecture

The platform is decoupled into three primary microservices to ensure scalability, low latency, and separation of concerns.

| Component | Technology | Engineering Purpose |
| :--- | :--- | :--- |
| **Vision AI Engine** | YOLOv8s / ONNX | Optimized via Post-Training Quantization (PTQ) into an FP16 ONNX graph. Reduces memory overhead by 50% for microsecond CPU inferences. |
| **API Gateway** | FastAPI / Python | Implements an asynchronous lifespan controller to pre-load the ONNX matrix into RAM exactly once at boot, eliminating disk I/O bottlenecks. |
| **Reactive UI** | Next.js / Vercel | Renders high-frame-rate web feeds while enforcing frame-sampling (3 FPS) to safeguard cloud infrastructure against payload spikes. |
| **Data Tier** | Supabase / PostgreSQL | Caches transactional lookup profiles in backend memory and offloads real-time coordinate logs to out-of-band background task threads. |

---

## 🛠️ Repository Directory Structure

```text
Grocery-Detection/
├── backend/
│   ├── model/
│   │   └── best.onnx                  # Quantized FP16 ONNX model file
│   ├── .env                           # Supabase backend credentials
│   ├── inference.py                   # YOLOv8 Engine & dynamic precision parser
│   ├── main.py                        # FastAPI lifespan controller & validation schemas
│   └── inference_requirements.txt     # Production-frozen python packages
├── frontend/
│   ├── .env.local                     # Frontend environment endpoints
│   ├── package.json                   # Node dependencies
│   └── src/                           # React Components & webcam sampling loops
├── notebook/
│   └── Depi_Grad.ipynb                # Comprehensive AI training & quantization notebook
└── README.md
🚀 End-to-End Local Setup Guide
Follow these sequential steps to configure, integrate, and deploy the complete platform locally.

1. Database Configuration (Supabase)
Create a new project in your Supabase Dashboard, open the SQL Editor, and run the following script to configure the relational structure:

SQL
-- Create the Consolidated Products Catalog
CREATE TABLE public.products (
  class_id integer NOT NULL,
  name_en character varying(255) NOT NULL,
  name_ar character varying(255) NOT NULL,
  base_price numeric(10, 2) NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (class_id)
);

-- Populate the 17 Rigid Structural Model Classes
INSERT INTO public.products (class_id, name_en, name_ar, base_price) VALUES
    (0, 'California Garden Beans', 'فول حدائق كاليفورنيا', 25.00),
    (1, 'Hohos Cake', 'كيك هوهوز', 5.00),
    (2, 'Lifebuoy Soap', 'صابون لايف بوي', 15.00),
    (3, 'Maxtella Chocolate', 'شوكولاتة ماكس تيلا', 60.00),
    (4, 'Juhayna Milk', 'حليب جهينة', 35.00),
    (5, 'Nescafe Gold Coffee', 'نسكافيه جولد', 150.00),
    (6, 'PLYMS Tuna Can', 'تونة بليمز', 45.00),
    (7, 'Pantene Oil Replacement', 'بديل الزيت بانتين', 80.00),
    (8, 'RedBull Energy Drink', 'ريد بول', 40.00),
    (9, 'Rhodes Cheese Feta', 'جبنة رودس فيتا', 30.00),
    (10, 'Supermi Indomie Noodles', 'إندومي سوبرمي', 10.00),
    (11, 'Zabado Yogurt Drink', 'زبادو زبادي خلاط', 15.00),
    (12, 'Bless Hair Conditioner', 'بلسم بليس للشعر', 70.00),
    (13, 'Cadbury Dairy Milk Chocolate', 'شوكولاتة كادبوري', 25.00),
    (14, 'Herbal Essences Conditioner', 'بلسم هيربال إيسنسز', 85.00),
    (15, 'Oreo Original Biscuit', 'بسكويت أوريو الأصلي', 10.00),
    (16, 'Tiger Chips Chili Lemon', 'شيبسي تايجر شطة وليمون', 10.00);

-- Create Out-of-Band Analytical Telemetry Storage
CREATE TABLE public.scan_sessions (
    session_id uuid PRIMARY KEY,
    timestamp text NOT NULL,
    inference_time_ms float NOT NULL,
    total_items_detected integer NOT NULL
);

CREATE TABLE public.detection_events (
    id serial PRIMARY KEY,
    session_id uuid REFERENCES public.scan_sessions(session_id) ON DELETE CASCADE,
    class_id integer NOT NULL,
    confidence_score float NOT NULL,
    bounding_box jsonb NOT NULL
);
2. Backend API Gateway Installation
Open a terminal, navigate to the backend directory, and set up your Python environment:

Bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\Activate.ps1
pip install -r inference_requirements.txt
Create a .env configuration file inside the backend directory:

Code snippet
SUPABASE_URL="[https://your-database-reference-id.supabase.co](https://your-database-reference-id.supabase.co)"
SUPABASE_KEY="your-anon-public-jwt-key"
Start the local Uvicorn deployment engine:

Bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
Note: Access the automated OpenAPI/Swagger dashboard at http://localhost:8000/api/v1/docs.

3. Frontend Interface Launch
Open a new terminal window, navigate to the frontend directory, and install dependencies:

Bash
cd frontend
npm install
Create a .env.local file inside the frontend directory:

Code snippet
NEXT_PUBLIC_API_URL="http://localhost:8000/api/v1"
Start the Next.js development server:

Bash
npm run dev
Note: Open http://localhost:3000 in your browser and grant webcam permissions to test the system.

📡 API Payload Schema Architecture
Visual Inference Stream Endpoint
Endpoint: POST /api/v1/detect
Content-Type: application/json

Client Request Object (JSON Base64):

JSON
{
  "image_base64": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwsJDREQDg8QEBAQCgwSExIQEw8QEBD..."
}
Core System Response Model:

JSON
{
  "status": "success",
  "inference_metrics": {
    "processing_latency_ms": 24.62,
    "total_objects_present": 1
  },
  "detections": [
    {
      "class_id": 15,
      "label_english": "Oreo Original Biscuit",
      "label_arabic": "بسكويت أوريو الأصلي",
      "unit_retail_price_egp": 10.00,
      "confidence": 0.9412,
      "bounding_box_normalized": {
        "x_min": 0.1245,
        "y_min": 0.3412,
        "x_max": 0.4581,
        "y_max": 0.7811
      }
    }
  ]
}
🧠 Data Science & Quantization Framework
To inspect or reproduce the machine learning optimization logic executed in Phase 1, access Depi_Grad.ipynb inside the /notebook/ folder. The notebook covers:

Pruning weak contextual inputs down to a strict, continuous range of 17 foundational classes.

Hyperparameter optimization using Mosaic and Mixup data augmentation techniques via Ultralytics YOLOv8.

Compiling PyTorch FP32 matrix weights into an FP16 ONNX execution pipeline.

Enforcing spatial testing across validation batches to ensure sub-pixel box deviations stayed within strict tolerances (less than 0.07 pixels).
