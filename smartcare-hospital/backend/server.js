
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const Patient = require("./models/Patient");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH"]
  }
});

app.use(cors());
app.use(express.json());

// Socket connection
io.on("connection", socket => {
  console.log("User connected:", socket.id);

  socket.on("joinDepartment", department => {
    socket.join(department);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Get queue details
async function getQueue(department) {
  const patients = await Patient.find({
    department
  }).sort({ token: 1 });

  const serving = patients.find(
    p => p.status === "SERVING"
  );

  const waiting = patients.filter(
    p => p.status === "WAITING"
  );

  return {
    department,
    serving,
    waiting,
    total: patients.length
  };
}

// Send updated queue to all users
async function broadcastQueue(department) {
  const queue = await getQueue(department);

  io.to(department).emit("queueUpdate", queue);
}

// Register patient
app.post("/api/patients", async (req, res) => {
  try {
    const { name, age, phone, department } = req.body;

    if (!name || !department) {
      return res.status(400).json({
        message: "Name and department are required"
      });
    }

    const last = await Patient.findOne({
      department
    }).sort({ token: -1 });

    const token = last ? last.token + 1 : 101;

    const patient = await Patient.create({
      name,
      age,
      phone,
      department,
      token
    });

    await broadcastQueue(department);

    res.status(201).json({
      message: "Registration successful",
      patient
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

// Get department queue
app.get("/api/queue/:department", async (req, res) => {
  try {
    const queue = await getQueue(req.params.department);
    res.json(queue);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

// Call next patient
app.patch("/api/queue/:department/next", async (req, res) => {
  try {
    const department = req.params.department;

    // Complete previous patient
    await Patient.updateMany(
      {
        department,
        status: "SERVING"
      },
      {
        $set: { status: "COMPLETED" }
      }
    );

    // Select next waiting patient
    const next = await Patient.findOneAndUpdate(
      {
        department,
        status: "WAITING"
      },
      {
        $set: { status: "SERVING" }
      },
      {
        sort: { token: 1 },
        new: true
      }
    );

    await broadcastQueue(department);

    res.json({
      message: next
        ? "Next patient called"
        : "No waiting patients",
      patient: next
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

// Skip patient
app.patch("/api/patients/:id/skip", async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { status: "SKIPPED" },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found"
      });
    }

    await broadcastQueue(patient.department);

    res.json({
      message: "Patient skipped",
      patient
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

// Start database and server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    server.listen(process.env.PORT, () => {
      console.log(
        `Server running on port ${process.env.PORT}`
      );
    });
  })
  .catch(error => {
    console.log("Database error:", error.message);
  });
