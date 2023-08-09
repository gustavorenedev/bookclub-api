import { User } from "../models";
import { differenceInHours } from 'date-fns';
import * as Yup from 'yup';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import Mail from '../libs/Mail';

class UserController {
    async login(req, res) {
        try {
            const schema = Yup.object().shape({
                email: Yup.string().email('e-mail invalid.').required('e-mail is mandatory.'),
                password: Yup.string().required('password is mandatory.'),
            });

            await schema.validate(req.body);

            const user = await User.findOne({ 
                where: {email: req.body.email} 
            });

            if(!user) {
                return res.status(400).json({ error: 'e-mail or password do not match.' });
            }

            const checkPassword = await bcrypt.compare(req.body.password, user.password_hash);

            if(!checkPassword) {
                return res.status(401).json({ error: 'e-mail or password do not match.' });
            }

            const token = jwt.sign({ id: user.id }, process.env.JWT_HASH, {
                expiresIn: '30d',
            });

            const { id, name, email, avatar_url, createdAt } = user;

            return res.json({
                id, 
                name, 
                email,
                avatar_url, 
                createdAt,
                token,
            });

        } catch (error) {
            return res.status(400).json({ error: error?.message });
        }
    }

    async create(req, res) {
        try {
            const schema = Yup.object().shape({
                name: Yup.string().required('name is mandatory.').min(3, 'name must contain at least 3 characters.'),
                email: Yup.string().email('e-mail invalid.').required('e-mail is mandatory.'),
                password: Yup.string().required('password is mandatory.').min(6, 'password must contain at least 3 characters.'),
            });

            await schema.validate(req.body);
    
            const existedUser = await User.findOne({ 
                where: { email: req.body.email } 
            });

            if(existedUser) {
                return res.status(400).json({ error: 'user already exists.'});
            }

            const hashPassword = await bcrypt.hash(req.body.password, 8);
    
            const user = new User({
                ...req.body,
                password: '',
                password_hash: hashPassword,
            });
            await user.save();
    
            return res.json({ user });
        } catch (error) {
            console.log(error)
            return res.status(400).json({ error: error?.message})
        }
    }

    async getUser(req, res) {
        try {
            if(!req.userId){
                return res.status(400).json({ error: 'id not provided!'});
            }

            const user = await User.findOne({ where: { id: Number(req.userId) } });

            if (!user) {
                return res.status(404).json({ error: 'user not found.'})
            }

            return res.json(user);
        } catch(error) {
            return res.status(400).json({ error: error?.message})
        }
    }

    async forgotPassword(req, res) {
        try {
            const schema = Yup.object().shape({
                email: Yup.string().email('e-mail invalid.').required('e-mail is mandatory.'),
            });

            await schema.validate(req.body);

            const user = await User.findOne({ where: { email: req.body.email } });

            if (!user) {
                return res.status(404).json({ error: 'user not found!'})
            }

            const reset_password_token_sent_at = new Date();
            const token = Math.random().toString().slice(2, 8);
            const reset_password_token = await bcrypt.hash(token, 8);

            console.log(token);

            await user.update({
                reset_password_token_sent_at,
                reset_password_token,
            });

            const { email, name } = user;

            const mailResult = await Mail.sendForgotPasswordMail(email, name, token);
            console.log({ mailResult });

            if(mailResult?.error) {
                return res.status(400).json({ error: "E-mail not sent. " });
            }

            return res.json({ success: true });
        } catch (error) {
            return res.status(400).json({ error: error?.message})
        }
    }

    async resetPassword(req, res) {
        try {
            const schema = Yup.object().shape({
                email: Yup.string().email('e-mail invalid.').required('e-mail is mandatory.'),
                token: Yup.string().required('token is mandatory.'),
                password: Yup.string().required('password is mandatory.').min(6, 'password must contain at least 3 characters.'),
            });
    
            await schema.validate(req.body);
    
            const user = await User.findOne({ 
                where: {email: req.body.email} 
            });
    
            if(!user) {
                return res.status(400).json({ error: 'e-mail or password do not match.' });
            }
    
            if(!user.reset_password_token && !user.reset_password_token_sent_at){
                return res.status(404).json({ error: 'password change was not requested' })
            } 
    
            const hoursDifference = differenceInHours(
                new Date(),
                user.reset_password_token_sent_at
            );
    
            if(hoursDifference > 3) {
                return res.status(401).json({ error: 'token expired.'})
            }

            const checkToken = await bcrypt.compare(req.body.token, user.reset_password_token);
    
            if(!checkToken) {
                return res.status(401).json({ error: 'token invalid!' });
            }
    
            const password_hash = await bcrypt.hash(req.body.password, 8);

            await user.update({
                password_hash,
                reset_password_token: null,
                reset_password_token_sent_at: null,
            })

            return res.status(200).json({ sucess:true });
        } catch (error) {
            return res.status(400).json({ error: error?.message });
        }
    }
}

export default new UserController();