import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";
import WebSocket, { WebSocketServer } from "ws";
import cors from "cors";

const prisma = new PrismaClient();

const app = express();
app.use(express.json());
app.use(cors());

const server = app.listen(8080, () => console.log("Server connected"));

const wssChat = new WebSocketServer({ noServer: true });
const wssSignal = new WebSocketServer({ noServer: true })

// API endpoints
app.get("/test", (_: Request, res: Response) => {
  res.status(200).json({
    message: "Working",
  });
});

app.post("/login", async (req: Request, res: Response) => {
  console.log(req.body);
  const userExist = await prisma.user.findFirst({
    where: {
      email: req.body.email,
      password: req.body.password
    }
  });
  console.log(userExist);
  // if (!userExist) return res.status(403).json({
  //   message: "Invalid username or password",
  // });
  return res.status(200).json({
    message: "Successful login",
  });
});

// Chat Socket
wssChat.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("error", console.error);

  ws.on("message", (data: any) => {
    const message = JSON.parse(data.toString());
    if (message.type !== "connect") {
      wssChat.clients.forEach((client) => {
        client.send(JSON.stringify(message));
      });
    }
  });
});

// RTC Socket
let senderSocket: null | WebSocket = null;
let receiverSocket: null | WebSocket = null;

wssSignal.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("error", console.error);

  ws.on("message", (data: any) => {
    const message = JSON.parse(data);
    if (message.type === "sender") {
      senderSocket = ws;
    } else if (message.type === "receiver") {
      receiverSocket = ws;
    } else if (message.type === "createOffer") {
      if (ws !== senderSocket) return;
      receiverSocket!.send(JSON.stringify({
        type: "createOffer",
        sdp: message.sdp,
      }));
    } else if (message.type === "iceCandidate") {
      if (ws === senderSocket) {

      } else if (ws === receiverSocket) {
        senderSocket!.send(JSON.stringify({
          type: "iceCandidate",
          candidate: message.candidate
        }));
      }
    }
  });
});

// Upgrade connections to web-socket
server.on("upgrade", (req: Request, socket, head) => {
  const { pathname } = new URL(req.url as string, "http://locahost:8080");

  if (pathname === "/chat") {
    wssChat.handleUpgrade(req, socket, head, (ws) => {
      wssChat.emit("connection", ws, req);
    });
  } else if (pathname === "/rtc") {
    wssSignal.handleUpgrade(req, socket, head, (ws) => {
      wssSignal.emit("connection", ws, req);
    });
  } else {
    socket.destroy();
  }
});
