
import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [patients, setPatients] = useState([
    { token: 101, name: "Arun", department: "General Medicine" },
    { token: 102, name: "Priya", department: "Cardiology" },
    { token: 103, name: "Rahul", department: "General Medicine" },
    { token: 104, name: "Divya", department: "Pediatrics" },
    { token: 105, name: "Kumar", department: "Orthopaedics" }
  ]);

  const [servingToken, setServingToken] = useState(101);
  const [nextToken, setNextToken] = useState(106);

  const [name, setName] = useState("");
  const [department, setDepartment] = useState("General Medicine");
  const [myToken, setMyToken] = useState(null);
  const [adminMode, setAdminMode] = useState(false);

  // Automatically update queue every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setServingToken(old => old + 1);
    }, 15000);

    return () => clearInterval(timer);
  }, []);

  // Register patient
  const registerPatient = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter patient name");
      return;
    }

    const newPatient = {
      token: nextToken,
      name: name.trim(),
      department: department
    };

    setPatients(old => [...old, newPatient]);
    setMyToken(nextToken);
    setNextToken(old => old + 1);
    setName("");
  };

  // Admin calls next patient
  const callNextPatient = () => {
    setServingToken(old => old + 1);
  };

  // Get patient details
  const getPatient = (token) => {
    return patients.find(p => p.token === token);
  };

  // Queue position
  const getPosition = (token) => {
    return Math.max(0, token - servingToken);
  };

  const myPatient = myToken ? getPatient(myToken) : null;
  const myPosition = myToken ? getPosition(myToken) : 0;

  const waitingPatients = patients.filter(
    p => p.token > servingToken
  );

  return (
    <div className="app">

      <header>
        <h1>🏥 Smart Hospital Queue</h1>
        <p>Live Patient Queue Tracking System</p>

        <button onClick={() => setAdminMode(!adminMode)}>
          {adminMode ? "Patient Dashboard" : "Admin Dashboard"}
        </button>
      </header>

      {!adminMode ? (

        <main>

          <section className="card">
            <h2>Patient Registration</h2>

            <form onSubmit={registerPatient}>
              <input
                type="text"
                placeholder="Enter Patient Name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />

              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
              >
                <option>General Medicine</option>
                <option>Cardiology</option>
                <option>Orthopaedics</option>
                <option>Pediatrics</option>
              </select>

              <button type="submit">
                Generate Token
              </button>
            </form>
          </section>

          {myPatient && (
            <section className="card result">
              <h2>Your Queue Status</h2>

              <h1>Token #{myToken}</h1>

              <p>Patient: {myPatient.name}</p>
              <p>Department: {myPatient.department}</p>

              <div className="stats">
                <div>
                  <h2>{myPosition}</h2>
                  <p>People Ahead</p>
                </div>

                <div>
                  <h2>{myPosition * 5} min</h2>
                  <p>Estimated Waiting</p>
                </div>
              </div>

              <h3>
                {myPosition === 0
                  ? "🔔 It is your turn!"
                  : "⏳ Please wait for your turn"}
              </h3>
            </section>
          )}

          <section className="card">
            <h2>Live Queue Status</h2>

            <div className="serving">
              Currently Serving: #{servingToken}
            </div>

            <p>Patients Waiting: {waitingPatients.length}</p>

            <div className="queue">
              {patients.map(patient => (
                <div className="patient" key={patient.token}>
                  <div>
                    <strong>Token #{patient.token}</strong>
                    <p>{patient.name}</p>
                    <small>{patient.department}</small>
                  </div>

                  <span className={
                    patient.token < servingToken
                      ? "completed"
                      : patient.token === servingToken
                      ? "active"
                      : "waiting"
                  }>
                    {patient.token < servingToken
                      ? "Completed"
                      : patient.token === servingToken
                      ? "Serving"
                      : "Waiting"}
                  </span>
                </div>
              ))}
            </div>
          </section>

        </main>

      ) : (

        <main>
          <section className="card">
            <h2>Admin Dashboard</h2>

            <div className="stats">
              <div>
                <h2>#{servingToken}</h2>
                <p>Current Token</p>
              </div>

              <div>
                <h2>{waitingPatients.length}</h2>
                <p>Waiting Patients</p>
              </div>

              <div>
                <h2>{patients.length}</h2>
                <p>Total Registered</p>
              </div>
            </div>

            <button onClick={callNextPatient}>
              Call Next Patient →
            </button>

            <h3>Patient Queue Management</h3>

            {waitingPatients.map(patient => (
              <div className="patient" key={patient.token}>
                <div>
                  <strong>#{patient.token} - {patient.name}</strong>
                  <p>{patient.department}</p>
                </div>
                <span className="waiting">Waiting</span>
              </div>
            ))}
          </section>
        </main>

      )}

      <footer>
        <p>Smart Hospital Queue Tracking © 2026</p>
        <small>Demo mode: queue automatically refreshes every 15 seconds</small>
      </footer>

    </div>
  );
}

export default App;
