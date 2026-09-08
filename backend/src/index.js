require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { toNodeHandler } = require("better-auth/node");
const { auth } = require("./auth");
const webhookRouter = require("./routes/webhook");
const adminDataRouter = require("./routes/adminData");

const app = express();

app.use(
  cors({
    origin: process.env.ADMIN_FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Better Auth needs the raw request stream, so it must be mounted before express.json().
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.use("/webhook", webhookRouter);
app.use("/api/admin", adminDataRouter);

app.get("/", (req, res) => {
  res.send("WhatsApp trial bot is running.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
