import dotenv from "dotenv";
import { app } from "./app.js";

import connectDB from "./db/index.js";

dotenv.config({ path: "./.env" });

connectDB()
  .then(() => {
    app.on("error", (err) => {
      console.log("ERRRR:", err);
      throw err;
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at PORT: ${process.env.PORT}`);
    });
  })
  .catch((err) => console.log("DB connection failed!!!", err));
