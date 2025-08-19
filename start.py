#!/usr/bin/env python3
import subprocess
import sys
import time
import os
import signal

def kill_existing_processes():
    """Kill any existing Node.js or Python processes on port 5000"""
    try:
        # Kill Node.js processes
        subprocess.run(["pkill", "-f", "npm"], capture_output=True)
        subprocess.run(["pkill", "-f", "tsx"], capture_output=True)
        subprocess.run(["pkill", "-f", "node"], capture_output=True)
        subprocess.run(["pkill", "-f", "express"], capture_output=True)
        
        # Kill Python processes
        subprocess.run(["pkill", "-f", "uvicorn"], capture_output=True)
        subprocess.run(["pkill", "-f", "fastapi"], capture_output=True)
        subprocess.run(["pkill", "-f", "main.py"], capture_output=True)
        
        # Kill any process using port 5000
        subprocess.run(["fuser", "-k", "5000/tcp"], capture_output=True, stderr=subprocess.DEVNULL)
        
        time.sleep(2)  # Give processes time to terminate
    except Exception as e:
        print(f"Note: Some cleanup operations failed: {e}")

def start_server():
    """Start the FastAPI server"""
    try:
        print("🚀 Starting FastAPI Issue Tracker...")
        print("📍 Server will be available at: http://localhost:5000")
        print("🔑 Login credentials: Username: Poovarasan, Password: secret")
        print("=" * 60)
        
        # Run the server
        exec(open("main.py").read())
        
    except KeyboardInterrupt:
        print("\n⏹️  Server stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Handle graceful shutdown
    def signal_handler(sig, frame):
        print("\n⏹️  Shutting down server...")
        kill_existing_processes()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Clean up any existing processes
    kill_existing_processes()
    
    # Start the server
    start_server()