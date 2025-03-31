#!/usr/bin/env python
from flask import Flask, request, jsonify
from measurement_model import MeasurementModel
import os
import sys

# Add the current directory to the path so we can import the measurement model
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__)

# Initialize the model
model = MeasurementModel()

@app.route('/measure', methods=['POST'])
def measure():
    """
    Endpoint to process an image and return measurement results
    Expects JSON with a base64 encoded image
    """
    if not request.json or 'image' not in request.json:
        return jsonify({'success': False, 'message': 'No image data provided'}), 400
    
    image_data = request.json['image']
    
    # Process the image
    result = model.process_image(image_data)
    
    return jsonify(result)

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'model_loaded': model.model is not None})

if __name__ == '__main__':
    # Get port from environment variable or use default
    port = int(os.environ.get('PYTHON_API_PORT', 5001))
    
    # Run the Flask app
    # For Windows compatibility, use 127.0.0.1 instead of 0.0.0.0
    host = '127.0.0.1' if sys.platform.startswith('win') else '0.0.0.0'
    app.run(host=host, port=port)