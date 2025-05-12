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
        
# import cv2
# import numpy as np
# import torch
# from PIL import Image, ImageOps
# import base64
# import io
# import json
# import os
# import sys
# from ultralytics import YOLO
# from transformers import GLPNImageProcessor, GLPNForDepthEstimation

# class MeasurementModel:
#     def __init__(self):
#         self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
#         print(f"Using device: {self.device}")

#         try:
#             self.model = YOLO("yolov8n.pt")
#             print("YOLOv8n model loaded successfully")
#         except Exception as e:
#             print(f"Error loading YOLOv8n model: {e}")
#             self.model = None

#         try:
#             self.processor = GLPNImageProcessor.from_pretrained("vinvino02/glpn-nyu")
#             self.glpn = GLPNForDepthEstimation.from_pretrained("vinvino02/glpn-nyu").to(self.device)
#             self.glpn.eval()
#             print("GLPN model loaded successfully")
#         except Exception as e:
#             print(f"Error loading GLPN: {e}")
#             self.glpn = None

#         self.IMAGE_WIDTH_PIXELS = 1280
#         self.IMAGE_HEIGHT_PIXELS = 720
#         self.FOCAL_LENGTH_MM = 3.5
#         self.SENSOR_WIDTH_MM = 3.6
#         self.SENSOR_HEIGHT_MM = 2.7

#         self.HFOV_rad = 2 * np.arctan((self.SENSOR_WIDTH_MM / 2) / self.FOCAL_LENGTH_MM)
#         self.VFOV_rad = 2 * np.arctan((self.SENSOR_HEIGHT_MM / 2) / self.FOCAL_LENGTH_MM)
#         self.HFOV_deg = np.degrees(self.HFOV_rad)
#         self.VFOV_deg = np.degrees(self.VFOV_rad)

#         self.depth_correction_factor = 0.61 / 1.29

#     def preprocess_image(self, image_data):
#         if isinstance(image_data, str):
#             if image_data.startswith('data:image'):
#                 base64_data = image_data.split(',')[1]
#                 image_bytes = base64.b64decode(base64_data)
#                 img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
#                 return img
#             elif os.path.exists(image_data):
#                 return Image.open(image_data).convert("RGB")
#         elif isinstance(image_data, np.ndarray):
#             return Image.fromarray(cv2.cvtColor(image_data, cv2.COLOR_BGR2RGB))
#         raise ValueError("Unsupported image data format")

#     def resize_with_padding(self, image, target_size=(640, 480)):
#         return ImageOps.pad(image, target_size, method=Image.LANCZOS, color=(0, 0, 0), centering=(0.5, 0.5))

#     def detect_objects(self, image):
#         if self.model is None:
#             return []
#         img_np = np.array(self.resize_with_padding(image))
#         results = self.model(img_np, verbose=False)
#         detections = []
#         for r in results:
#             for box in r.boxes:
#                 x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
#                 conf = float(box.conf[0])
#                 cls = int(box.cls[0])
#                 class_name = self.model.names[cls]
#                 detections.append({
#                     'class': class_name,
#                     'confidence': conf,
#                     'bbox': [x1, y1, x2, y2]
#                 })
#         return detections

#     def estimate_depth(self, image):
#         if self.glpn is None:
#             return np.ones(image.size[::-1], dtype=np.float32)

#         resized_img = self.resize_with_padding(image, target_size=(640, 480))
#         inputs = self.processor(images=resized_img, return_tensors="pt").to(self.device)
#         with torch.no_grad():
#             depth_output = self.glpn(**inputs).predicted_depth

#         depth_map = torch.nn.functional.interpolate(
#             depth_output.unsqueeze(1),
#             size=resized_img.size[::-1],
#             mode="bicubic",
#             align_corners=False,
#         ).squeeze().cpu().numpy()

#         return depth_map

