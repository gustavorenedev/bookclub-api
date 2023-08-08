import { User } from "../models";
import * as Yup from 'yup';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

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
            
        } catch (error) {
            
        }
    }
}

export default new UserController();