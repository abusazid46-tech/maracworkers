import cors from "cors";
import express from "express";
import helmet from "helmet";
import { ZodError } from "zod";
import { isCorsOriginAllowed } from "./config/env.js";
import { requestLogger, type RequestWithId } from "./middleware/request-logger.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { bookingsRouter } from "./routes/bookings.js";
import { crmRouter } from "./routes/crm.js";
import { healthRouter } from "./routes/health.js";
import { leadsRouter } from "./routes/leads.js";
import { offersRouter } from "./routes/offers.js";
import { paymentsRouter } from "./routes/payments.js";
import { servicesRouter } from "./routes/services.js";
import { staffRouter } from "./routes/staff.js";
import { reportError } from "./services/logger.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        callback(null, isCorsOriginAllowed(origin));
      },
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(requestLogger);

  app.use("/health", healthRouter);
  app.use("/auth", authRouter);
  app.use("/admin", adminRouter);
  app.use("/services", servicesRouter);
  app.use("/bookings", bookingsRouter);
  app.use("/offers", offersRouter);
  app.use("/payments", paymentsRouter);
  app.use("/leads", leadsRouter);
  app.use("/staff", staffRouter);
  app.use("/crm", crmRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "Route not found" });
  });

  app.use((error: unknown, req: RequestWithId, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.flatten()
      });
    }

    reportError(error, {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl
    });
    return res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
