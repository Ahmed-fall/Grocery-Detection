# 🛒 Egyptian Market Automated Checkout Engine

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg)](https://fastapi.tiangolo.com/)
[![ONNX Runtime](https://img.shields.io/badge/ONNX_Runtime-FP16-blueviolet.svg)](https://onnxruntime.ai/)
[![Next.js](https://img.shields.io/badge/Next.js-React_18-black.svg)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg)](https://supabase.com/)

An enterprise-grade, edge-optimized computer vision self-checkout platform designed specifically for the regional landscape of the Egyptian retail sector. The system replaces manual barcode scanning by detecting, classifying, and pricing multiple consumer items simultaneously from a single camera frame.

---

## 📖 System Architecture & Engineering Matrix

The system uses a completely decoupled multi-tier architecture partitioned into three core microservices:

* **The Vision Inference Core:** Built on a customized **YOLOv8 Small** topology optimized via Post-Training Quantization (PTQ) into an **FP16 ONNX Computational Graph**, reducing memory overhead by ~50% and executing microsecond inferences on standard CPU hardware.
* **The Asynchronous API Gateway (FastAPI):** Implements an upfront lifespan lifecycle constraint to pre-load the ONNX matrix into memory space exactly once at server boot, eliminating heavy disk I/O runtime locks. It communicates using Base64-encoded JSON strings to prevent multi-part boundary parsing bottlenecks.
* **The Reactive UI (Next.js):** Deployed on Vercel edge infrastructure, utilizing local browser hardware to render high-frame-rate web feeds while implementing **Frame Sampling loops** (~3 FPS) to safeguard cloud resources against processing spikes.
* **The Persistent Data Tier (Supabase):** Driven by PostgreSQL to cache transactional lookup profiles in backend memory spaces at initialization while offloading live coordinate logs to out-of-band background task threads.

---

## 🛠️ Complete Technical Directory

A clean file structure ensures complete separation of concerns between your Data Science pipeline, your Inference Backend, and your Reactive Frontend. Maintain this setup within your cloned workspace:

```text
Grocery-Detection/
├── .github/
│   └── workflows/                # CI/CD deployment logic
├── backend/
│   ├── model/
│   │   └── best.onnx            # Quantized FP16 ONNX model file
│   ├── .env                     # Supabase backend credentials
│   ├── inference.py             # YOLOv8 Engine & dynamic precision parser
│   ├── main.py                  # FastAPI lifespan controller & validation schemas
│   └── inference_requirements.txt # Production-frozen python packages
├── frontend/
│   ├── .env.local               # Frontend environment endpoints
│   ├── package.json
│   └── src/                     # React Components & webcam sampling loops
├── notebook/
│   ├── Depi_Grad.ipynb          # Comprehensive training notebook
│   └── schema.sql               # Database topology execution scripts
└── README.md
🚀 End-to-End Local Setup GuideFollow these sequential steps to configure, integrate, and spin up the complete end-to-end platform on your local device.PrerequisitesPython 3.10 or higherNode.js 18 or higherA free, active account on Supabase Console.Step 1: Database Topology Configuration (Supabase)Create a brand-new project in your Supabase Dashboard.Navigate to the SQL Editor tab from the left sidebar panel.Paste and run the following setup script to configure the relational structure, primary keys, relational data loops, and localized language configurations:SQL-- ========================================================
-- 1. Create the Consolidated Products Catalog
-- ========================================================
CREATE TABLE public.products (
  class_id integer NOT NULL,
  name_en character varying(255) NOT NULL,
  name_ar character varying(255) NOT NULL,
  base_price numeric(10, 2) NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (class_id),
  CONSTRAINT products_base_price_check CHECK (base_price >= 0.0),
  CONSTRAINT products_class_id_check CHECK (class_id >= 0 AND class_id <= 16)
);

-- ========================================================
-- 2. Populate the 17 Rigid Structural Model Classes
-- ========================================================
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
    (16, 'Tiger Chips Chili Lemon', 'شيبسي تايجر شطة وليمون', 10.00)
ON CONFLICT (class_id) DO UPDATE SET 
    name_en = EXCLUDED.name_en, 
    name_ar = EXCLUDED.name_ar, 
    base_price = EXCLUDED.base_price;

-- ========================================================
-- 3. Create Out-of-Band Analytical Telemetry Storage
-- ========================================================
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
Step 2: Backend API Gateway InstallationNavigate to the backend service folder from your shell directory terminal:Bashcd backend
Set up a secure python isolate wrapper and activate it:Bashpython -m venv venv
# On macOS/Linux:
source venv/bin/activate
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
Update standard package tools and resolve core packages from the production requirement freeze:Bashpip install --upgrade pip
pip install -r inference_requirements.txt
Build a .env configuration template file inside the root of your backend/ directory:Code snippetSUPABASE_URL="[https://your-database-reference-id.supabase.co](https://your-database-reference-id.supabase.co)"
SUPABASE_KEY="your-highly-secure-anon-public-or-service-role-jwt-key"
Ensure your compiled best.onnx optimized computer vision graph is safely inside the backend/model/ directory path.Fire up the local Uvicorn deployment engine loop:Bashuvicorn main:app --host 0.0.0.0 --port 8000 --reload
💡 Developer Verification: Open your browser and navigate to http://localhost:8000/api/v1/docs to test runtime connections and access the self-generating FastAPI OpenAPI/Swagger documentation dashboard.Step 3: Frontend Interface LaunchOpen an independent secondary shell workspace window and navigate to the frontend folder directory:Bashcd frontend
Direct node packages setup according to standard project locking criteria:Bashnpm install
Build a local environment variables file .env.local to point directly to your backend service gateway instance:Code snippetNEXT_PUBLIC_API_URL="http://localhost:8000/api/v1"
Start the interactive interface development application engine:Bashnpm run dev
Launch your preferred web browser tracking link directly into http://localhost:3000. Grant system hardware webcam canvas tracking permissions to test edge frame streaming results.📡 API Payload Schema ArchitectureVisual Inference Stream EndpointURL Context Matrix: POST /api/v1/detectContent-Type Protocol: application/jsonProduction Structural Client Request ObjectJSON{
  "image_base64": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwsJDREQDg8QEBAQCgwSExIQEw8QEBD/yQALCAHgAoABAREA..."
}
Analytical Core System Response ModelJSON{
  "status": "success",
  "inference_metrics": {
    "processing_latency_ms": 24.62,
    "total_objects_present": 2
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
    },
    {
      "class_id": 4,
      "label_english": "Juhayna Milk",
      "label_arabic": "حليب جهينة",
      "unit_retail_price_egp": 35.00,
      "confidence": 0.9104,
      "bounding_box_normalized": {
        "x_min": 0.5124,
        "y_min": 0.2104,
        "x_max": 0.8912,
        "y_max": 0.9145
      }
    }
  ]
}
🧠 Data Science & Quantization FrameworkTo inspect or reproduce the machine learning optimization logic executed in Phase 1, access the workspace inside the /notebook/ folder directory path:Open Depi_Grad.ipynb via Google Colab or your local Jupyter environment.The code covers the continuous engineering matrix:Data Aggregation and Class Stabilization: Pruning weak contextual inputs down to a strict, continuous range of 17 foundational classes (0-16).Neural Network Training Tuning: Hyperparameter optimization using Mosaic and Mixup data augmentation techniques via Ultralytics YOLOv8.Post-Training Quantization (PTQ): Compiling PyTorch FP32 matrix weights into an FP16 ONNX execution pipeline.Mathematical Parity Assertions: Enforcing spatial testing across validation batches to ensure sub-pixel box deviations stayed within strict tolerances ($<0.07$ pixels).🔒 License and AttributionThis repository is configured as an engineering graduation capstone deliverable. Code modifications and architecture distributions are governed under standard permissive guidelines. For structural dependencies or architectural extension inquiries, check the main repository index tracker at Ahmed-fall/Grocery-Detection.
