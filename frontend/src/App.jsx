
import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import {
  Activity, Users, Clock, CalendarDays,
  HeartPulse, Search, Bell, ArrowRight,
  CheckCircle, Stethoscope, Hospital,
  UserRound, LayoutDashboard
} from "lucide-react";
import "./App.css";

const API = "http://localhost:5000";

const departments = [
  "General Medicine",
  "Cardiology",
  "Orthopaedics",
  "Pediatrics"
];

const socket = io(API, { autoConnect: false });

function App() {
  const [page, setPage] = useState("home");
  const [department, setDepartment] = useState("General Medicine");
  const [queue, setQueue] = useState({
    serving: null,
    waiting: [],
    total: 0
  });

  const [patient, setPatient] = useState(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Connect to real-time queue
  useEffect(() => {
    socket.connect();

    socket.emit("joinDepartment", department);

    const updateQueue = data => {
      if (data.department === department) {
        setQueue(data);
      }
    };

    socket.on("queueUpdate", updateQueue);

    // Initial queue loading
    fetch(`${API}/api/queue/${encodeURIComponent(department)}`)
      .then(res => res.json())
      .then(data => setQueue(data))
      .catch(() => setMessage("Cannot connect to server"));

    return () => {
      socket.off("queueUpdate", updateQueue);
    };
  }, [department]);

  // Patient registration
  const register = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/api/patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          age: Number(age),
          phone,
          department
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setPatient(data.patient);

      // Remember ticket in this browser
      localStorage.setItem(
        "smartcareTicket",
        JSON.stringify(data.patient)
      );

      setName("");
      setAge("");
      setPhone("");
      setPage("tracking");

    } catch (error) {
      setMessage(error.message || "Registration failed");
    }

    setLoading(false);
  };

  // Call next patient
  const callNext = async () => {
    try {
      const response = await fetch(
        `${API}/api/queue/${encodeURIComponent(department)}/next`,
        { method: "PATCH" }
      );

      const data = await response.json();
      setMessage(data.message);

    } catch {
      setMessage("Unable to call next patient");
    }
  };

  // Skip patient
  const skipPatient = async id => {
    try {
      await fetch(`${API}/api/patients/${id}/skip`, {
        method: "PATCH"
      });
    } catch {
      setMessage("Unable to skip patient");
    }
  };

  // Restore ticket after refresh
  useEffect(() => {
    const saved = localStorage.getItem("smartcareTicket");

    if (saved) {
      setPatient(JSON.parse(saved));
    }
  }, []);

  // Find my current queue status
  const myPosition = patient
    ? queue.waiting.findIndex(
        p => p._id === patient._id
      )
    : -1;

  const isServing =
    patient &&
    queue.serving?._id === patient._id;

  const waitingTime = Math.max(0, myPosition + 1) * 5;

  const filteredPatients = queue.waiting.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    String(p.token).includes(search)
  );

  return (
    <div className="app">

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <HeartPulse size={27} />
          </div>
          <div>
            <h2>SmartCare</h2>
            <small>Hospital Management</small>
          </div>
        </div>

        <p className="menu-title">MAIN MENU</p>

        <button
          className={page === "home" ? "nav active" : "nav"}
          onClick={() => setPage("home")}
        >
          <LayoutDashboard size={19} />
          Overview
        </button>

        <button
          className={page === "register" ? "nav active" : "nav"}
          onClick={() => setPage("register")}
        >
          <CalendarDays size={19} />
          Book Appointment
        </button>

        <button
          className={page === "tracking" ? "nav active" : "nav"}
          onClick={() => setPage("tracking")}
        >
          <Activity size={19} />
          Live Queue
        </button>

        <button
          className={page === "admin" ? "nav active" : "nav"}
          onClick={() => setPage("admin")}
        >
          <Users size={19} />
          Staff Dashboard
        </button>

        <div className="sidebar-bottom">
          <HeartPulse size={22} />
          <p>Your health, our priority.</p>
          <small>SmartCare © 2026</small>
        </div>
      </aside>

      {/* Main content */}
      <main className="main">

        <header className="topbar">
          <div>
            <h2>Welcome to SmartCare 👋</h2>
            <p>Manage your hospital visit easily.</p>
          </div>

          <div className="top-actions">
            <span className="online">
              <span></span> Live System
            </span>
            <Bell size={22} />
            <div className="avatar">SC</div>
          </div>
        </header>

        {/* Department selector */}
        <div className="department-bar">
          <label>Choose Department</label>
          <select
            value={department}
            onChange={e => setDepartment(e.target.value)}
          >
            {departments.map(d => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>

        {message && (
          <div className="message">
            {message}
            <button onClick={() => setMessage("")}>×</button>
          </div>
        )}

        {/* HOME */}
        {page === "home" && (
          <>
            <section className="hero">
              <div>
                <span className="hero-tag">
                  <HeartPulse size={15} /> SMART HEALTHCARE
                </span>

                <h1>
                  Less Waiting.<br />
                  <span>Better Healing.</span>
                </h1>

                <p>
                  Track your hospital queue in real time.
                  Spend less time waiting and more time caring
                  for your health.
                </p>

                <button
                  className="hero-btn"
                  onClick={() => setPage("register")}
                >
                  Book Your Visit <ArrowRight size={17} />
                </button>
              </div>

              <div className="hero-art">
  <div className="art-circle">
    <span style={{ fontSize: 85 }}>
      {{
        "General Medicine": "🩺",
        "Cardiology": "❤️",
        "Orthopaedics": "🦴",
        "Pediatrics": "👶"
      }[department]}
    </span>
  </div>

  <div className="floating-card">
    <Activity size={20} />
    <div>
      <strong>{department}</strong>
      <small>Department selected</small>
    </div>
  </div>
</div>
            </section>

            <h2 className="section-heading">Hospital Overview</h2>

            <div className="stats-grid">
              <Stat
                icon={<Users />}
                title="Total Patients"
                value={queue.total}
              />
              <Stat
                icon={<Clock />}
                title="Waiting Patients"
                value={queue.waiting.length}
              />
              <Stat
                icon={<Stethoscope />}
                title="Currently Serving"
                value={queue.serving?.token || "—"}
              />
              <Stat
                icon={<CheckCircle />}
                title="Departments"
                value={departments.length}
              />
            </div>

            <section className="content-card">
              <h2>Available Departments</h2>

              <div className="department-grid">
                {departments.map((d, i) => (
                  <button
                    className="department-card"
                    key={d}
                    onClick={() => {
                      setDepartment(d);
                      setPage("tracking");
                    }}
                  >
                    <div className="department-icon">
                      {["🩺", "❤️", "🦴", "👶"][i]}
                    </div>
                    <strong>{d}</strong>
                    <span>View Live Queue →</span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

        {/* REGISTRATION */}
        {page === "register" && (
          <section className="form-card">
            <div className="form-heading">
              <div className="form-icon">
                <CalendarDays />
              </div>
              <h1>Patient Registration</h1>
              <p>Enter your details to generate a digital token.</p>
            </div>

            <form onSubmit={register}>
              <label>Patient Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your full name"
                required
              />

              <label>Age</label>
              <input
                type="number"
                min="1"
                max="120"
                value={age}
                onChange={e => setAge(e.target.value)}
                placeholder="Enter age"
                required
              />

              <label>Mobile Number</label>
              <input
                type="tel"
                pattern="[0-9]{10}"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="10 digit mobile number"
                required
              />

              <label>Department</label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
              >
                {departments.map(d => (
                  <option key={d}>{d}</option>
                ))}
              </select>

              <button className="primary-btn" disabled={loading}>
                {loading ? "Registering..." : "Generate My Token →"}
              </button>
            </form>
          </section>
        )}

        {/* PATIENT TRACKING */}
        {page === "tracking" && (
          <section className="content-card">
            <div className="section-top">
              <div>
                <h1>Live Queue Tracking</h1>
                <p>Real-time patient queue information</p>
              </div>
              <span className="live-tag">● LIVE</span>
            </div>

            <div className="current-serving">
              <div>
                <small>CURRENTLY SERVING</small>
                <h1>
                  #{queue.serving?.token || "—"}
                </h1>
                <p>
                  {queue.serving?.name || "No patient currently serving"}
                </p>
              </div>
              <div className="serving-art">
                <Activity size={65} />
              </div>
            </div>

            {patient && patient.department === department ? (
              <div className="ticket-card">
                <small>YOUR DIGITAL TOKEN</small>
                <h1>#{patient.token}</h1>
                <p>{patient.name}</p>

                <div className="ticket-stats">
                  <div>
                    <h2>
                      {isServing ? 0 : myPosition >= 0 ? myPosition : "—"}
                    </h2>
                    <p>People Ahead</p>
                  </div>

                  <div>
                    <h2>
                      {isServing ? "Now" : myPosition >= 0 ? `${waitingTime} min` : "—"}
                    </h2>
                    <p>Estimated Wait</p>
                  </div>
                </div>

                <h3>
                  {isServing
                    ? "🔔 Your turn! Please proceed."
                    : myPosition >= 0
                    ? "⏳ Please wait for your turn"
                    : "Your ticket is not in the current waiting list."}
                </h3>
              </div>
            ) : (
              <div className="empty">
                <UserRound size={45} />
                <h3>No ticket selected</h3>
                <p>Register to get your digital token.</p>
                <button onClick={() => setPage("register")}>
                  Register Now
                </button>
              </div>
            )}

            <h2>Waiting Queue</h2>

            {queue.waiting.map(p => (
              <div className="queue-row" key={p._id}>
                <strong>#{p.token}</strong>
                <span>{p.name}</span>
                <span className="waiting-label">Waiting</span>
              </div>
            ))}
          </section>
        )}

        {/* ADMIN */}
        {page === "admin" && (
          <section className="content-card">
            <div className="section-top">
              <div>
                <h1>Staff Dashboard</h1>
                <p>Manage the selected department queue.</p>
              </div>
              <span className="live-tag">● LIVE</span>
            </div>

            <div className="admin-current">
              <p>NOW SERVING</p>
              <h1>#{queue.serving?.token || "—"}</h1>
              <h3>{queue.serving?.name || "No active patient"}</h3>

              <button onClick={callNext}>
                Call Next Patient →
              </button>
            </div>

            <div className="stats-grid">
              <Stat
                icon={<Users />}
                title="Waiting"
                value={queue.waiting.length}
              />
              <Stat
                icon={<Activity />}
                title="Registered"
                value={queue.total}
              />
            </div>

            <div className="search-box">
              <Search size={19} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search patient or token..."
              />
            </div>

            <h2>Patient Management</h2>

            {filteredPatients.map(p => (
              <div className="queue-row" key={p._id}>
                <div>
                  <strong>#{p.token} - {p.name}</strong>
                  <small>{p.phone}</small>
                </div>
                <button
                  className="skip-btn"
                  onClick={() => skipPatient(p._id)}
                >
                  Skip
                </button>
              </div>
            ))}
          </section>
        )}

      </main>
    </div>
  );
}

function Stat({ icon, title, value }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <p>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

export default App;
