import { Router } from 'express';
import authMiddleware from '../middlewares/auth';
import UserController from '../controllers/user';

const routes = new Router();

// ---- unauthenticated routes ----
routes.post('/user', UserController.create);
routes.post('/login', UserController.login);
routes.post('/forgot-password', UserController.forgotPassword);
routes.post('/reset-password', UserController.resetPassword);


// ---- authenticated routes ----
routes.use(authMiddleware);
routes.get('/user/', UserController.getUser);

export default routes;