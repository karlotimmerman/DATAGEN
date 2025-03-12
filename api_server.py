from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import uuid
import asyncio
from datetime import datetime
from typing import List, Optional, Dict, Any
import json
from pydantic import BaseModel
import sys

# Add the current directory to the path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Try to import backend modules - these will need to be adjusted based on your actual backend structure
try:
    # Import your MultiAgentSystem class
    # from main import MultiAgentSystem
    # from load_cfg import WORKING_DIRECTORY
    # from logger import setup_logger
    
    # For now, we'll use placeholders
    WORKING_DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
    
    # Create the data directory if it doesn't exist
    os.makedirs(WORKING_DIRECTORY, exist_ok=True)
    
    # Setup logger placeholder
    def setup_logger():
        import logging
        logging.basicConfig(level=logging.INFO)
        return logging.getLogger("api_server")
    
    # Initialize logger
    logger = setup_logger()
    
except ImportError as e:
    import logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger("api_server")
    logger.error(f"Error importing backend modules: {str(e)}")
    logger.info("Running in mock mode - backend functionality will be simulated")

# Pydantic models
class AnalysisRequest(BaseModel):
    instructions: str
    additional_params: Optional[Dict[str, Any]] = None

class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: int
    started_at: str
    messages: List[Dict[str, Any]]
    completed_at: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    file_paths: Optional[List[str]] = None

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
        
        # Simulate processing steps
        steps = [
            ("Data loading", "Loading and parsing input files", 10),
            ("Data preprocessing", "Cleaning and preparing data for analysis", 30),
            ("Analysis", "Performing core analysis operations", 50),
            ("Visualization", "Generating visualizations and charts", 70),
            ("Report generation", "Compiling final analysis report", 90)
        ]
        
        for step_name, step_desc, progress in steps:
            # Simulate processing time
            await asyncio.sleep(2)
            
            await update_job_status(job_id, {
                "progress": progress,
                "messages": [{
                    "timestamp": datetime.now().isoformat(),
                    "content": f"{step_name}: {step_desc}",
                    "sender": "agent"
                }]
            })
        
        # Simulate completion
        await asyncio.sleep(2)
        
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
                "summary": "Analysis completed successfully. Found interesting patterns in the data.",
                "files": [f.split('/')[-1] for f in files_path],
                "completion_time": datetime.now().isoformat(),
                "visualizations": [
                    {
                        "id": str(uuid.uuid4()),
                        "title": "Data Distribution",
                        "description": "Distribution of values across the dataset",
                        "file_path": "/mock/visualization1.png",
                        "type": "chart",
                        "created_at": datetime.now().isoformat()
                    }
                ],
                "code_blocks": [
                    {
                        "id": str(uuid.uuid4()),
                        "title": "Data Processing Code",
                        "content": "import pandas as pd\n\ndf = pd.read_csv('data.csv')\ndf.head()",
                        "language": "python",
                        "created_at": datetime.now().isoformat()
                    }
                ],
                "report_sections": [
                    {
                        "id": str(uuid.uuid4()),
                        "title": "Executive Summary",
                        "content": "This analysis examined the provided data and found several key insights...",
                        "order": 1,
                        "created_at": datetime.now().isoformat()
                    },
                    {
                        "id": str(uuid.uuid4()),
                        "title": "Detailed Findings",
                        "content": "Our analysis revealed the following patterns and trends...",
                        "order": 2,
                        "created_at": datetime.now().isoformat()
                    }
                ]
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

@app.post("/api/analysis", response_model=JobStatusResponse)
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
            "status": "queued",
            "progress": 0,
            "started_at": datetime.now().isoformat(),
            "messages": [
                {
                    "timestamp": datetime.now().isoformat(),
                    "content": instructions,
                    "sender": "human"
                }
            ],
            "file_paths": file_paths
        }
        
        # Start analysis in background
        asyncio.create_task(run_analysis_task(job_id, file_paths, instructions))
        
        return jobs[job_id]
    
    except Exception as e:
        logger.error(f"Error creating analysis job: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analysis/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs[job_id]

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

@app.websocket("/api/socket/{job_id}")
async def websocket_endpoint(websocket: WebSocket, job_id: str):
    await manager.connect(websocket, job_id)
    try:
        # Send current job status on connection
        if job_id in jobs:
            await websocket.send_json(jobs[job_id])
            logger.info(f"Sent initial job status for {job_id}")
        
        # Listen for client messages
        while True:
            data = await websocket.receive_text()
            logger.info(f"Received message from client: {data}")
            # You can handle client messages if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket, job_id)
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        manager.disconnect(websocket, job_id)

@app.get("/")
async def root():
    return {"message": "DATAGEN API Server is running", "version": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=True) 