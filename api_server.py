from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks, HTTPException, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
import uuid
import asyncio
from datetime import datetime
from typing import List, Optional, Dict, Any
import json
from pydantic import BaseModel
import sys
import importlib.util
import logging

# Setup proper root path for imports
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT_DIR)

# Setup logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api_server")

# Try to import backend modules - these will need to be adjusted based on your actual backend structure
try:
    # Try to dynamically import modules from the project
    def import_module_from_path(module_name, file_path):
        if os.path.exists(file_path):
            spec = importlib.util.spec_from_file_location(module_name, file_path)
            if spec:
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                return module
        return None
    
    # Look for main.py, config files, etc.
    main_module = import_module_from_path("main", os.path.join(ROOT_DIR, "main.py"))
    config_module = import_module_from_path("config", os.path.join(ROOT_DIR, "config.py"))
    
    # Use imported modules if available, otherwise use defaults
    if main_module and hasattr(main_module, "MultiAgentSystem"):
        MultiAgentSystem = main_module.MultiAgentSystem
        logger.info("Successfully imported MultiAgentSystem from main.py")
    
    # Set working directory from config if available
    if config_module and hasattr(config_module, "WORKING_DIRECTORY"):
        WORKING_DIRECTORY = config_module.WORKING_DIRECTORY
    else:
        WORKING_DIRECTORY = os.path.join(ROOT_DIR, "data")
    
    # Environment variables
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
    
    # Placeholder values for settings endpoints
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    LANGCHAIN_API_KEY = os.getenv("LANGCHAIN_API_KEY", "")
    FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY", "")
    CONDA_PATH = os.getenv("CONDA_PATH", "/opt/conda")
    CONDA_ENV = os.getenv("CONDA_ENV", "data_assistant")
    CHROMEDRIVER_PATH = os.getenv("CHROMEDRIVER_PATH", "./chromedriver")
    
    # Create the data directory if it doesn't exist
    os.makedirs(WORKING_DIRECTORY, exist_ok=True)
    
except Exception as e:
    logger.error(f"Error setting up backend: {str(e)}")
    logger.info("Running in mock mode - backend functionality will be simulated")
    WORKING_DIRECTORY = os.path.join(ROOT_DIR, "data")
    ENVIRONMENT = "development"
    os.makedirs(WORKING_DIRECTORY, exist_ok=True)
    
    # Placeholder values
    OPENAI_API_KEY = ""
    LANGCHAIN_API_KEY = ""
    FIRECRAWL_API_KEY = ""
    CONDA_PATH = "/opt/conda"
    CONDA_ENV = "data_assistant"
    CHROMEDRIVER_PATH = "./chromedriver"

# Pydantic models
class AnalysisRequest(BaseModel):
    instructions: str
    additional_params: Optional[Dict[str, Any]] = None

class ApiResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None

class JobResponse(ApiResponse):
    job: Optional[JobStatusResponse] = None

class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: int
    started_at: str
    messages: List[Dict[str, Any]]
    completed_at: Optional[str] = None
    current_agent: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    file_paths: Optional[List[str]] = None
    deleted: Optional[bool] = False

class StatusResponse(ApiResponse):
    status: Optional[str] = None
    progress: Optional[int] = None
    logs: Optional[List[str]] = None
    job: Optional[JobStatusResponse] = None

# Reports functionality
class ReportSection(BaseModel):
    id: str
    title: str
    type: str  # 'text' | 'visualization' | 'code' | 'table' | 'financial'
    content: str
    order: int

