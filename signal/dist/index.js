"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = __importDefault(require("express"));
const ws_1 = require("ws");
const cors_1 = __importDefault(require("cors"));
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
const server = app.listen(8080, () => console.log("Server connected"));
const wssChat = new ws_1.WebSocketServer({ noServer: true });
const wssSignal = new ws_1.WebSocketServer({ noServer: true });
// API endpoints
app.get("/test", (_, res) => {
    res.status(200).json({
        message: "Working",
    });
});
app.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body);
    const userExist = yield prisma.user.findFirst({
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
}));
// Chat Socket
wssChat.on("connection", (ws) => {
    console.log("Client connected");
    ws.on("error", console.error);
    ws.on("message", (data) => {
        const message = JSON.parse(data.toString());
        if (message.type !== "connect") {
            wssChat.clients.forEach((client) => {
                client.send(JSON.stringify(message));
            });
        }
    });
});
// RTC Socket
let senderSocket = null;
let receiverSocket = null;
wssSignal.on("connection", (ws) => {
    console.log("Client connected");
    ws.on("error", console.error);
    ws.on("message", (data) => {
        const message = JSON.parse(data);
        if (message.type === "sender") {
            senderSocket = ws;
        }
        else if (message.type === "receiver") {
            receiverSocket = ws;
        }
        else if (message.type === "createOffer") {
            if (ws !== senderSocket)
                return;
            receiverSocket.send(JSON.stringify({
                type: "createOffer",
                sdp: message.sdp,
            }));
        }
        else if (message.type === "iceCandidate") {
            if (ws === senderSocket) {
            }
            else if (ws === receiverSocket) {
                senderSocket.send(JSON.stringify({
                    type: "iceCandidate",
                    candidate: message.candidate
                }));
            }
        }
    });
});
// Upgrade connections to web-socket
server.on("upgrade", (req, socket, head) => {
    const { pathname } = new URL(req.url, "http://locahost:8080");
    if (pathname === "/chat") {
        wssChat.handleUpgrade(req, socket, head, (ws) => {
            wssChat.emit("connection", ws, req);
        });
    }
    else if (pathname === "/rtc") {
        wssSignal.handleUpgrade(req, socket, head, (ws) => {
            wssSignal.emit("connection", ws, req);
        });
    }
    else {
        socket.destroy();
    }
});
