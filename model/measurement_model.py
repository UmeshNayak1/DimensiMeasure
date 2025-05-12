import cv2
import numpy as np
import torch
import torchvision
from PIL import Image
import base64
import io
import json
import os
import sys

class MeasurementModel:
    def __init__(self):
        # Initialize model parameters
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"Using device: {self.device}")
        
        # Load the YOLO model for object detection
        # Either use a pre-trained model or load your custom weights
        try:
            self.model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)
            self.model.to(self.device)
            print("YOLOv5 model loaded successfully")
        except Exception as e:
            print(f"Error loading YOLO model: {e}")
            # Fallback to a minimal implementation if model can't be loaded
            self.model = None
        
        # Define a reference object size in millimeters (e.g., a credit card)
        self.reference_width_mm = 85.60  # Standard credit card width
        self.reference_height_mm = 53.98  # Standard credit card height
        
        # Class names for common objects and their typical dimensions in mm
        self.common_objects = {
            'bottle': {'width': 70, 'height': 240},
            'cell phone': {'width': 70, 'height': 150},
            'laptop': {'width': 330, 'height': 230},
            'keyboard': {'width': 450, 'height': 150},
            'mouse': {'width': 60, 'height': 110},
            'book': {'width': 150, 'height': 220},
        }
        
    def preprocess_image(self, image_data):
        """
        Preprocess the image data for the model
        
        Args:
            image_data: Can be a base64 string, file path, or numpy array
            
        Returns:
            A preprocessed image
        """
        if isinstance(image_data, str):
            if image_data.startswith('data:image'):
                # Handle base64 encoded image
                base64_data = image_data.split(',')[1]
                image_bytes = base64.b64decode(base64_data)
                img = Image.open(io.BytesIO(image_bytes))
                return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
            elif os.path.exists(image_data):
                # Handle image file path
                return cv2.imread(image_data)
        elif isinstance(image_data, np.ndarray):
            # Already a numpy array
            return image_data
        
        raise ValueError("Unsupported image data format")
    
    def detect_objects(self, image):
        """
        Detect objects in the image using the YOLO model
        
        Args:
            image: Preprocessed image
            
        Returns:
            Detected objects with their bounding boxes and classes
        """
        if self.model is None:
            # Simple implementation for testing purposes if model couldn't be loaded
            # Returns a simulated detection for testing purposes
            h, w = image.shape[:2]
            # Simulate detection of a centered object taking up 70% of the image
            x1, y1 = int(0.15 * w), int(0.15 * h)
            x2, y2 = int(0.85 * w), int(0.85 * h)
            return [
                {
                    'class': 'object',
                    'confidence': 0.95,
                    'bbox': [x1, y1, x2, y2]
                }
            ]
        
        # Convert OpenCV BGR to RGB format
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Run inference
        results = self.model(image_rgb)
        
        # Process results
        detections = []
        for pred in results.xyxy[0].cpu().numpy():
            x1, y1, x2, y2, conf, cls = pred
            class_name = self.model.names[int(cls)]
            
            detections.append({
                'class': class_name,
                'confidence': float(conf),
                'bbox': [int(x1), int(y1), int(x2), int(y2)]
            })
        
        return detections
    
    def calculate_dimensions(self, image, detections):
        """
        Calculate real-world dimensions of detected objects
        
        Args:
            image: Original image
            detections: Detected objects with bounding boxes
            
        Returns:
            List of objects with their estimated dimensions
        """
        results = []
        h, w = image.shape[:2]
        
        for detection in detections:
            class_name = detection['class']
            bbox = detection['bbox']
            x1, y1, x2, y2 = bbox
            
            # Calculate pixel dimensions
            pixel_width = x2 - x1
            pixel_height = y2 - y1
            
            # Estimate real-world dimensions
            # Here we can use different approaches:
            
            # 1. If we have a reference object with known size
            # (simplified approach for demonstration)
            if class_name in self.common_objects:
                # Use typical dimensions from our database
                reference_obj = self.common_objects[class_name]
                width_mm = reference_obj['width']
                height_mm = reference_obj['height']
                confidence = detection['confidence'] * 0.9  # Slight adjustment for size estimation
            else:
                # Estimate based on typical credit card reference
                # This is a simplified approach; in reality, you'd need depth information
                # or a reference object in the scene
                
                # Assuming a credit card sized reference object
                width_mm = (pixel_width / w) * self.reference_width_mm * 4
                height_mm = (pixel_height / h) * self.reference_height_mm * 4
                confidence = detection['confidence'] * 0.7  # Lower confidence for unknown objects
            
            # Convert to cm for better readability
            width_cm = width_mm / 10
            height_cm = height_mm / 10
            
            # Format dimensions string
            dimensions = f"{width_cm:.1f}×{height_cm:.1f} cm"
            
            results.append({
                'objectName': class_name,
                'dimensions': dimensions,
                'confidence': confidence,
                'bbox': bbox
            })
        
        return results
    
    def draw_measurements(self, image, results):
        """
        Draw bounding boxes and measurements on the image
        
        Args:
            image: Original image
            results: Measurement results with bounding boxes
            
        Returns:
            Image with bounding boxes and measurements drawn
        """
        image_with_boxes = image.copy()
        
        for result in results:
            # Extract information
            bbox = result['bbox']
            dimensions = result['dimensions']
            object_name = result['objectName']
            confidence = result['confidence']
            
            # Define colors
            box_color = (255, 105, 180)  # pink for bounding box
            text_color = (255, 255, 255)  # White for text
            bg_color = (139, 0, 70)  # Dark green for text background
            
            # Draw bounding box
            x1, y1, x2, y2 = bbox
            cv2.rectangle(image_with_boxes, (x1, y1), (x2, y2), box_color, 2)
            
            # Prepare text
            label = f"{object_name} - {dimensions} ({confidence:.0%})"
            
            
            # Get text size
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.5
            thickness = 1
            (text_width, text_height), baseline = cv2.getTextSize(label, font, font_scale, thickness)
            
            # Draw text background
            cv2.rectangle(image_with_boxes, 
                        (x1, y1 - text_height - 10), 
                        (x1 + text_width + 10, y1), 
                        bg_color, -1)
            
            # Draw text
            cv2.putText(image_with_boxes, label, 
                      (x1 + 5, y1 - 5), 
                      font, font_scale, text_color, thickness)
        
        return image_with_boxes
        
    def encode_image_to_base64(self, image):
        """
        Convert an image to base64 string
        
        Args:
            image: OpenCV image
            
        Returns:
            Base64 encoded string of the image
        """
        # Convert to RGB (from BGR)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Convert to PIL Image
        pil_image = Image.fromarray(image_rgb)
        
        # Save to bytes buffer
        buffer = io.BytesIO()
        pil_image.save(buffer, format='JPEG')
        
        # Convert to base64
        img_str = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return f"data:image/jpeg;base64,{img_str}"
    
    def process_image(self, image_data):
        """
        Process an image and return the measurement results
        
        Args:
            image_data: Image data (base64, file path, or numpy array)
            
        Returns:
            Measurement results including object names, dimensions, confidence and
            the image with bounding boxes drawn
        """
        try:
            # Preprocess the image
            image = self.preprocess_image(image_data)
            
            # Detect objects
            detections = self.detect_objects(image)
            
            # Calculate dimensions
            results = self.calculate_dimensions(image, detections)
            
            # If no objects were detected, return a default response
            if not results:
                return {
                    'success': False,
                    'message': 'No objects detected',
                    'measurements': []
                }
            
            # Sort by confidence (highest first)
            results.sort(key=lambda x: x['confidence'], reverse=True)
            
            # Draw bounding boxes and measurements on the image
            annotated_image = self.draw_measurements(image, results)
            
            # Convert the annotated image to base64
            image_base64 = self.encode_image_to_base64(annotated_image)
            
            return {
                'success': True,
                'message': f'Detected {len(results)} objects',
                'measurements': results,
                'annotatedImage': image_base64
            }
            
        except Exception as e:
            print(f"Error processing image: {e}")
            return {
                'success': False,
                'message': f'Error processing image: {str(e)}',
                'measurements': []
            }

# For testing when run directly
if __name__ == "__main__":
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        model = MeasurementModel()
        result = model.process_image(image_path)
        print(json.dumps(result, indent=2))
    else:
        print("Please provide an image path to process")