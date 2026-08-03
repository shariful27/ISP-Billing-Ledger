import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const SYNC_FILE = path.join(process.cwd(), "sync_codes.json");

// Helper to read sync codes
function readSyncCodes(): Record<string, { data: string; createdAt: number }> {
  try {
    if (fs.existsSync(SYNC_FILE)) {
      const content = fs.readFileSync(SYNC_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Error reading sync file, resetting:", error);
  }
  return {};
}

// Helper to write sync codes
function writeSyncCodes(data: Record<string, { data: string; createdAt: number }>) {
  try {
    fs.writeFileSync(SYNC_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing sync file:", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API endpoints
  app.post("/api/sync/save", (req, res) => {
    try {
      const { data } = req.body;
      if (!data) {
        return res.status(400).json({ error: "No data provided" });
      }

      const codes = readSyncCodes();
      
      // Generate a unique 6-digit code
      let code = "";
      for (let i = 0; i < 10; i++) {
        const potentialCode = Math.floor(100000 + Math.random() * 900000).toString();
        if (!codes[potentialCode]) {
          code = potentialCode;
          break;
        }
      }
      
      if (!code) {
        code = Math.floor(100000 + Math.random() * 900000).toString();
      }

      codes[code] = {
        data,
        createdAt: Date.now()
      };

      // Clean up old codes older than 30 days
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      for (const k in codes) {
        if (codes[k].createdAt < thirtyDaysAgo) {
          delete codes[k];
        }
      }

      writeSyncCodes(codes);
      return res.json({ code });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/sync/load/:code", (req, res) => {
    try {
      const { code } = req.params;
      const codes = readSyncCodes();
      const record = codes[code];
      
      if (!record) {
        return res.status(404).json({ error: "কোডটি পাওয়া যায়নি বা মেয়াদ উত্তীর্ণ হয়েছে!" });
      }

      return res.json({ data: record.data });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // Serve static files / Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
