import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import { users, issues, loginSchema } from "../shared/schema.js";
import { eq } from "drizzle-orm";
import MemoryStore from "memorystore";
import { createServer as createViteServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = parseInt(process.env.PORT || "5000");

// Database setup
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema: { users, issues } });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
const MemoryStoreSession = MemoryStore(session);
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStoreSession({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport configuration
passport.use(new LocalStrategy(
  async (username: string, password: string, done) => {
    try {
      const defaultUser = {
        id: "1",
        username: "Poovarasan",
        password: "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW"
      };
      
      if (username !== defaultUser.username) {
        return done(null, false, { message: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, defaultUser.password);
      if (!isValidPassword) {
        return done(null, false, { message: 'Invalid credentials' });
      }

      return done(null, defaultUser);
    } catch (error) {
      return done(error);
    }
  }
));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  if (id === "1") {
    done(null, { id: "1", username: "Poovarasan" });
  } else {
    done(null, null);
  }
});

app.use(passport.initialize());
app.use(passport.session());

// JWT helper functions
const JWT_SECRET = process.env.JWT_SECRET_KEY || 'your-secret-key-change-in-production';

const createAccessToken = (data: { sub: string }) => {
  return jwt.sign(data, JWT_SECRET, { expiresIn: '24h' });
};

const verifyToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Invalid token' });
  }

  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.user = { username: payload.sub };
    next();
  } catch (error) {
    return res.status(401).json({ detail: 'Invalid token' });
  }
};

// Mock data (similar to Python version)
const mockIssuesData = {
  1234: {
    id: 1234,
    title: "User login authentication error",
    description: "Users are experiencing intermittent login failures with 'Invalid credentials' message even when using correct username and password.",
    status: "Open",
    priority: "High",
    assignee: "John Doe",
    created: "2024-01-20 10:30:00",
    updated: "2024-01-22 15:45:00"
  },
  5678: {
    id: 5678,
    title: "Database connection timeout",
    description: "Application occasionally fails to connect to the database during peak hours.",
    status: "In Progress",
    priority: "Medium",
    assignee: "Jane Smith",
    created: "2024-01-21 09:15:00",
    updated: "2024-01-23 11:20:00"
  }
};

const mockSimilarIssues = [
  {
    id: 101,
    title: "Login timeout on mobile app",
    description: "Mobile users experiencing login timeouts after 30 seconds",
    status: "Resolved",
    priority: "High",
    assignee: "Alice Johnson",
    source: "redmine",
    created: "2024-01-15 14:20:00",
    updated: "2024-01-18 16:30:00",
    contactPerson: "alice.johnson@company.com",
    similarity_percentage: 92.5,
    resolution: "Fixed timeout configuration in mobile client",
    closedBy: "Alice Johnson"
  },
  {
    id: 102,
    title: "Authentication service intermittent failures",
    description: "Auth service occasionally returns 500 errors during login attempts",
    status: "Closed",
    priority: "High",
    assignee: "Bob Wilson",
    source: "redmine",
    created: "2024-01-12 09:45:00",
    updated: "2024-01-16 13:15:00",
    contactPerson: "bob.wilson@company.com",
    similarity_percentage: 88.3,
    resolution: "Updated authentication middleware and improved error handling",
    closedBy: "Bob Wilson"
  },
  {
    id: 201,
    title: "User session management issues",
    description: "Users getting logged out unexpectedly during active sessions",
    status: "Open",
    priority: "High",
    assignee: "Carol Davis",
    source: "mantis",
    created: "2024-01-19 11:30:00",
    updated: "2024-01-22 14:45:00",
    contactPerson: "carol.davis@company.com",
    similarity_percentage: 90.2
  },
  {
    id: 202,
    title: "Password reset functionality broken",
    description: "Users unable to reset passwords through email link",
    status: "In Progress",
    priority: "High",
    assignee: "David Brown",
    source: "mantis",
    created: "2024-01-20 16:00:00",
    updated: "2024-01-23 10:30:00",
    contactPerson: "david.brown@company.com",
    similarity_percentage: 86.4
  }
].sort((a, b) => b.similarity_percentage - a.similarity_percentage);

// API Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = loginSchema.parse(req.body);
    
    // For development, use hardcoded credentials
    const defaultUser = {
      username: "Poovarasan",
      password: "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW" // "secret" hashed
    };

    if (username !== defaultUser.username) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, defaultUser.password);
    if (!isValidPassword) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }

    const token = createAccessToken({ sub: username });
    res.json({
      token,
      user: { 
        username,
        fullName: "Poovarasan" // Provide full name for welcome message
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

app.get('/api/issues/:issueId', verifyToken, async (req, res) => {
  const issueId = parseInt(req.params.issueId);
  
  if (issueId === 99999) {
    return res.json({
      id: 99999,
      title: "Redmine Authentication Issue",
      description: "Critical authentication issue in Redmine system causing login failures for multiple users. This issue requires immediate attention to prevent service disruption.",
      status: "Open",
      priority: "High",
      assignee: "Michael Johnson",
      created: "2024-01-23 08:15:00",
      updated: "2024-01-23 12:30:00"
    });
  }

  const issue = mockIssuesData[issueId as keyof typeof mockIssuesData];
  if (!issue) {
    // Default issue for other IDs
    return res.json({
      id: issueId,
      title: `Critical Bug in Authentication Module #${issueId}`,
      description: `This is a critical issue that needs immediate attention. The authentication module is failing to validate user credentials properly in certain edge cases. This affects user login functionality and could potentially lead to security vulnerabilities if not addressed promptly.`,
      status: "Open",
      priority: "High",
      assignee: "Sarah Johnson",
      created: "2024-01-15 09:30:00",
      updated: "2024-01-16 14:22:00"
    });
  }

  res.json(issue);
});

app.get('/api/issues/:issueId/similar', verifyToken, async (req, res) => {
  const issueId = parseInt(req.params.issueId);
  
  if (issueId === 99999) {
    return res.status(404).json({ detail: "No similar issues found" });
  }

  res.json(mockSimilarIssues);
});

app.get('/api/health', (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

// Setup client serving and start server
async function setupServer() {
  if (process.env.NODE_ENV === 'development') {
    // Enable file watching with polling for containerized environments
    process.env.CHOKIDAR_USEPOLLING = '1';
    process.env.CHOKIDAR_INTERVAL = '300';
    
    // Allow all hosts for Replit dynamic hostnames
    process.env.DANGEROUSLY_DISABLE_HOST_CHECK = 'true';
    
    // Create Vite server in middleware mode with host configuration
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: {
          port: 24678
        },
        host: '0.0.0.0',
        allowedHosts: 'all'
      },
      appType: 'spa'
    });
    
    // Use vite's connect instance as middleware
    app.use(vite.middlewares);
  } else {
    // Production: Serve static files from the built frontend
    const distPath = path.resolve(__dirname, "../dist/public");
    app.use('/assets', express.static(path.join(distPath, 'assets')));

    // Serve React app for client routing (SPA fallback)
    app.get('*', (req, res) => {
      // Don't serve SPA for API routes
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ detail: "API endpoint not found" });
      }
      
      // Serve the React app index.html for all other routes
      res.sendFile(path.join(distPath, 'index.html'), (err) => {
        if (err) {
          // Fallback if build doesn't exist
          res.sendFile(path.resolve(__dirname, "../client/index.html"));
        }
      });
    });
  }

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ detail: 'Internal server error' });
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

// Start the server
setupServer().catch(console.error);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT. Graceful shutdown...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Graceful shutdown...');
  process.exit(0);
});