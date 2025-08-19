from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
from datetime import datetime, timedelta
import jwt
import bcrypt

app = FastAPI(title="Issue Tracker API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")

# Data models
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    token: str
    user: dict

class IssueDetails(BaseModel):
    id: int
    title: str
    description: str
    status: str
    priority: str
    assignee: str
    created: str
    updated: str

class SimilarIssue(BaseModel):
    id: int
    title: str
    description: str
    status: str
    priority: str
    assignee: str
    source: str
    created: str
    updated: str
    contactPerson: str
    resolution: Optional[str] = None
    closedBy: Optional[str] = None

# Mock data storage
users_db = {
    "Poovarasan": {
        "username": "Poovarasan", 
        "password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW"  # "secret" hashed
    }
}

mock_issues = {
    1234: IssueDetails(
        id=1234,
        title="User login authentication error",
        description="Users are experiencing intermittent login failures with 'Invalid credentials' message even when using correct username and password.",
        status="Open",
        priority="High",
        assignee="John Doe",
        created="2024-01-20 10:30:00",
        updated="2024-01-22 15:45:00"
    ),
    5678: IssueDetails(
        id=5678,
        title="Database connection timeout",
        description="Application occasionally fails to connect to the database during peak hours.",
        status="In Progress",
        priority="Medium",
        assignee="Jane Smith",
        created="2024-01-21 09:15:00",
        updated="2024-01-23 11:20:00"
    )
}

mock_similar_issues = [
    SimilarIssue(
        id=101,
        title="Login timeout on mobile app",
        description="Mobile users experiencing login timeouts after 30 seconds",
        status="Resolved",
        priority="Medium",
        assignee="Alice Johnson",
        source="redmine",
        created="2024-01-15 14:20:00",
        updated="2024-01-18 16:30:00",
        contactPerson="Alice Johnson (alice@company.com)",
        resolution="Fixed timeout configuration in mobile client",
        closedBy="Alice Johnson"
    ),
    SimilarIssue(
        id=202,
        title="Authentication service intermittent failures",
        description="Auth service occasionally returns 500 errors during login attempts",
        status="Closed",
        priority="High",
        assignee="Bob Wilson",
        source="redmine",
        created="2024-01-12 09:45:00",
        updated="2024-01-16 13:15:00",
        contactPerson="Bob Wilson (bob@company.com)",
        resolution="Updated authentication middleware and improved error handling",
        closedBy="Bob Wilson"
    ),
    SimilarIssue(
        id=303,
        title="User session management issues",
        description="Users getting logged out unexpectedly during active sessions",
        status="In Progress",
        priority="Medium",
        assignee="Carol Davis",
        source="mantis",
        created="2024-01-19 11:30:00",
        updated="2024-01-22 14:45:00",
        contactPerson="Carol Davis (carol@company.com)"
    ),
    SimilarIssue(
        id=404,
        title="Password reset functionality broken",
        description="Users unable to reset passwords through email link",
        status="Open",
        priority="High",
        assignee="David Brown",
        source="mantis",
        created="2024-01-20 16:00:00",
        updated="2024-01-23 10:30:00",
        contactPerson="David Brown (david@company.com)"
    )
]

# Auth helper functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# API Routes
@app.post("/api/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    user = users_db.get(request.username)
    if not user or not bcrypt.checkpw(request.password.encode('utf-8'), user["password"].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": request.username})
    return LoginResponse(
        token=token,
        user={"username": request.username}
    )

@app.get("/api/issues/{issue_id}", response_model=IssueDetails)
async def get_issue(issue_id: int, username: str = Depends(verify_token)):
    if issue_id == 99999:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    if issue_id not in mock_issues:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    return mock_issues[issue_id]

@app.get("/api/issues/{issue_id}/similar", response_model=List[SimilarIssue])
async def get_similar_issues(issue_id: int, username: str = Depends(verify_token)):
    if issue_id not in mock_issues:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    return mock_similar_issues

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Serve static files
if os.path.exists("client"):
    app.mount("/assets", StaticFiles(directory="client"), name="assets")

# Serve React app
@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API endpoint not found")
    return FileResponse("client/index.html")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    uvicorn.run(app, host="0.0.0.0", port=port, reload=True)