require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Модели
const Post = mongoose.model('Post', new mongoose.Schema({
    content: String,
    date: { type: Date, default: Date.now }
}));

const Admin = mongoose.model('Admin', new mongoose.Schema({
    username: String,
    password: String
}));

// Маршруты
app.get('/api/posts', async (req, res) => {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
});

app.post('/api/posts', async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET);
        
        const post = new Post({ content: req.body.content });
        await post.save();
        res.status(201).send(post);
    } catch (error) {
        res.status(401).send('Не авторизован');
    }
});

app.post('/api/login', async (req, res) => {
    const admin = await Admin.findOne({ username: req.body.username });
    if (!admin || !bcrypt.compareSync(req.body.password, admin.password)) {
        return res.status(401).send('Неверные данные');
    }
    
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET);
    res.send({ token });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
