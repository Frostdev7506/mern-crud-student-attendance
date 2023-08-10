const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const socketIO = require("socket.io");

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

// Secret key for JWT
const secretKey = "secret"; // Replace with your own secret key

// Middleware for JWT authentication
const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization;

  if (token) {
    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }

      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const io = socketIO(server, {
  cors: {
    origin: "http://localhost:3000", // Replace with the actual frontend URL
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

// Enable CORS for Socket.IO

// To avoid error if deploying the app in a new server

// Create users table with additional 'status' column
const createUsersTableQuery = `
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active'
  )
`;

db.query(createUsersTableQuery, (err) => {
  if (err) {
    console.error("Error creating users table:", err);
  } else {
    console.log("Users table created or already exists");
  }
});

// Create students table with additional 'status' column
const createStudentsTableQuery = `
  CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active'
  )
`;

db.query(createStudentsTableQuery, (err) => {
  if (err) {
    console.error("Error creating students table:", err);
  } else {
    console.log("Students table created or already exists");
  }
});

// Create attendance table with additional 'status' column
const createAttendanceTableQuery = `
  CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    present BOOLEAN DEFAULT false,
    status ENUM('active', 'inactive') DEFAULT 'active'
  )
`;

db.query(createAttendanceTableQuery, (err) => {
  if (err) {
    console.error("Error creating attendance table:", err);
  } else {
    console.log("Attendance table created or already exists");
  }
});

// Add this SQL query to create the "messages" table if it doesn't exist
const createMessagesTableQuery = `
  CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

// Execute the query to create the table
db.query(createMessagesTableQuery, (err) => {
  if (err) {
    console.error("Error creating messages table:", err);
  } else {
    console.log("Messages table created or already exists");
  }
});

// Group chat code
// Store connected clients (users)
// Store connected clients with their usernames
const connectedUsers = new Map();
// Store messages in memory (this should be a persistent storage in production)
const messages = [];

// Function to fetch messages from the database
const fetchMessages = () => {
  const fetchMessagesQuery = `SELECT * FROM messages`;
  return new Promise((resolve, reject) => {
    db.query(fetchMessagesQuery, (err, results) => {
      if (err) {
        reject(err);
      } else {
        console.log(results);
        resolve(results);
      }
    });
  });
};

// Socket.io connection event
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Handle user login and store the username
  socket.on("login", (userName) => {
    console.log(`User '${userName}' connected.`);
    connectedUsers.set(socket.id, userName);
    // Send previous messages to the client upon successful login
    try {
      fetchMessages()
        .then((results) => {
          console.log(results);
          socket.emit("previous_messages", results);
        })
        .catch((err) => {
          console.error("Error fetching previous messages:", err);
        });
    } catch {
      console.error("Error Logging in ");
    }
  });

  socket.on("previousMessages", (message) => {
    fetchMessages()
      .then((results) => {
        console.log(results);
        socket.emit("previous_messages", results);
      })
      .catch((err) => {
        console.error("Error fetching previous messages:", err);
      });
  });

  // Handle new messages from clients
  socket.on("message", (message) => {
    console.log("New message:", message);

    // Add the new message to the messages array
    messages.push(message);

    // Insert the new message into the "messages" table in the database
    const insertMessageQuery = `
      INSERT INTO messages (sender, message)
      VALUES ('${message.sender}', '${message.message}')
    `;

    db.query(insertMessageQuery, (err, result) => {
      if (err) {
        console.error("Error inserting message into database:", err);
      } else {
        console.log("Message inserted into database:", result);
      }
    });

    // Broadcast the message to all connected clients
    io.emit("message", message);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);

    // Remove user from the connected users
    if (connectedUsers.has(socket.id)) {
      const userName = connectedUsers.get(socket.id);
      connectedUsers.delete(socket.id);
      console.log(`User '${userName}' disconnected.`);
    }
  });
});

// Group chat code

// attendance table code
// Register a new user
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  const insertUserQuery = `
    INSERT INTO users (username, password)
    VALUES ('${username}', '${password}')
  `;

  db.query(insertUserQuery, (err, result) => {
    if (err) {
      console.error("Error registering user:", err);
      res.status(500).json({ error: "Error registering user" });
    } else {
      res.status(200).json({ message: "User registered successfully" });
    }
  });
});

// Login and generate JWT
app.post("/login", (req, res) => {
  const { username, password, apptype } = req.body;
  const table = apptype === "student" ? "students" : "teachers";

  console.log("apptype-----------", apptype);

  const getUserQuery = `
    SELECT id, username, status FROM ${table}
    WHERE username = '${username}' AND password = '${password}'
  `;

  db.query(getUserQuery, (err, results) => {
    if (err) {
      console.error("Error retrieving user:", err);
      res.status(500).json({ error: "Error retrieving user" });
    } else {
      if (results.length === 1) {
        const user = results[0];
        const token = jwt.sign(user, secretKey);

        res.status(200).json({ token });
      } else {
        console.log("Invalid credentials");
        res.status(200).json({ error: "Invalid credentials" });
      }
    }
  });
});

app
  .route("/attendance")
  .get((req, res) => {
    db.query("SELECT * FROM attendance", (err, result) => {
      if (err) {
        console.error("Error fetching attendance records:", err);
        return res
          .status(500)
          .json({ error: "Error fetching attendance records" });
      }
      res.status(200).json(result);
    });
  })
  // .post((req, res) => {
  //   const { studentId, date, present } = req.body;
  //   console.log(date.slice(0, 10));
  //   const query = `INSERT INTO attendance (student_id, date, present) VALUES ('${studentId}', '${date.slice(
  //     0,
  //     10
  //   )}', ${present})`;

  //   db.query(query, (err, result) => {
  //     if (err) {
  //       console.error("Error creating attendance record:", err);
  //       return res
  //         .status(500)
  //         .json({ error: "Error creating attendance record" });
  //     }
  //     const attendanceId = result.insertId;

  //     const fetchQuery = `SELECT * FROM attendance WHERE id = ${attendanceId}`;
  //     db.query(fetchQuery, (fetchErr, fetchResult) => {
  //       if (fetchErr) {
  //         console.error("Error fetching attendance record:", fetchErr);
  //         return res
  //           .status(500)
  //           .json({ error: "Error fetching attendance record" });
  //       }

  //       if (fetchResult.length === 0) {
  //         return res.status(404).json({ error: "Attendance record not found" });
  //       }

  //       const updatedRecord = fetchResult[0];
  //       res.json(updatedRecord);
  //     });
  //   });
  // })
  .post((req, res) => {
    const attendanceData = req.body; // Array of attendance objects

    const values = attendanceData.map(({ student_id, date, present }) => {
      console.log("data = ", student_id, date, present);
      return `('${student_id}', '${date.slice(0, 10)}', ${present})`;
    });

    const query = `INSERT INTO attendance (student_id, date, present) VALUES ${values.join(
      ","
    )}`;

    db.query(query, (err, result) => {
      if (err) {
        console.error("Error creating attendance records:", err);
        return res
          .status(500)
          .json({ error: "Error creating attendance records" });
      }
      res
        .status(201)
        .json({ message: "Attendance records created successfully" });
    });
  });

//localhost:5000/attendance/${attendanceId}

// Update student attendance
app
  .route("/attendance/:id")
  .put((req, res) => {
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
        console.log(updatedRecord);
        res.json(updatedRecord);
      });
    });
  })
  // delete student attendance
  .delete((req, res) => {
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
