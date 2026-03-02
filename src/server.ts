import "dotenv/config";
import app from "./app";

const PORT = Number(process.env.PORT) || 8080;

app.listen(PORT, "0.0.0.0", (error) => {
  if (error) {
    return console.error(error);
  }

  console.log(`[Server]: Server listening at http://localhost:${PORT}`);
});
