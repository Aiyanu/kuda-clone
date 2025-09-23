import express, { Request, Response, Express, NextFunction } from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";

import DBInitialize from "./src/database/init";
import UserRoute from "./src/routers/user.router";
import AccountRoute from "./src/routers/account.router";
import TransactionRoute from "./src/routers/transaction.router";
// Import swagger schemas for documentation
import "./src/interfaces/swagger.schemas";

import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";

//create an app
const app = express();

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Swagger configuration
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Kuda Clone API",
      version: "1.0.0",
      description: "API documentation for Kuda Clone project",
    },
    servers: [
      {
        url:
          process.env.APP_URL ||
          "http://localhost:" + (process.env.PORT || 5000),
      },
    ],
  },
  apis: [
    "./src/routers/*.ts",
    "./src/controllers/*.ts",
    "./src/services/*.ts",
    "./src/models/*.ts",
    "./src/interfaces/*.ts",
  ],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use((err: TypeError, req: Request, res: Response, next: NextFunction) => {
  try {
    if (err) {
      return res
        .status(500)
        .json({ status: false, message: (err as TypeError).message });
    }
  } catch (e) {}
});

app.use("/api/user", UserRoute);
app.use("/api/account", AccountRoute);
app.use("/api/transaction", TransactionRoute);

app.get("/", (req: Request, res: Response) => {
  res.send(`Welcome to ${process.env.APPNAME}`);
});

const PORT = process.env.PORT || 5000;

const Boostrap = async function () {
  await DBInitialize()
    .then(() => {
      console.log("Connected to Database successfully");
    })
    .then(() => {
      app.listen(PORT, () => {
        console.log("Connection has been established successfully.");
      });
    })
    .catch((error) => {
      console.error("Unable to connect to the database:", error);
    });
};

Boostrap();
