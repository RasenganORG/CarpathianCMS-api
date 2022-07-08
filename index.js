import express from "express";
import bodyParser from "body-parser";

import usersRoutes from "./routes/users.js";
import config from "./config.js";
const app = express();


app.use(bodyParser.json());

app.use("/users", usersRoutes);

app.get("/", (req, res) => res.send("Welcome to the Carpathian-CMS API!"));
app.all("*", (req, res) =>res.send("You've tried reaching an endpoint that doesn't exist."));

app.listen(config.port, () =>console.log(`Server running on port: http://localhost:${config.port}`));
