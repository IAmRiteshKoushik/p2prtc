"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.get("/api/v1/test", (req, res) => {
    res.status(200).json({
        message: "Working",
    });
});
app.listen(8080, () => console.log("Server connected"));
