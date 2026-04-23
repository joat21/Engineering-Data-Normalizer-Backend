import "dotenv/config";
import app from "./app";
import { initPricesUpdate, updatePrices } from "./tasks/catalogUpdate";

const PORT = Number(process.env.PORT) || 8080;

app.listen(PORT, "0.0.0.0", async (error) => {
  if (error) {
    return console.error(error);
  }

  initPricesUpdate();
  // TODO: не забыть раскомментировать перед билдом
  // await updatePrices();

  console.log(`[Server]: Server listening at http://localhost:${PORT}`);
});
