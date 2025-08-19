import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication endpoint for FastAPI compatibility
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Check credentials (matching FastAPI backend)
      if (username === "Poovarasan" && password === "secret") {
        // Generate a simple token (in production, use proper JWT)
        const token = `mock-jwt-token-${Date.now()}`;
        
        res.json({
          token,
          user: { username }
        });
      } else {
        res.status(401).json({ 
          detail: "Invalid credentials" 
        });
      }
    } catch (error) {
      res.status(500).json({ 
        detail: "Login failed" 
      });
    }
  });

  // Issues endpoints
  app.get("/api/issues/:id", async (req, res) => {
    try {
      const issueId = parseInt(req.params.id);
      
      if (issueId === 99999) {
        return res.status(404).json({ detail: "Issue not found" });
      }
      
      // Mock issue data matching FastAPI backend
      const mockIssue = {
        id: issueId,
        title: `Critical Bug in Authentication Module #${issueId}`,
        description: `This is a critical issue that needs immediate attention. The authentication module is failing to validate user credentials properly in certain edge cases. This affects user login functionality and could potentially lead to security vulnerabilities if not addressed promptly.`,
        status: "Open",
        priority: "High",
        assignee: "Sarah Johnson",
        reporter: "Mike Chen",
        created: "2024-01-15T09:30:00Z",
        updated: "2024-01-16T14:22:00Z",
        resolution: null,
        fix_version: "v2.1.3",
        component: "Authentication",
        labels: ["critical", "security", "authentication"],
        rca_details: {
          root_cause: "The password validation logic was not properly handling special characters in user passwords, causing legitimate login attempts to fail.",
          analysis: "After thorough investigation, we found that the regex pattern used for password validation was incorrectly escaping certain special characters, particularly those commonly used in strong passwords like @, #, and $.",
          steps_taken: [
            "Reviewed authentication logs for the past 30 days",
            "Identified pattern of failed logins with special character passwords",
            "Analyzed the password validation regex",
            "Tested with various password combinations",
            "Confirmed the bug affects approximately 15% of user accounts"
          ]
        },
        fix_details: {
          solution: "Updated the password validation regex to properly handle all special characters as per OWASP password guidelines.",
          implementation: "Modified the validatePassword() function in auth.service.js to use a corrected regex pattern that properly escapes special characters.",
          testing: [
            "Unit tests for password validation with various character combinations",
            "Integration tests for login flow",
            "Manual testing with affected user accounts",
            "Security audit of the authentication module"
          ],
          deployment: "Fix deployed to staging environment and tested. Ready for production deployment with the next release cycle."
        },
        svn_details: {
          revision: "r15847",
          author: "john.developer",
          date: "2024-01-16T10:15:00Z",
          message: "Fix password validation regex to handle special characters properly",
          files_changed: [
            "/src/services/auth.service.js",
            "/tests/unit/auth.test.js",
            "/tests/integration/login.test.js"
          ],
          diff_summary: "Modified regex pattern in validatePassword function, added comprehensive test cases"
        }
      };
      
      res.json(mockIssue);
    } catch (error) {
      res.status(500).json({ detail: "Failed to fetch issue" });
    }
  });

  app.get("/api/issues/:id/similar", async (req, res) => {
    try {
      // Mock similar issues data
      const similarIssues = [
        {
          id: 8234,
          title: "Authentication timeout issues",
          status: "Resolved",
          priority: "High",
          source: "redmine",
          description: "Users experiencing random authentication timeouts during login process",
          assignee: "Alice Smith",
          contactPerson: "alice.smith@company.com",
          created: "2024-01-15 10:30:00",
          updated: "2024-01-22 14:45:00",
          resolution: "Increased session timeout configuration and optimized database queries"
        },
        {
          id: 3456,
          title: "Login validation errors with special characters",
          status: "Closed",
          priority: "Medium",
          source: "mantis",
          description: "Login form rejecting valid passwords containing special characters",
          assignee: "Bob Wilson",
          contactPerson: "bob.wilson@company.com",
          created: "2024-01-18 09:15:00",
          updated: "2024-01-25 16:20:00",
          resolution: "Updated input validation rules to accept all printable ASCII characters"
        },
        {
          id: 9876,
          title: "Session timeout configuration errors",
          status: "Open",
          priority: "High",
          source: "redmine",
          description: "Authentication sessions expiring too quickly causing user frustration",
          assignee: "Carol Davis",
          contactPerson: "carol.davis@company.com",
          created: "2024-01-20 13:45:00",
          updated: "2024-01-23 11:30:00"
        },
        {
          id: 5432,
          title: "Login form validation bypass",
          status: "In Progress",
          priority: "Medium",
          source: "mantis",
          description: "Users can bypass client-side validation on login forms",
          assignee: "David Martinez",
          contactPerson: "david.martinez@company.com",
          created: "2024-01-22 08:00:00",
          updated: "2024-01-24 15:10:00"
        }
      ];
      
      res.json(similarIssues);
    } catch (error) {
      res.status(500).json({ detail: "Failed to fetch similar issues" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString() 
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