class Report(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    jobId: Optional[str] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None
    author: Optional[str] = "DATAGEN Assistant"
    type: str  # 'it-strategy' | 'financial-analysis' | 'technical-review' | 'custom'
    sections: List[ReportSection]
    tags: List[str]

# Create FastAPI app
app = FastAPI(title="Data Analysis API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock API key authentication for production
def get_api_key(api_key: str = None):
    # In a real implementation, validate against stored keys
    return api_key

# Mount static files for working directory
app.mount("/data", StaticFiles(directory=WORKING_DIRECTORY), name="data")

# In-memory job storage (replace with database in production)
jobs = {}

# Store active WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, job_id: str):
        await websocket.accept()
        if job_id not in self.active_connections:
            self.active_connections[job_id] = []
        self.active_connections[job_id].append(websocket)
        logger.info(f"WebSocket connected for job {job_id}")

    def disconnect(self, websocket: WebSocket, job_id: str):
        if job_id in self.active_connections:
            self.active_connections[job_id].remove(websocket)
            logger.info(f"WebSocket disconnected for job {job_id}")

    async def send_update(self, job_id: str, data: Dict[str, Any]):
        if job_id in self.active_connections:
            for connection in self.active_connections[job_id]:
                try:
                    await connection.send_json(data)
                    logger.debug(f"Sent update to WebSocket for job {job_id}")
                except Exception as e:
                    logger.error(f"Error sending WebSocket update: {str(e)}")

manager = ConnectionManager()

# Update callback function to send WebSocket updates
async def update_job_status(job_id: str, status_update: Dict[str, Any]):
    if job_id in jobs:
        jobs[job_id].update(status_update)
        # Send update via WebSocket
        await manager.send_update(job_id, jobs[job_id])
        logger.info(f"Updated job status for {job_id}: {status_update}")

# Mock function to simulate the multi-agent system
async def simulate_analysis(job_id: str, files_path: List[str], instructions: str):
    try:
        # Create job directory structure
        job_dir = os.path.join(WORKING_DIRECTORY, job_id)
        viz_dir = os.path.join(job_dir, "visualizations")
        code_dir = os.path.join(job_dir, "code")
        os.makedirs(viz_dir, exist_ok=True)
        os.makedirs(code_dir, exist_ok=True)
        
        # Update job status to running
        await update_job_status(job_id, {
            "status": "running",
            "progress": 5,
            "messages": [{
                "timestamp": datetime.now().isoformat(),
                "content": "Starting analysis process",
                "sender": "system"
            }]
        })
        
        # Simulate processing steps with more granular updates
        steps = [
            # Data loading
            {"name": "Data loading", "description": "Reading input files", "progress": 10, "delay": 1},
            {"name": "Data loading", "description": "Parsing file formats", "progress": 15, "delay": 1},
            {"name": "Data loading", "description": "Validating data structure", "progress": 20, "delay": 1},
            
            # Data preprocessing
            {"name": "Data preprocessing", "description": "Cleaning data", "progress": 25, "delay": 1},
            {"name": "Data preprocessing", "description": "Handling missing values", "progress": 30, "delay": 1},
            {"name": "Data preprocessing", "description": "Normalizing features", "progress": 35, "delay": 1},
            {"name": "Data preprocessing", "description": "Feature engineering", "progress": 40, "delay": 1},
            
            # Analysis
            {"name": "Analysis", "description": "Performing statistical tests", "progress": 45, "delay": 1},
            {"name": "Analysis", "description": "Running regression models", "progress": 50, "delay": 1},
            {"name": "Analysis", "description": "Calculating correlations", "progress": 55, "delay": 1},
            {"name": "Analysis", "description": "Identifying patterns", "progress": 60, "delay": 1},
            
            # Visualization
            {"name": "Visualization", "description": "Generating distribution plots", "progress": 65, "delay": 1},
            {"name": "Visualization", "description": "Creating correlation heatmap", "progress": 70, "delay": 1},
            {"name": "Visualization", "description": "Building interactive charts", "progress": 75, "delay": 1},
            {"name": "Visualization", "description": "Finalizing visualizations", "progress": 80, "delay": 1},
            
            # Report generation
            {"name": "Report generation", "description": "Compiling key findings", "progress": 85, "delay": 1},
            {"name": "Report generation", "description": "Formatting data tables", "progress": 90, "delay": 1},
            {"name": "Report generation", "description": "Creating executive summary", "progress": 95, "delay": 1},
        ]
        
        for step in steps:
            # Simulate processing time
            await asyncio.sleep(step["delay"])
            
            await update_job_status(job_id, {
                "progress": step["progress"],
                "messages": [{
                    "timestamp": datetime.now().isoformat(),
                    "content": f"{step['name']}: {step['description']}",
                    "sender": "agent"
                }]
            })
        
        # Create actual visualization files
        viz_files = [
            {"name": "data_distribution.png", "title": "Data Distribution", "type": "chart"},
            {"name": "correlation_matrix.png", "title": "Correlation Matrix", "type": "chart"},
            {"name": "time_series.png", "title": "Time Series Analysis", "type": "plot"},
            {"name": "feature_importance.png", "title": "Feature Importance", "type": "plot"}
        ]
        
        viz_paths = []
        for viz in viz_files:
            viz_path = os.path.join(viz_dir, viz["name"])
            # Create a blank image file as placeholder
            with open(viz_path, "wb") as f:
                # Simple 1x1 transparent PNG
                f.write(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82')
            viz_paths.append(os.path.relpath(viz_path, WORKING_DIRECTORY))
        
        # Create sample code files with different languages
        code_files = [
            {"name": "data_processing.py", "language": "python", "content": "import pandas as pd\nimport numpy as np\n\ndef process_data(file_path):\n    df = pd.read_csv(file_path)\n    return df.dropna()"},
            {"name": "visualization.py", "language": "python", "content": "import matplotlib.pyplot as plt\nimport seaborn as sns\n\ndef plot_distribution(data, column):\n    plt.figure(figsize=(10, 6))\n    sns.histplot(data[column])\n    plt.title(f'Distribution of {column}')\n    plt.savefig('distribution.png')"},
            {"name": "analysis.js", "language": "javascript", "content": "function analyzeData(data) {\n  const results = {};\n  for (const key in data) {\n    results[key] = calculate(data[key]);\n  }\n  return results;\n}\n\nfunction calculate(values) {\n  return values.reduce((a, b) => a + b, 0) / values.length;\n}"}
        ]
        
        code_paths = []
        for code in code_files:
            code_path = os.path.join(code_dir, code["name"])
            with open(code_path, "w") as f:
                f.write(code["content"])
            code_paths.append(os.path.relpath(code_path, WORKING_DIRECTORY))
        
        # Simulate completion
        await asyncio.sleep(1)
        
        # Generate result with all created files
        visualizations = []
        for i, viz in enumerate(viz_files):
            visualizations.append({
                "id": str(uuid.uuid4()),
                "title": viz["title"],
                "description": f"Visualization of {viz['title'].lower()} from the dataset",
                "file_path": viz_paths[i],
                "type": viz["type"],
                "created_at": datetime.now().isoformat(),
                "metadata": {"format": "png", "dimensions": "1200x800"}
            })
        
        code_blocks = []
        for i, code in enumerate(code_files):
            code_blocks.append({
                "id": str(uuid.uuid4()),
                "title": code["name"].replace('.', ' ').title(),
                "content": code["content"],
                "language": code["language"],
                "created_at": datetime.now().isoformat(),
                "metadata": {"lines": len(code["content"].split('\n')), "purpose": "data analysis"}
            })
        
        report_sections = [
            {
                "id": str(uuid.uuid4()),
                "title": "Executive Summary",
                "content": "This analysis examined the provided data and found several key insights about the distribution, correlations, and patterns present in the dataset.",
                "order": 1,
                "created_at": datetime.now().isoformat(),
                "type": "heading",
                "metadata": {"importance": "high"}
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Data Overview",
                "content": "The dataset contains numerical and categorical features with some missing values that were handled during preprocessing. The data shows interesting patterns that were further investigated.",
                "order": 2,
                "created_at": datetime.now().isoformat(),
                "type": "paragraph",
                "metadata": {"word_count": 150}
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Key Findings",
                "content": "Our analysis revealed the following patterns and trends in the data:\n- Feature A shows strong correlation with target variable\n- Feature B exhibits seasonal patterns\n- Features C and D together provide the most predictive power",
                "order": 3,
                "created_at": datetime.now().isoformat(),
                "type": "bulletList",
                "metadata": {"item_count": 3}
            }
        ]
        
        await update_job_status(job_id, {
            "status": "completed",
            "progress": 100,
            "completed_at": datetime.now().isoformat(),
            "messages": [{
                "timestamp": datetime.now().isoformat(),
                "content": "Analysis completed successfully",
                "sender": "system"
            }],
            "result": {
                "summary": "Analysis completed successfully. Found interesting patterns in the data related to feature distributions and correlations.",
                "files": list(set(viz_paths + code_paths)),
                "completion_time": datetime.now().isoformat(),
                "visualizations": visualizations,
                "code_blocks": code_blocks,
                "report_sections": report_sections
            }
        })
        
    except Exception as e:
        logger.error(f"Error in simulated analysis: {str(e)}")
        await update_job_status(job_id, {
            "status": "failed",
            "error": str(e),
            "messages": [{
                "timestamp": datetime.now().isoformat(),
                "content": f"Analysis failed: {str(e)}",
                "sender": "system"
            }]
        })

# Background task for running analysis
async def run_analysis_task(job_id: str, files_path: List[str], instructions: str):
    try:
        # In a real implementation, you would initialize your MultiAgentSystem here
        # system = MultiAgentSystem()
        # user_input = f"datapath:{','.join(files_path)}\n{instructions}"
        # system.run(user_input, job_id=job_id, job_callback=update_job_status)
        
        # For now, we'll use the simulation function
        await simulate_analysis(job_id, files_path, instructions)
        
    except Exception as e:
        logger.error(f"Error running analysis: {str(e)}")
        await update_job_status(job_id, {
            "status": "failed",
            "error": str(e),
            "messages": [{
                "timestamp": datetime.now().isoformat(),
                "content": f"Analysis failed: {str(e)}",
                "sender": "system"
            }]
        })

@app.post("/api/analysis", response_model=JobResponse)
async def create_analysis(
    background_tasks: BackgroundTasks,
    instructions: str = Form(...),
    files: List[UploadFile] = File(...),
    additional_params: Optional[str] = Form(None)
):
    try:
        # Generate job ID
        job_id = str(uuid.uuid4())
        
        # Parse additional parameters
        params = json.loads(additional_params) if additional_params else {}
        
        # Create job directory
        job_dir = os.path.join(WORKING_DIRECTORY, job_id)
        os.makedirs(job_dir, exist_ok=True)
        
        # Save uploaded files
        file_paths = []
        for file in files:
            file_path = os.path.join(job_dir, file.filename)
            with open(file_path, "wb") as f:
                f.write(await file.read())
            file_paths.append(file_path)
            
        # Create job status
        jobs[job_id] = {
            "job_id": job_id,
            "status": "pending",
            "progress": 0,
            "started_at": datetime.now().isoformat(),
            "messages": [
                {
                    "timestamp": datetime.now().isoformat(),
                    "content": instructions,
                    "sender": "human"
                }
            ],
            "file_paths": file_paths,
            "current_agent": None,
            "deleted": False
        }
        
        # Start analysis in background
        asyncio.create_task(run_analysis_task(job_id, file_paths, instructions))
        
        # Return job status with success flag
        return {
            "success": True,
            "job": jobs[job_id]
        }
    
    except Exception as e:
        logger.error(f"Error creating analysis job: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analysis/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    """Get the details of a specific analysis job"""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"success": True, "job": jobs[job_id]}

@app.get("/api/analysis/{job_id}/status", response_model=StatusResponse)
async def get_job_status(job_id: str):
    """Get the status of a specific analysis job"""
    try:
        if job_id not in jobs:
            raise HTTPException(status_code=404, detail="Job not found")
            
        # Create a response that matches the expected format
        response = {
            "success": True,
            "status": jobs[job_id]["status"],
            "progress": jobs[job_id]["progress"],
            "logs": [msg["content"] for msg in jobs[job_id]["messages"] if msg["sender"] != "human"],
            "job": jobs[job_id]  # Include the full job data
        }
        
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting job status: {str(e)}")
        return {
            "success": False,
            "message": f"Failed to get job status: {str(e)}"
        }

@app.delete("/api/analysis/{job_id}")
async def cancel_job(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Only cancel running jobs
    if jobs[job_id]["status"] == "running":
        jobs[job_id]["status"] = "cancelled"
        jobs[job_id]["messages"].append({
            "timestamp": datetime.now().isoformat(),
            "content": "Job cancelled by user",
            "sender": "system"
        })
        
        # Notify via WebSocket
        asyncio.create_task(manager.send_update(job_id, jobs[job_id]))
    
    return {"success": True, "message": "Job cancelled successfully"}

@app.post("/api/analysis/{job_id}/restart")
async def restart_job(job_id: str):
    """Restart a failed or cancelled job"""
    try:
        if job_id not in jobs:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Only restart failed or cancelled jobs
        if jobs[job_id]["status"] not in ["failed", "cancelled", "completed"]:
            return {
                "success": False,
                "message": f"Cannot restart job with status {jobs[job_id]['status']}"
            }
            
        # Get the original files and instructions
        file_paths = jobs[job_id]["file_paths"]
        
        # Find the human message with instructions
        instructions = ""
        for msg in jobs[job_id]["messages"]:
            if msg["sender"] == "human":
                instructions = msg["content"]
                break
                
        if not instructions:
            raise HTTPException(status_code=400, detail="Could not find original instructions")
                
        # Reset job status
        jobs[job_id].update({
            "status": "pending",
            "progress": 0,
            "error": None,
            "result": None,
            "completed_at": None,
            "messages": [
                {
                    "timestamp": datetime.now().isoformat(),
                    "content": instructions,
                    "sender": "human"
                },
                {
                    "timestamp": datetime.now().isoformat(),
                    "content": "Job restarted",
                    "sender": "system"
                }
            ]
        })
        
        # Notify via WebSocket
        asyncio.create_task(manager.send_update(job_id, jobs[job_id]))
        
        # Start analysis again
        asyncio.create_task(run_analysis_task(job_id, file_paths, instructions))
        
        return {
            "success": True,
            "message": "Job restarted successfully",
            "job": jobs[job_id]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error restarting job: {str(e)}")
        return {
            "success": False,
            "message": f"Failed to restart job: {str(e)}"
        }

@app.websocket("/api/socket/{job_id}")
async def websocket_endpoint(websocket: WebSocket, job_id: str):
    await manager.connect(websocket, job_id)
    try:
        # Send current job status on connection
        if job_id in jobs:
            await websocket.send_json(jobs[job_id])
            logger.info(f"Sent initial job status for {job_id}")
        
        # Listen for client messages and handle ping/pong
        while True:
            try:
                data = await websocket.receive_text()
                # Handle ping messages for connection stability
                if data == "ping":
                    await websocket.send_text("pong")
                    continue
                
                logger.info(f"Received message from client: {data}")
                # Process other client messages as needed
            except WebSocketDisconnect:
                manager.disconnect(websocket, job_id)
                logger.info(f"WebSocket disconnected for job {job_id}")
                break
    except WebSocketDisconnect:
        manager.disconnect(websocket, job_id)
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        manager.disconnect(websocket, job_id)

# API endpoint for code files
@app.get("/api/code-files")
async def get_code_files():
    """Get all code files from analyses"""
    try:
        # Find all Python files in job directories
        code_files = []
        for job_id in os.listdir(WORKING_DIRECTORY):
            job_dir = os.path.join(WORKING_DIRECTORY, job_id)
            
            if not os.path.isdir(job_dir):
                continue
                
            # Look for Python files
            for root, _, files in os.walk(job_dir):
                for file in files:
                    if file.endswith(('.py', '.ipynb', '.js', '.html', '.css')):
                        file_path = os.path.join(root, file)
                        relative_path = os.path.relpath(file_path, job_dir)
                        
                        # Read file content
                        try:
                            with open(file_path, 'r', encoding='utf-8') as f:
                                content = f.read()
                            
                            # Determine language
                            ext = os.path.splitext(file)[1].lower()
                            language = {
                                '.py': 'python',
                                '.ipynb': 'python',
                                '.js': 'javascript',
                                '.html': 'html',
                                '.css': 'css'
                            }.get(ext, 'text')
                            
                            # Get file stats
                            stats = os.stat(file_path)
                            
                            code_files.append({
                                'id': f"{job_id}_{relative_path.replace('/', '_')}",
                                'name': file,
                                'language': language,
                                'content': content,
                                'job_id': job_id,
                                'created_at': datetime.fromtimestamp(stats.st_ctime).isoformat(),
                            })
                        except Exception as e:
                            logger.error(f"Error reading file {file_path}: {str(e)}")
        
        return {"success": True, "data": code_files}
    except Exception as e:
        logger.error(f"Error retrieving code files: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve code files: {str(e)}")

# API endpoint for visualizations
@app.get("/api/visualizations")
async def get_visualizations():
    """Get all visualizations from analyses"""
    try:
        # Find all image files in job directories
        visualizations = []
        for job_id in os.listdir(WORKING_DIRECTORY):
            job_dir = os.path.join(WORKING_DIRECTORY, job_id)
            
            if not os.path.isdir(job_dir):
                continue
                
            # Look for visualization files
            for root, _, files in os.walk(job_dir):
                for file in files:
                    if file.endswith(('.png', '.jpg', '.jpeg', '.svg')):
                        file_path = os.path.join(root, file)
                        relative_path = os.path.relpath(file_path, job_dir)
                        
                        # Get file stats
                        stats = os.stat(file_path)
                        
                        # Try to determine visualization type from filename
                        viz_type = 'image'
                        if 'chart' in file.lower():
                            viz_type = 'chart'
                        elif 'graph' in file.lower():
                            viz_type = 'graph'
                        elif 'table' in file.lower():
                            viz_type = 'table'
                        
                        # Generate a title if none exists
                        title = file.split('.')[0].replace('_', ' ').title()
                        
                        visualizations.append({
                            'id': f"{job_id}_{relative_path.replace('/', '_')}",
                            'title': title,
                            'description': None,  # Would need metadata file to get description
                            'file_path': relative_path,
                            'type': viz_type,
                            'job_id': job_id,
                            'created_at': datetime.fromtimestamp(stats.st_ctime).isoformat(),
                            'metadata': None,  # Would need additional data source for metadata
                        })
        
        return {"success": True, "data": visualizations}
    except Exception as e:
        logger.error(f"Error retrieving visualizations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve visualizations: {str(e)}")

# API endpoint for settings
@app.get("/api/settings")
async def get_settings(api_key: str = Depends(get_api_key) if ENVIRONMENT == "production" else None):
    """Get application settings"""
    try:
        # In production, you would retrieve this from a secure database
        settings = {
            'apiKeys': {
                'openai': OPENAI_API_KEY[:5] + '*****' if OPENAI_API_KEY else '',
                'langchain': LANGCHAIN_API_KEY[:5] + '*****' if LANGCHAIN_API_KEY else '',
                'firecrawl': FIRECRAWL_API_KEY[:5] + '*****' if FIRECRAWL_API_KEY else '',
            },
            'general': {
                'workingDirectory': WORKING_DIRECTORY,
                'condaPath': CONDA_PATH,
                'condaEnv': CONDA_ENV,
                'chromeDriverPath': CHROMEDRIVER_PATH,
            }
        }
        
        return {"success": True, "data": settings}
    except Exception as e:
        logger.error(f"Error retrieving settings: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve settings: {str(e)}")

@app.put("/api/settings")
async def update_settings(
    settings: dict,
    api_key: str = Depends(get_api_key) if ENVIRONMENT == "production" else None
):
    """Update application settings"""
    try:
        # In production, you would update settings in a secure database
        # and then restart the application with new settings
        # For now, just acknowledge the update
        
        return {
            "success": True, 
            "message": "Settings updated successfully. Changes will take effect after application restart."
        }
    except Exception as e:
        logger.error(f"Error updating settings: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update settings: {str(e)}")

# API endpoint for file access
@app.get("/api/files/{job_id}/{file_path:path}")
async def get_file(job_id: str, file_path: str):
    """Get a file from a job"""
    try:
        # Build the file path
        file_path = os.path.join(WORKING_DIRECTORY, job_id, file_path)
        
        # Check if file exists
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
            
        # Determine content type
        content_type = "application/octet-stream"  # Default
        ext = os.path.splitext(file_path)[1].lower()
        
        if ext in ['.png']:
            content_type = "image/png"
        elif ext in ['.jpg', '.jpeg']:
            content_type = "image/jpeg"
        elif ext in ['.svg']:
            content_type = "image/svg+xml"
        elif ext in ['.pdf']:
            content_type = "application/pdf"
        elif ext in ['.txt']:
            content_type = "text/plain"
        elif ext in ['.html']:
            content_type = "text/html"
        elif ext in ['.csv']:
            content_type = "text/csv"
        
        # Read and return the file
        return FileResponse(file_path, media_type=content_type)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve file: {str(e)}")

# In-memory storage for reports
reports = {}

@app.get("/api/reports")
async def get_reports():
    """Get all reports"""
    try:
        return {"success": True, "data": list(reports.values())}
    except Exception as e:
        logger.error(f"Error retrieving reports: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve reports: {str(e)}")

@app.get("/api/reports/{report_id}")
async def get_report(report_id: str):
    """Get a specific report by ID"""
    try:
        if report_id not in reports:
            raise HTTPException(status_code=404, detail="Report not found")
        
        return {"success": True, "data": reports[report_id]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve report: {str(e)}")

@app.post("/api/reports")
async def create_report(report: Report):
    """Create a new report"""
    try:
        # Generate ID if not provided
        if not report.id:
            report.id = str(uuid.uuid4())
        
        # Set timestamps if not provided
        current_time = datetime.now().isoformat()
        if not report.createdAt:
            report.createdAt = current_time
        if not report.updatedAt:
            report.updatedAt = current_time
            
        # Store the report
        reports[report.id] = report.dict()
        
        return {"success": True, "data": reports[report.id]}
    except Exception as e:
        logger.error(f"Error creating report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create report: {str(e)}")

@app.put("/api/reports/{report_id}")
async def update_report(report_id: str, report: Report):
    """Update an existing report"""
    try:
        if report_id not in reports:
            raise HTTPException(status_code=404, detail="Report not found")
        
        # Update report
        report.id = report_id  # Ensure ID matches
        report.updatedAt = datetime.now().isoformat()
        
        # Preserve creation date
        report.createdAt = reports[report_id].get("createdAt", report.createdAt)
        
        # Store updated report
        reports[report_id] = report.dict()
        
        return {"success": True, "data": reports[report_id]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update report: {str(e)}")

@app.delete("/api/reports/{report_id}")
async def delete_report(report_id: str):
    """Delete a report"""
    try:
        if report_id not in reports:
            raise HTTPException(status_code=404, detail="Report not found")
        
        # Delete report
        deleted_report = reports.pop(report_id)
        
        return {"success": True, "message": "Report deleted successfully", "data": deleted_report}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete report: {str(e)}")

@app.get("/")
async def root():
    return {"message": "DATAGEN API Server is running", "version": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=True) 