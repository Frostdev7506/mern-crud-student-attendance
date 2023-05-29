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
    console.error("Error connecting to MySQL database:", err);
    process.exit(1); // Exit the application if there is an error
  }
  console.log("Connected to MySQL database!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.get("/attendance", (req, res) => {
  db.query("SELECT * FROM attendance", (err, result) => {
    if (err) {
      console.error("Error fetching attendance records:", err);
      return res
        .status(500)
        .json({ error: "Error fetching attendance records" });
    }
    res.status(200).json(result);
  });
});

app.post("/attendance", (req, res) => {
  const { studentId, date, present } = req.body;
  const query = `INSERT INTO attendance (student_id, date, present) VALUES ('${studentId}', '${date}', ${present})`;

  db.query(query, (err, result) => {
    if (err) {
      console.error("Error creating attendance record:", err);
      return res
        .status(500)
        .json({ error: "Error creating attendance record" });
    }
    const attendanceId = result.insertId;

    const fetchQuery = `SELECT * FROM attendance WHERE id = ${attendanceId}`;
    db.query(fetchQuery, (fetchErr, fetchResult) => {
      if (fetchErr) {
        console.error("Error fetching attendance record:", fetchErr);
        return res
          .status(500)
          .json({ error: "Error fetching attendance record" });
      }

      if (fetchResult.length === 0) {
        return res.status(404).json({ error: "Attendance record not found" });
      }

      const updatedRecord = fetchResult[0];
      res.json(updatedRecord);
    });
  });
});

//localhost:5000/attendance/${attendanceId}

// Update student attendance
app.put("/attendance/:id", (req, res) => {
  const attendanceId = req.params.id;
  const { student_id, date, present } = req.body.studentId;
  console.log(req.body.studentId);
  const query = `UPDATE attendance SET student_id = '${student_id}', date = '${date.slice(
    0,
    10
  )}', present = ${present} WHERE id = ${attendanceId}`;

  db.query(query, (err, result) => {
    if (err) {
      throw err;
    }

    // Check if any records were affected by the update operation
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Attendance record not found" });
    }

    // Fetch the updated attendance record
    const fetchQuery = `SELECT * FROM attendance WHERE id = ${attendanceId}`;
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

http: app.delete("/attendance/:id", (req, res) => {
  const attendanceId = req.params.id;
  const query = `DELETE FROM attendance WHERE id = ${attendanceId}`;

  db.query(query, (err, result) => {
    if (err) {
      console.error("Error deleting attendance record:", err);
      return res
        .status(500)
        .json({ error: "Error deleting attendance record" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Attendance record not found" });
    }

    const fetchQuery = "SELECT * FROM attendance";
    db.query(fetchQuery, (fetchErr, fetchResult) => {
      if (fetchErr) {
        console.error("Error fetching attendance records:", fetchErr);
        return res
          .status(500)
          .json({ error: "Error fetching attendance records" });
      }

      res.json(fetchResult);
    });
  });
});
