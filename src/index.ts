import express, { Express } from "express";

const PORT = 8080;

const app: Express = express();

app.get("/", (req, res) => {
  res.send("Hello, world!");
});

app.listen(PORT, "0.0.0.0", (error) => {
  if (error) {
    return console.error(error);
  }

  console.log(`[Server]: Server listening at http://localhost:${PORT}`);
});
