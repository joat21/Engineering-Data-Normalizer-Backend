import "dotenv/config";
import app from "./app";
import {
  initCurrencyCron,
  updateRates,
} from "./services/ReferenceDataService/updateExchangeRates";

const PORT = Number(process.env.PORT) || 8080;

app.listen(PORT, "0.0.0.0", async (error) => {
  if (error) {
    return console.error(error);
  }

  initCurrencyCron();
  // TODO: не забыть раскомментировать перед билдом
  // await updateRates();

  console.log(`[Server]: Server listening at http://localhost:${PORT}`);
});
