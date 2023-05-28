const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = 5000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "hello!neeraj",
  database: "crudtestdb",
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("Connected to MySQL database!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Create student attendance
app.post("/attendance", (req, res) => {
  const { studentId, date, present } = req.body;
  const query = `INSERT INTO attendance (student_id, date, present) VALUES ('${studentId}', '${date}', ${present})`;

  db.query(query, (err, result) => {
    if (err) {
      throw err;
    }
    const attendanceId = result.id;

    // Fetch the updated attendance record
    const fetchQuery = "SELECT * FROM attendance ";
    db.query(fetchQuery, (fetchErr, fetchResult) => {
      if (fetchErr) {
        throw fetchErr;
      }

      // Check if the record exists
      if (fetchResult.length === 0) {
        return res.status(404).json({ error: "Attendance record not found" });
      }

      // Serialize the updated record and send as JSON response
      const updatedRecord = fetchResult[0];
      res.json(updatedRecord);
    });
  });
});

// Read student attendance
app.get("/attendance", (req, res) => {
  const query = "SELECT * FROM attendance";

  db.query(query, (err, result) => {
    if (err) {
      throw err;
    }
    res.json(result);
  });
});

// Update student attendance
app.put("/attendance/:id", (req, res) => {
  const attendanceId = req.params.id;
  const { present } = req.body;
  const query = "UPDATE attendance SET present = ? WHERE id = ?";
  const values = [present, attendanceId];

  db.query(query, values, (err, result) => {
    if (err) {
      throw err;
    }

    // Fetch the updated attendance record
    const fetchQuery = "SELECT * FROM attendance WHERE id = ?";
    db.query(fetchQuery, [attendanceId], (fetchErr, fetchResult) => {
      if (fetchErr) {
        throw fetchErr;
      }

      // Check if the record exists
      if (fetchResult.length === 0) {
        return res.status(404).json({ error: "Attendance record not found" });
      }

      // Serialize the updated record and send as JSON response
      const updatedRecord = fetchResult[0];
      res.json(updatedRecord);
    });
  });
});

// Delete student attendance
app.delete("/attendance/:id", (req, res) => {
  const attendanceId = req.params.id;
  const query = `DELETE FROM attendance WHERE id = ${attendanceId}`;

  db.query(query, (err, result) => {
    if (err) {
      throw err;
    }
    // Fetch the updated attendance record
    const fetchQuery = "SELECT * FROM attendance ";
    db.query(fetchQuery, (fetchErr, fetchResult) => {
      if (fetchErr) {
        throw fetchErr;
      }

      // Check if the record exists
      if (fetchResult.length === 0) {
        return res.status(404).json({ error: "Attendance record not found" });
      }

      // Serialize the updated record and send as JSON response
      const updatedRecord = fetchResult[0];
      res.json(updatedRecord);
    });
  });
});