#     def calculate_dimensions(self, image, detections):
#         depth_map = self.estimate_depth(image)
#         orig_w, orig_h = image.size
#         results = []
#         scale_x, scale_y = orig_w / 640, orig_h / 480

#         for detection in detections:
#             x1, y1, x2, y2 = detection['bbox']
#             scaled_x_min = int(x1 * scale_x)
#             scaled_y_min = int(y1 * scale_y)
#             scaled_x_max = int(x2 * scale_x)
#             scaled_y_max = int(y2 * scale_y)

#             object_region = depth_map[y1:y2, x1:x2]
#             if object_region.size > 0:
#                 object_region = object_region[(object_region > 0) & (object_region < 10)]
#                 median_depth = np.median(object_region) if object_region.size > 0 else 0
#             else:
#                 median_depth = 0

#             median_depth *= self.depth_correction_factor

#             pixel_width = scaled_x_max - scaled_x_min
#             pixel_height = scaled_y_max - scaled_y_min

#             real_width = 2 * median_depth * np.tan(np.radians(self.HFOV_deg / 2)) * (pixel_width / orig_w)
#             real_height = 2 * median_depth * np.tan(np.radians(self.VFOV_deg / 2)) * (pixel_height / orig_h)

#             dimensions = f"{real_width:.2f}×{real_height:.2f} m"

#             results.append({
#                 'objectName': detection['class'],
#                 'dimensions': dimensions,
#                 'confidence': detection['confidence'],
#                 'bbox': [scaled_x_min, scaled_y_min, scaled_x_max, scaled_y_max]
#             })

#         return results

#     def draw_measurements(self, image, results):
#         img_np = np.array(image)
#         img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

#         for result in results:
#             x1, y1, x2, y2 = result['bbox']
#             label = f"{result['objectName']} - {result['dimensions']} ({result['confidence']:.0%})"

#             cv2.rectangle(img_bgr, (x1, y1), (x2, y2), (255, 105, 180), 2)
#             font = cv2.FONT_HERSHEY_SIMPLEX
#             font_scale = 0.5
#             thickness = 1
#             (text_width, text_height), baseline = cv2.getTextSize(label, font, font_scale, thickness)
#             cv2.rectangle(img_bgr,
#                           (x1, y1 - text_height - 10),
#                           (x1 + text_width + 10, y1),
#                           (139, 0, 70), -1)
#             cv2.putText(img_bgr, label, (x1 + 5, y1 - 5), font, font_scale, (255, 255, 255), thickness)

#         return cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

#     def encode_image_to_base64(self, image):
#         pil_image = Image.fromarray(image)
#         buffer = io.BytesIO()
#         pil_image.save(buffer, format='JPEG')
#         img_str = base64.b64encode(buffer.getvalue()).decode('utf-8')
#         return f"data:image/jpeg;base64,{img_str}"

#     def process_image(self, image_data):
#         try:
#             image = self.preprocess_image(image_data)
#             detections = self.detect_objects(image)
#             results = self.calculate_dimensions(image, detections)

#             if not results:
#                 return {
#                     'success': False,
#                     'message': 'No objects detected',
#                     'measurements': []
#                 }

#             results.sort(key=lambda x: x['confidence'], reverse=True)
#             annotated_image = self.draw_measurements(image, results)
#             image_base64 = self.encode_image_to_base64(annotated_image)

#             return {
#                 'success': True,
#                 'message': f'Detected {len(results)} objects',
#                 'measurements': results,
#                 'annotatedImage': image_base64
#             }

#         except Exception as e:
#             print(f"Error processing image: {e}")
#             return {
#                 'success': False,
#                 'message': f'Error processing image: {str(e)}',
#                 'measurements': []
#             }

# if __name__ == "__main__":
#     if len(sys.argv) > 1:
#         image_path = sys.argv[1]
#         model = MeasurementModel()
#         result = model.process_image(image_path)
#         print(json.dumps(result, indent=2))
#     else:
#         print("Please provide an image path to process")
        