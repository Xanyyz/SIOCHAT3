import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

//app.use(express.static(path.join(__dirname, '..', 'SIOCHAT3', 'dist')));//

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

// Connexion MongoDB
mongoose.connect('mongodb+srv://raahoulpandourangame_db_user:sio123456@sio-chat.dk8jf8a.mongodb.net/?appName=SIO-CHAT')
  .then(() => console.log('✅ Connecté à MongoDB'))
  .catch((err) => console.error('❌ Erreur MongoDB:', err))

// Schéma utilisateur
const userSchema = new mongoose.Schema({
  pseudo: { type: String, required: true, unique: true },
})
const User = mongoose.model('User', userSchema)

// Créer un utilisateur
app.post('/users', async (req, res) => {
  const { pseudo } = req.body
  if (!pseudo || pseudo.length < 3) {
    return res.status(400).json({ error: "Pseudo invalide (minimum 3 caractères)" })
  }
  try {
    const user = new User({ pseudo })
    await user.save()
    res.status(201).json(user)
  } catch (err) {
    res.status(400).json({ error: "Pseudo déjà utilisé" })
  }
})

// Récupérer tous les utilisateurs
app.get('/users', async (req, res) => {
  const users = await User.find()
  res.json(users)
})

// Login
app.post('/login', async (req, res) => {
  const { pseudo } = req.body
  const user = await User.findOne({ pseudo })
  if (!user) {
    return res.status(404).json({ error: "Utilisateur non trouvé" })
  }
  res.json({ message: "Connecté", user })
})

// Socket.IO
io.on('connection', (socket) => {
  console.log('Un utilisateur vient de se connecter');
  socket.on('chat message', (data) => {
    const heure = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const msg = {
      pseudo: data.pseudo,
      text: data.text,
      time: data.time || heure
    };
    io.emit('chat message', msg);
  });
  socket.on('disconnect', () => {
    console.log('Un utilisateur vient de se déconnecter');
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});