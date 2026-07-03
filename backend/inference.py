# inference.py
import cv2
import numpy as np
import onnxruntime as ort
import base64
from typing import List, Tuple

class YOLOv8Engine:
    def __init__(self, model_path: str, conf_threshold: float = 0.5, iou_threshold: float = 0.45):
        """
        Initializes the ONNX runtime session.
        Defaults to CPU Execution Provider. Add 'CUDAExecutionProvider' to the list 
        if deploying on a GPU-enabled server.
        """
        self.conf_threshold = conf_threshold
        self.iou_threshold = iou_threshold
        
        # Load the optimized ONNX graph
        providers = ['CPUExecutionProvider']
        self.session = ort.InferenceSession(model_path, providers=providers)
        
        # Extract dynamic graph inputs/outputs
        self.input_name = self.session.get_inputs()[0].name
        self.output_name = self.session.get_outputs()[0].name
        
        # YOLOv8 default static input topology
        self.input_shape = self.session.get_inputs()[0].shape
        self.input_height = self.input_shape[2]  # Usually 640
        self.input_width = self.input_shape[3]   # Usually 640

    def preprocess_base64(self, base64_str: str) -> np.ndarray:
        """
        Decodes a base64 string, converts it to an OpenCV matrix, resizes, 
        and normalizes the tensor to CHW layout [1, 3, 640, 640] format.
        """
        # Decode base64 to flat byte array
        img_data = base64.b64decode(base64_str)
        np_arr = np.frombuffer(img_data, np.uint8)
        
        # Decode image array into HWC format
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Failed to decode base64 string into an image matrix.")
            
        # Resize to YOLOv8 expected dimensions (640x640)
        # Note: In a true production environment with varying aspect ratios, 
        # letterboxing (padding) should be used instead of direct resizing to preserve aspect ratio.
        img_resized = cv2.resize(img, (self.input_width, self.input_height))
        
        # Convert BGR (OpenCV default) to RGB
        img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
        
        # Normalize pixel values to [0.0, 1.0] and transpose to CHW
        image_data = np.array(img_rgb) / 255.0
        image_data = np.transpose(image_data, (2, 0, 1))  # (H, W, C) -> (C, H, W)
        image_data = np.expand_dims(image_data, axis=0).astype(np.float32)
        
        return image_data

    def postprocess(self, output: np.ndarray) -> List[Tuple[List[float], float, int]]:
        """
        Parses the raw YOLOv8 [1, 21, 8400] output tensor.
        Returns a list of verified detections: ( [x_min, y_min, x_max, y_max], confidence, class_id )
        """
        # Squeeze batch dimension and transpose to [8400, 21]
        predictions = np.squeeze(output[0]).T
        
        # Extract bounding box geometries (x_center, y_center, width, height)
        boxes_xywh = predictions[:, :4]
        
        # Extract class probabilities (Cols 4 to 20 for 17 classes)
        scores_matrix = predictions[:, 4:]
        
        # Get maximum confidence score and corresponding class ID for each of the 8400 anchors
        class_ids = np.argmax(scores_matrix, axis=1)
        confidences = np.max(scores_matrix, axis=1)
        
        # Filter out anchors below the confidence threshold
        mask = confidences > self.conf_threshold
        filtered_boxes_xywh = boxes_xywh[mask]
        filtered_confidences = confidences[mask]
        filtered_class_ids = class_ids[mask]
        
        if len(filtered_boxes_xywh) == 0:
            return []

        # Convert boxes from [x_center, y_center, width, height] to [x_min, y_min, width, height]
        # This is strictly required for cv2.dnn.NMSBoxes
        boxes_xywh_for_nms = []
        for box in filtered_boxes_xywh:
            x_c, y_c, w, h = box
            boxes_xywh_for_nms.append([x_c - w / 2, y_c - h / 2, w, h])

        # Apply C++ Optimized Non-Maximum Suppression to eliminate overlapping boxes
        indices = cv2.dnn.NMSBoxes(
            boxes_xywh_for_nms, 
            filtered_confidences.tolist(), 
            self.conf_threshold, 
            self.iou_threshold
        )
        
        results = []
        if len(indices) > 0:
            for i in indices.flatten():
                # Get NMS-approved box
                x_min, y_min, w, h = boxes_xywh_for_nms[i]
                
                # Convert to Pydantic-compliant normalized coordinates [0.0, 1.0]
                norm_x_min = max(0.0, x_min / self.input_width)
                norm_y_min = max(0.0, y_min / self.input_height)
                norm_x_max = min(1.0, (x_min + w) / self.input_width)
                norm_y_max = min(1.0, (y_min + h) / self.input_height)
                
                results.append((
                    [norm_x_min, norm_y_min, norm_x_max, norm_y_max],
                    float(filtered_confidences[i]),
                    int(filtered_class_ids[i])
                ))
                
        return results

    def infer(self, base64_img: str) -> List[Tuple[List[float], float, int]]:
        """
        Executes the full pipeline: Preprocess -> ONNX Run -> Postprocess NMS
        """
        input_tensor = self.preprocess_base64(base64_img)
        
        # Execute ONNX graph
        outputs = self.session.run([self.output_name], {self.input_name: input_tensor})
        
        # Run Custom NMS logic
        return self.postprocess(outputs)