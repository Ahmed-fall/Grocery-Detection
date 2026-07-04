# schemas.py
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict
from typing import List
from uuid import UUID
from datetime import datetime
import re

class BoundingBox(BaseModel):
    """
    Validates normalized bounding box coordinates for YOLOv8 compliance.
    Ensures that coordinates form a non-collapsed spatial plane.
    """
    x_min: float = Field(..., description="Normalized top-left x-coordinate", ge=0.0, le=1.0)
    y_min: float = Field(..., description="Normalized top-left y-coordinate", ge=0.0, le=1.0)
    x_max: float = Field(..., description="Normalized bottom-right x-coordinate", ge=0.0, le=1.0)
    y_max: float = Field(..., description="Normalized bottom-right y-coordinate", ge=0.0, le=1.0)

    @model_validator(mode='after')
    def validate_spatial_integrity(self) -> 'BoundingBox':
        """
        Enforces geometric logic: maximum bounds must exceed minimum bounds.
        """
        if self.x_max <= self.x_min:
            raise ValueError(f"Geometric Violation: x_max ({self.x_max}) must be strictly greater than x_min ({self.x_min}).")
        if self.y_max <= self.y_min:
            raise ValueError(f"Geometric Violation: y_max ({self.y_max}) must be strictly greater than y_min ({self.y_min}).")
        return self

class DetectionItem(BaseModel):
    """
    Represents a singular, verified object instance localized within a frame.
    """
    class_id: int = Field(..., description="Pruned class identifier mapped to topology", ge=0, le=28)
    name_en: str = Field(..., min_length=2, max_length=100)
    name_ar: str = Field(..., min_length=2, max_length=100)
    confidence_score: float = Field(..., description="Model localization certainty", ge=0.0, le=1.0)
    bounding_box: BoundingBox
    price: float = Field(..., description="Unit retail price sourced from catalog", ge=0.0)

class InferenceRequest(BaseModel):
    """
    Validates outbound image ingestion from client devices.
    """
    image_base64: str = Field(..., description="Base64 encoded string representation of the raw image matrix")

    @field_validator('image_base64')
    @classmethod
    def validate_base64_payload(cls, value: str) -> str:
        """
        Sanitizes data URI schemas and validates string structure prior to decoding.
        """
        if value.startswith("data:"):
            prefix_match = re.match(r"^data:image\/(png|jpeg|jpg|webp);base64,", value)
            if prefix_match:
                value = value[len(prefix_match.group(0)):]
            else:
                raise ValueError("Invalid Data URI header structure. Only JPEG, PNG, and WEBP content formats are supported.")
        
        cleaned_value = value.strip()
        if not re.match(r'^[A-Za-z0-9+/]+={0,2}$', cleaned_value):
            raise ValueError("Payload failure: String is not a valid base64-encoded sequence.")
            
        return cleaned_value

class InferenceResponse(BaseModel):
    """
    Standardized structural response container for client application synchronization.
    """
    session_id: UUID = Field(..., description="Cryptographically unique tracking identifier generated per scan execution")
    timestamp: datetime = Field(..., description="ISO-8601 compliant UTC timestamp of database persist event")
    inference_time_ms: float = Field(..., description="Compute latency elapsed inside the ONNX execution runtime")
    total_detections: int = Field(..., description="Count of parsed object nodes after non-maximum suppression step", ge=0)
    detections: List[DetectionItem] = Field(default_factory=list, description="Array containing itemized localization and entity payload properties")

class CatalogItem(BaseModel):
    """
    Data validation schema for outbound product configurations using strict Pydantic v2 setup.
    """
    class_id: int = Field(..., ge=0, le=28)
    name_en: str
    name_ar: str
    base_price: float

    # Standardized Pydantic v2 configuration layout
    model_config = ConfigDict(from_attributes=True)

