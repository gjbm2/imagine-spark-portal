from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import time
import random
import uuid
import json
import sys
import requests
from werkzeug.utils import secure_filename
from utils.logger import log_to_console, info, error, warning, debug, console_logs
import routes.generate
import subprocess
import logging

app = Flask(__name__, static_folder='build')
CORS(app)  # Enable CORS for all routes

# Make sure we can find python packages
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

# Create uploads directory if it doesn't exist
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# In-memory dictionary to store generated images
generated_images = {}

# Sample placeholder images (replace with actual implementation)
PLACEHOLDER_IMAGES = [
    "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1974&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1605979257913-1704eb7b6246?q=80&w=1770&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1692891873526-61e7e87ea428?q=80&w=1780&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1533134486753-c833f0ed4866?q=80&w=1770&auto=format&fit=crop"
]

# Artistic style images
ARTISTIC_IMAGES = [
    "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=1945&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1549289524-06cf8837ace5?q=80&w=1974&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1591267990532-e5bdb1b0ceb8?q=80&w=1974&auto=format&fit=crop"
]

# Load workflow data from JSON files
def load_json_data(file_name):
    try:
        # First try to load from src/data directory
        src_data_path = os.path.join('src', 'data', file_name)
        if os.path.exists(src_data_path):
            with open(src_data_path, 'r') as file:
                info(f"Loaded data from {src_data_path}")
                return json.load(file)
        else:
            error(f"Data file not found in src/data: {file_name}")
            return []
    except Exception as e:
        error(f"Error loading {file_name}: {e}")
        return []

workflows_data = load_json_data('workflows.json')
refiners_data = load_json_data('refiners.json')
refiner_params_data = load_json_data('refiner-params.json')
global_options_data = load_json_data('global-options.json')

# Add a new endpoint for running scripts
@app.route('/api/run-script', methods=['POST'])
def run_script():
    try:
        data = request.json
        if not data or 'filename' not in data:
            return jsonify({"success": False, "error": "No filename provided"}), 400
        
        filename = data['filename']
        # Prevent path traversal attacks
        filename = os.path.basename(filename)
        
        # Determine the script type and location
        script_path = None
        # First check in routes directory
        routes_path = os.path.join('routes', filename)
        if os.path.exists(routes_path):
            script_path = routes_path
            info(f"Found script in routes directory: {script_path}")
        
        if not script_path:
            return jsonify({"success": False, "error": f"Script not found: {filename}"}), 404
        
        # Log the script execution
        info(f"Executing script: {script_path}")
        
        # For now, we'll just read the content of the script and return it
        # In a real implementation, you would execute the script based on its type
        with open(script_path, 'r') as file:
            script_content = file.read()
        
        # Different handling based on file extension
        if filename.endswith('.bat'):
            info(f"Would execute batch file: {script_path}")
            return jsonify({
                "success": True,
                "message": f"Batch script would be executed: {filename}",
                "content_preview": script_content[:100] + '...' if len(script_content) > 100 else script_content
            })
        elif filename.endswith('.json'):
            info(f"Would process JSON workflow: {script_path}")
            return jsonify({
                "success": True,
                "message": f"JSON workflow would be processed: {filename}",
                "content_preview": script_content[:100] + '...' if len(script_content) > 100 else script_content
            })
        else:
            info(f"Would process text file: {script_path}")
            return jsonify({
                "success": True,
                "message": f"Text file would be processed: {filename}",
                "content_preview": script_content[:100] + '...' if len(script_content) > 100 else script_content
            })
            
    except Exception as e:
        error_msg = f"Error executing script: {str(e)}"
        error(error_msg)
        return jsonify({"success": False, "error": error_msg}), 500

