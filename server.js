import express from "express";
import cors from "cors";
import handler from "./api/chat.js";

const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  try {
    await handler(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message || "Internal Server Error",
    });
  }
});

app.get("/", (req, res) => {
  res.send("ManThink AI Backend is running.");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});