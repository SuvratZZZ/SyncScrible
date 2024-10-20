const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const ACTIONS = require("./Actions");
const cors = require("cors");
const path = require('path');
const axios = require("axios");
const server = http.createServer(app);
require("dotenv").config();

const ext = {
  python: "py",
  java: "java",
  cpp: "cpp",
  javascript: "js",
  c: "c",
  go: "go",
  php: "php",
  r: "r",
  ruby: "rb",
  scala: "scala",
  bash: "sh",
  sql: "sql",
  pascal: "pas",
  csharp: "cs",
  swift: "swift",
  rust: "rs",
};

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.use(express.static(path.join(__dirname, 'build')));

// Handle all GET requests by serving the React frontend
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const userSocketMap = {};
const getAllConnectedClients = (roomId) => {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        username: userSocketMap[socketId],
      };
    }
  );
};

io.on("connection", (socket) => {
  // console.log('Socket connected', socket.id);
  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);
    const clients = getAllConnectedClients(roomId);
    // notify that new user join
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });


  // sync the code
  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });
  // when new user join the room all the code which are there are also shows on that persons editor
  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  // leave room
  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    // leave all the room
    rooms.forEach((roomId) => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });
    delete userSocketMap[socket.id];
    socket.leave();
  });
});


app.post("/compile", async (req, res) => {
  const { code, language } = req.body;

  try {
    console.log("here : \n");
    console.log(code);
    console.log(language);
  const response = await axios.post(`https://glot.io/api/run/${language}/latest`, {
    files: [
      {
          name : `scripts.${ext[language]}`,
          content: code
      }
    ]
    }, {
    headers: {
      'Authorization': process.env.GLOT ,
      'Content-Type': 'application/json'
    }
  });

  res.json(response.data);
  } catch (error) {
  console.error(error);
  res.status(500).json({ error: "Failed to compile code" });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server is runnint on port ${PORT}`));
