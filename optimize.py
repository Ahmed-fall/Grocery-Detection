from ultralytics import YOLO
import time
import os

pt_model_path = os.path.join("model", "best.pt")

print(f"Loading model from {pt_model_path}...")
model = YOLO(pt_model_path) 

# Export to ONNX with half-precision and simplification
print("Exporting model to ONNX...")
onnx_path = model.export(format="onnx", half=True, simplify=True)
print(f"Export successful! Optimized model saved to: {onnx_path}")

# 3. Test the speed of the newly generated ONNX model
print("Testing inference speed...")
onnx_model_path = os.path.join("model", "best.onnx")
optimized_model = YOLO(onnx_model_path)

optimized_model("https://ultralytics.com/images/bus.jpg", verbose=False)

# Time the actual inference
start_time = time.time()
results = optimized_model("https://ultralytics.com/images/bus.jpg", verbose=False)
end_time = time.time()

latency_ms = (end_time - start_time) * 1000
print("-" * 30)
print(f"Prediction Latency: {latency_ms:.2f} ms")
print("-" * 30)