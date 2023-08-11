import { Router } from 'express';
import authMiddleware from '../middlewares/auth';
import UserController from '../controllers/user';
import CategoryController from '../controllers/categorie';
import AuthorController from '../controllers/author';

const routes = new Router();

// ---- unauthenticated routes ----
routes.post('/user', UserController.create);
routes.post('/login', UserController.login);
routes.post('/forgot-password', UserController.forgotPassword);
routes.post('/reset-password', UserController.resetPassword);


// ---- authenticated routes ----
routes.use(authMiddleware);
routes.get('/user/', UserController.getUser);
routes.get('/category', CategoryController.getCategoryAll);
routes.get('/author-all', AuthorController.getAuthorAll);
routes.post('/author', AuthorController.create);



export default routes;