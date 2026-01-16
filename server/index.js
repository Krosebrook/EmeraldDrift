const express = require("express");
const session = require("express-session");
const cors = require("cors");
const { getUserInfo } = require("@replit/repl-auth");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || "creator-studio-session-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

app.get("/api/auth/me", async (req, res) => {
  const userInfo = getUserInfo(req);
  
  if (!userInfo) {
    if (req.session && req.session.userId) {
      return res.json({
        authenticated: true,
        user: {
          id: req.session.userId,
          name: req.session.userName,
          profileImage: req.session.profileImage,
        },
      });
    }
    return res.status(401).json({ 
      authenticated: false,
      user: null,
    });
  }

  req.session.userId = userInfo.id;
  req.session.userName = userInfo.name;
  req.session.profileImage = userInfo.profileImage;

  res.json({
    authenticated: true,
    user: {
      id: userInfo.id,
      name: userInfo.name,
      bio: userInfo.bio,
      url: userInfo.url,
      profileImage: userInfo.profileImage,
      roles: userInfo.roles || [],
      teams: userInfo.teams || [],
    },
  });
});

app.get("/api/auth/login", async (req, res) => {
  const userInfo = getUserInfo(req);
  
  if (!userInfo) {
    return res.status(401).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Login - Creator Studio</title></head>
        <body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <div style="background: white; padding: 2rem; border-radius: 1rem; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
            <h2 style="margin-bottom: 1rem; color: #333;">Welcome to Creator Studio</h2>
            <p style="color: #666; margin-bottom: 1.5rem;">Sign in with your Replit account to continue</p>
            <script src="https://replit.com/public/js/repl-auth-v2.js"></script>
          </div>
        </body>
      </html>
    `);
  }
  
  req.session.userId = userInfo.id;
  req.session.userName = userInfo.name;
  req.session.profileImage = userInfo.profileImage;
  
  res.json({
    success: true,
    user: {
      id: userInfo.id,
      name: userInfo.name,
      profileImage: userInfo.profileImage,
      roles: userInfo.roles || [],
    },
  });
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to logout" });
    }
    res.json({ success: true });
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Auth server running on port ${PORT}`);
});
