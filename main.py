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
    similarity_percentage: float
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

# Mock similar issues data with top 5 from each system and similarity percentages
redmine_similar_issues = [
    SimilarIssue(
        id=101,
        title="Login timeout on mobile app",
        description="Mobile users experiencing login timeouts after 30 seconds",
        status="Resolved",
        priority="High",
        assignee="Alice Johnson",
        source="redmine",
        created="2024-01-15 14:20:00",
        updated="2024-01-18 16:30:00",
        contactPerson="alice.johnson@company.com",
        similarity_percentage=92.5,
        resolution="Fixed timeout configuration in mobile client",
        closedBy="Alice Johnson"
    ),
    SimilarIssue(
        id=102,
        title="Authentication service intermittent failures",
        description="Auth service occasionally returns 500 errors during login attempts",
        status="Closed",
        priority="High",
        assignee="Bob Wilson",
        source="redmine",
        created="2024-01-12 09:45:00",
        updated="2024-01-16 13:15:00",
        contactPerson="bob.wilson@company.com",
        similarity_percentage=88.3,
        resolution="Updated authentication middleware and improved error handling",
        closedBy="Bob Wilson"
    ),
    SimilarIssue(
        id=103,
        title="Login validation errors with special characters",
        description="Login form rejecting valid passwords containing special characters",
        status="Open",
        priority="Medium",
        assignee="Charlie Davis",
        source="redmine",
        created="2024-01-18 11:15:00",
        updated="2024-01-21 09:30:00",
        contactPerson="charlie.davis@company.com",
        similarity_percentage=85.7
    ),
    SimilarIssue(
        id=104,
        title="Session management authentication issues",
        description="Users authentication fails after session timeout without proper error message",
        status="In Progress",
        priority="Medium",
        assignee="Diana Martinez",
        source="redmine",
        created="2024-01-19 15:45:00",
        updated="2024-01-22 14:20:00",
        contactPerson="diana.martinez@company.com",
        similarity_percentage=82.1
    ),
    SimilarIssue(
        id=105,
        title="Auth token expiration handling",
        description="Authentication tokens expire without user notification causing login confusion",
        status="Open",
        priority="Low",
        assignee="Edward Thompson",
        source="redmine",
        created="2024-01-16 13:30:00",
        updated="2024-01-20 11:45:00",
        contactPerson="edward.thompson@company.com",
        similarity_percentage=78.9
    )
]

mantis_similar_issues = [
    SimilarIssue(
        id=201,
        title="User session management issues",
        description="Users getting logged out unexpectedly during active sessions",
        status="Open",
        priority="High",
        assignee="Carol Davis",
        source="mantis",
        created="2024-01-19 11:30:00",
        updated="2024-01-22 14:45:00",
        contactPerson="carol.davis@company.com",
        similarity_percentage=90.2
    ),
    SimilarIssue(
        id=202,
        title="Password reset functionality broken",
        description="Users unable to reset passwords through email link",
        status="In Progress",
        priority="High",
        assignee="David Brown",
        source="mantis",
        created="2024-01-20 16:00:00",
        updated="2024-01-23 10:30:00",
        contactPerson="david.brown@company.com",
        similarity_percentage=86.4
    ),
    SimilarIssue(
        id=203,
        title="Login redirect issues after authentication",
        description="After successful login, users are redirected to wrong page or blank screen",
        status="Resolved",
        priority="Medium",
        assignee="Eva Rodriguez",
        source="mantis",
        created="2024-01-14 10:15:00",
        updated="2024-01-17 16:20:00",
        contactPerson="eva.rodriguez@company.com",
        similarity_percentage=83.7,
        resolution="Fixed redirect URL configuration in authentication module",
        closedBy="Eva Rodriguez"
    ),
    SimilarIssue(
        id=204,
        title="Multi-factor authentication bypass",
        description="Users can sometimes bypass MFA during login process",
        status="Closed",
        priority="High",
        assignee="Frank Wilson",
        source="mantis",
        created="2024-01-11 08:45:00",
        updated="2024-01-15 12:30:00",
        contactPerson="frank.wilson@company.com",
        similarity_percentage=80.1,
        resolution="Implemented strict MFA validation checks",
        closedBy="Frank Wilson"
    ),
    SimilarIssue(
        id=205,
        title="Login form validation client-side bypass",
        description="Client-side validation for login form can be bypassed allowing invalid input",
        status="Open",
        priority="Low",
        assignee="Grace Lee",
        source="mantis",
        created="2024-01-17 14:20:00",
        updated="2024-01-21 09:15:00",
        contactPerson="grace.lee@company.com",
        similarity_percentage=75.8
    )
]

