const express = require("express");
const app = express();

// Simple health endpoint for Docker healthchecks
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Start HTTP server (needed for Docker)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

// Import your existing CLI application so it still works
require("./main.js");

