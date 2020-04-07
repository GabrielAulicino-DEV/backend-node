import { Router } from "express";
import multer from "multer";
import multerConfig from "./config/multer";

import FileController from "./app/controllers/FileController";
import UserController from "./app/controllers/UserController";
import SessionController from "./app/controllers/SessionController";
import ProviderController from "./app/controllers/ProviderController";
import AppoitementsController from "./app/controllers/AppoitementsController";
import ScheduleController from "./app/controllers/ScheduleController";
import NotificationController from "./app/controllers/NotificationController";
import AvailableController from "./app/controllers/AvailableController";

import authMiddleware from "./app/middlewares/auth";

const routes = new Router();
const upload = multer(multerConfig);

routes.post("/users", UserController.store);
routes.post("/sessions", SessionController.store);

routes.use(authMiddleware);

routes.put("/users", UserController.update);

routes.post("/files", upload.single("file"), FileController.store);
routes.get("/providers", ProviderController.index);
routes.get("/providers/:providerId/available", AvailableController.index);

routes.post("/appoitements", AppoitementsController.store);
routes.get("/appoitements", AppoitementsController.index);
routes.delete("/appoitements/:id", AppoitementsController.delete);

routes.get("/notifications", NotificationController.index);
routes.put("/notifications/:id", NotificationController.update);

routes.get("/schedule", ScheduleController.index);
export default routes;