# Add a new route for publishing images
@app.route('/api/publish-image', methods=['POST'])
def publish_image():
    try:
        data = request.json
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
        
        image_url = data.get('imageUrl')
        destination = data.get('destination')
        destination_type = data.get('destinationType')
        destination_file = data.get('destinationFile')
        metadata = data.get('metadata', {})
        
        if not image_url:
            return jsonify({"success": False, "error": "No image URL provided"}), 400
        
        if not destination:
            return jsonify({"success": False, "error": "No destination provided"}), 400
        
        # Download the image
        try:
            image_response = requests.get(image_url)
            if image_response.status_code != 200:
                return jsonify({"success": False, "error": f"Failed to download image: HTTP {image_response.status_code}"}), 500
            
            image_data = image_response.content
        except Exception as e:
            logging.error(f"Error downloading image: {str(e)}")
            return jsonify({"success": False, "error": f"Failed to download image: {str(e)}"}), 500
        
        # Handle based on destination type
        if destination_type == "output_file":
            if not destination_file:
                return jsonify({"success": False, "error": "No destination file specified for output_file type"}), 400
            
            try:
                # Ensure the output directory exists
                output_dir = "published_images"
                os.makedirs(output_dir, exist_ok=True)
                
                # Secure the filename and save
                safe_filename = secure_filename(destination_file)
                output_path = os.path.join(output_dir, safe_filename)
                
                with open(output_path, 'wb') as f:
                    f.write(image_data)
                
                return jsonify({
                    "success": True, 
                    "message": f"Image published to {output_path}",
                    "path": output_path
                })
            except Exception as e:
                logging.error(f"Error saving to file: {str(e)}")
                return jsonify({"success": False, "error": f"Failed to save image: {str(e)}"}), 500
        
        elif destination_type == "s3":
            # This would be implemented with boto3/AWS SDK
            # For now, we'll just mock the response
            logging.info(f"Mock S3 upload for file: {destination_file}")
            return jsonify({
                "success": True, 
                "message": f"Image published to S3 (mock)",
                "path": f"s3://mock-bucket/{destination_file}"
            })
        
        else:
            return jsonify({"success": False, "error": f"Unsupported destination type: {destination_type}"}), 400
        
    except Exception as e:
        logging.error(f"Error in publish endpoint: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

# Add a new endpoint to get console logs
@app.route('/api/logs', methods=['GET'])
def get_logs():
    # Return the most recent logs first, with an optional limit parameter
    limit = request.args.get('limit', default=100, type=int)
    return jsonify({"logs": console_logs[-limit:] if limit > 0 else console_logs})

# Add a new endpoint to add logs from the frontend
@app.route('/api/log', methods=['POST'])
def add_log():
    data = request.json
    message = data.get('message', '')
    source = data.get('source', 'frontend')
    
    if message:
        log_entry = log_to_console(message, source=source)
        return jsonify({"status": "success", "log": log_entry})
    
    return jsonify({"status": "error", "message": "No log message provided"}), 400

@app.route('/api/generate-image', methods=['POST'])
def generate_image():
    # Extract JSON data from the form
    json_data = request.form.get('data')
    if not json_data:
        error("Missing data parameter in request")
        return jsonify({"error": "Missing data parameter"}), 400
    
    try:
        data = json.loads(json_data)
    except Exception as e:
        error(f"Invalid JSON: {str(e)}")
        return jsonify({"error": f"Invalid JSON: {str(e)}"}), 400
    
    prompt = data.get('prompt', '')
    workflow = data.get('workflow', 'text-to-image')
    params = data.get('params', {})
    global_params = data.get('global_params', {})
    refiner = data.get('refiner', 'none')
    refiner_params = data.get('refiner_params', {})
    batch_size = data.get('batch_size', 1)
    has_reference_image = data.get('has_reference_image', False)
    
    # Handle uploaded files
    uploaded_files = []
    image_files = request.files.getlist('image')
    
    # Save uploaded files if any
    for file in image_files:
        if file.filename:
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            uploaded_files.append(filepath)
            has_reference_image = True
            info(f"Saved uploaded file: {filename}")

    # Validate input
    if not prompt and not has_reference_image:
        error("Prompt or reference image is required")
        return jsonify({"error": "Prompt or reference image is required"}), 400
    
    info(f"Generating images with prompt: {prompt}")
    info(f"Workflow: {workflow}, Batch size: {batch_size}")
    info(f"Reference images: {uploaded_files if uploaded_files else 'None'}")
       
    # Generate
    response = routes.generate.main(
        prompt=prompt
    )
    
    # Generate a unique ID for this batch
    batch_id = data.get('batch_id') or str(uuid.uuid4())
    
    # Generate the requested number of images (based on batch_size)
    result_images = []
    
    for i in range(int(batch_size)):
        # For this mock implementation, we're returning different placeholder images based on the workflow
        #if workflow == 'artistic-style-transfer':
        #    image_url = random.choice(ARTISTIC_IMAGES)
        #else:
        #    image_url = random.choice(PLACEHOLDER_IMAGES)
        image_url = response
        
        # Generate a unique ID for this image
        image_id = str(uuid.uuid4())
        
        # Store the image metadata in our dictionary
        image_data = {
            "id": image_id,
            "url": image_url,
            "prompt": prompt,
            "workflow": workflow,
            "timestamp": time.time(),
            "params": params,
            "global_params": global_params,
            "refiner": refiner,
            "refiner_params": refiner_params,
            "used_reference_image": has_reference_image,
            "batch_id": batch_id,
            "batch_index": i
        }
        
        generated_images[image_id] = image_data
        result_images.append(image_data)
        info(f"Generated image {i+1}/{batch_size} with ID: {image_id}")
    
    return jsonify({
        "success": True,
        "images": result_images,
        "batch_id": batch_id,
        "prompt": prompt,
        "workflow": workflow
    })

@app.route('/api/images', methods=['GET'])
def get_images():
    # Return all stored images, sorted by timestamp (newest first)
    sorted_images = sorted(
        list(generated_images.values()), 
        key=lambda x: x["timestamp"], 
        reverse=True
    )
    info(f"Returning {len(sorted_images)} images")
    return jsonify({"images": sorted_images})

@app.route('/api/images/<image_id>', methods=['GET'])
def get_image(image_id):
    # Return a specific image by ID
    if image_id in generated_images:
        info(f"Retrieved image with ID: {image_id}")
        return jsonify(generated_images[image_id])
    error(f"Image not found: {image_id}")
    return jsonify({"error": "Image not found"}), 404

@app.route('/api/workflows', methods=['GET'])
def get_workflows():
    info(f"Returning {len(workflows_data)} workflows")
    return jsonify({"workflows": workflows_data})

@app.route('/api/refiners', methods=['GET'])
def get_refiners():
    info(f"Returning {len(refiners_data)} refiners")
    return jsonify({"refiners": refiners_data})

@app.route('/api/refiner-params/<refiner_id>', methods=['GET'])
def get_refiner_params(refiner_id):
    refiner_data = next((r for r in refiner_params_data if r["id"] == refiner_id), None)
    if refiner_data:
        info(f"Returning params for refiner: {refiner_id}")
        return jsonify(refiner_data)
    error(f"Refiner not found: {refiner_id}")
    return jsonify({"error": "Refiner not found"}), 404

@app.route('/api/global-options', methods=['GET'])
def get_global_options():
    info(f"Returning {len(global_options_data)} global options")
    return jsonify({"global_options": global_options_data})

# Add a new endpoint for extracting image metadata
@app.route('/api/extract-metadata', methods=['POST'])
def extract_metadata():
    try:
        data = request.json
        if not data or 'imageUrl' not in data:
            return jsonify({"success": False, "error": "No image URL provided"}), 400
        
        image_url = data['imageUrl']
        info(f"Extracting metadata for image: {image_url}")
        
        # For now, we'll return a placeholder response
        # This will be replaced with actual metadata extraction code later
        metadata = {
            "placeholder": "This is a placeholder response. The actual metadata extraction will be implemented later.",
            "imageUrl": image_url,
            "timestamp": time.time()
        }
        
        # Return the metadata
        return jsonify({"success": True, "metadata": metadata})
    
    except Exception as e:
        error_msg = f"Error extracting metadata: {str(e)}"
        error(error_msg)
        return jsonify({"success": False, "error": error_msg}), 500

# Serve the React frontend
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    info("Starting Flask server on port 5000")
    app.run(host="0.0.0.0", debug=True, port=5000, use_reloader=False)