# Combine and sort by similarity percentage (top 5 from each system)
mock_similar_issues = sorted(redmine_similar_issues + mantis_similar_issues, key=lambda x: x.similarity_percentage, reverse=True)

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
        # Return a Redmine issue for 99999
        return IssueDetails(
            id=99999,
            title="Redmine Authentication Issue",
            description="Critical authentication issue in Redmine system causing login failures for multiple users. This issue requires immediate attention to prevent service disruption.",
            status="Open",
            priority="High",
            assignee="Michael Johnson",
            created="2024-01-23 08:15:00",
            updated="2024-01-23 12:30:00"
        )
    
    if issue_id not in mock_issues:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    return mock_issues[issue_id]

@app.get("/api/issues/{issue_id}/similar", response_model=List[SimilarIssue])
async def get_similar_issues(issue_id: int, username: str = Depends(verify_token)):
    if issue_id == 99999:
        # For 99999, return 404 to trigger "No matches found"
        raise HTTPException(status_code=404, detail="No similar issues found")
    
    if issue_id not in mock_issues:
        # Default issue data for other IDs
        mock_issues[issue_id] = IssueDetails(
            id=issue_id,
            title=f"Critical Bug in Authentication Module #{issue_id}",
            description=f"This is a critical issue that needs immediate attention. The authentication module is failing to validate user credentials properly in certain edge cases. This affects user login functionality and could potentially lead to security vulnerabilities if not addressed promptly.",
            status="Open",
            priority="High",
            assignee="Sarah Johnson",
            created="2024-01-15 09:30:00",
            updated="2024-01-16 14:22:00"
        )
    
    # Return sorted similar issues (already sorted by similarity percentage)
    return mock_similar_issues

# Mock MySQL query index data
mock_mysql_query_data = {
    101: {
        "queryCount": 3,
        "queries": [
            {
                "id": "query-101-1",
                "query": "SELECT * FROM issues WHERE status = 'open' AND priority = 'high'",
                "description": "Fetch high priority open issues",
                "executionTime": "0.15ms",
                "resultCount": 42
            },
            {
                "id": "query-101-2", 
                "query": "UPDATE issues SET last_accessed = NOW() WHERE id = 101",
                "description": "Update issue last accessed timestamp",
                "executionTime": "0.08ms",
                "resultCount": 1
            },
            {
                "id": "query-101-3",
                "query": "SELECT COUNT(*) FROM user_actions WHERE issue_id = 101 AND action_type = 'view'",
                "description": "Count view actions for issue",
                "executionTime": "0.12ms", 
                "resultCount": 1
            }
        ]
    },
    102: {
        "queryCount": 2,
        "queries": [
            {
                "id": "query-102-1",
                "query": "SELECT * FROM authentication_logs WHERE user_id IN (SELECT user_id FROM issue_assignments WHERE issue_id = 102)",
                "description": "Authentication logs for assigned users",
                "executionTime": "0.25ms",
                "resultCount": 18
            },
            {
                "id": "query-102-2",
                "query": "INSERT INTO issue_history (issue_id, action, timestamp) VALUES (102, 'status_change', NOW())",
                "description": "Log status change in issue history",
                "executionTime": "0.05ms",
                "resultCount": 1
            }
        ]
    },
    201: {
        "queryCount": 4,
        "queries": [
            {
                "id": "query-201-1",
                "query": "SELECT session_id, user_id, created_at FROM user_sessions WHERE status = 'active'",
                "description": "Get active user sessions",
                "executionTime": "0.18ms",
                "resultCount": 156
            },
            {
                "id": "query-201-2",
                "query": "SELECT COUNT(*) FROM session_timeouts WHERE timeout_reason = 'inactivity'",
                "description": "Count inactivity timeout occurrences", 
                "executionTime": "0.09ms",
                "resultCount": 1
            },
            {
                "id": "query-201-3",
                "query": "UPDATE user_preferences SET session_timeout = 3600 WHERE user_id = ?",
                "description": "Update user session timeout preference",
                "executionTime": "0.07ms",
                "resultCount": 1
            },
            {
                "id": "query-201-4",
                "query": "SELECT * FROM audit_logs WHERE table_name = 'user_sessions' AND action = 'logout'",
                "description": "Audit logout events from session table",
                "executionTime": "0.22ms",
                "resultCount": 89
            }
        ]
    }
    # Issues like 203, 204, 205 will have no MySQL query data (empty response)
}

@app.get("/api/mysql_query_index/{issue_id}")
async def get_mysql_query_index(issue_id: int, username: str = Depends(verify_token)):
    """Get MySQL query index data for a specific issue ID"""
    if issue_id in mock_mysql_query_data:
        return mock_mysql_query_data[issue_id]
    else:
        # Return empty query data for issues without MySQL queries
        return {
            "queryCount": 0,
            "queries": []
        }

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Serve static files from the built frontend
if os.path.exists("dist/public"):
    app.mount("/assets", StaticFiles(directory="dist/public/assets"), name="assets")
    
    # Serve React app for client routing (SPA fallback)
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        # Don't serve SPA for API routes
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        # Serve the React app index.html for all other routes
        return FileResponse("dist/public/index.html")
else:
    # Fallback: Serve React app for client routing if build directory doesn't exist  
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        return FileResponse("index.html")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)