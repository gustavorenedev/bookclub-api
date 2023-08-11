import { Author } from "../models";
import * as Yup from 'yup'

class AuthorController{
    async create(req, res) {
        try {
            const schema = Yup.object().shape({
                name: Yup.string().required('name is mandatory.').min(3, 'name must contain at least 3 characters.'),
                avatar_url: Yup.string().url('avatar URL must be in URL format.')
            });

            await schema.validate(req.body);

            const createdAuthor = await new Author({
                ...req.body,
            });

            await createdAuthor.save();

            return res.json({ createdAuthor });
        } catch (error) {
            return res.status(400).json({ error: error?.message });
        }
    }

    async getAuthorAll(req, res) {
        try {
            const author = await Author.findAll({
                order: [['name', 'ASC']],
            });
            return res.json(author);
        } catch (error) {
            return res.status(400).json({ error: error?.message });
        }
    }
}

export default new AuthorController();