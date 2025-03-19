
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import time
import random

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# In a real implementation, you would integrate with actual AI image generation here
# This is just a mock implementation that returns placeholder images

# Sample placeholder images (replace with actual implementation)
PLACEHOLDER_IMAGES = [
    "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1974&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1605979257913-1704eb7b6246?q=80&w=1770&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1692891873526-61e7e87ea428?q=80&w=1780&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1533134486753-c833f0ed4866?q=80&w=1770&auto=format&fit=crop"
]

@app.route('/generate-image', methods=['POST'])
def generate_image():
    # Get the data from the request
    data = request.get_json()
    prompt = data.get('prompt', '')
    has_reference_image = data.get('has_reference_image', False)
    
    if not prompt and not has_reference_image:
        return jsonify({"error": "Prompt or reference image is required"}), 400
    
    # Simulate processing time
    time.sleep(2)
    
    # In a real implementation, you would:
    # 1. Handle the uploaded image file if present
    # 2. Pass both the prompt and the image to your AI model for img2img generation
    # 3. Return the generated image
    
    # For this example, we're just returning a random placeholder image
    image_url = random.choice(PLACEHOLDER_IMAGES)
    
    return jsonify({
        "success": True,
        "prompt": prompt,
        "image_url": image_url,
        "used_reference_image": has_reference_image
    })

if __name__ == '__main__':
    app.run(debug=True)
