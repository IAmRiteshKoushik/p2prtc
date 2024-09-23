import express, { Request, Response } from "express";

const app = express();
app.use(express.json());

app.get("/test", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Working",
  });
});

app.post("/login", (req: Request, res: Response) => {

});

app.listen(8080, () => console.log("Server connected"));
