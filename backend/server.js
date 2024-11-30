import dotenv from 'dotenv';
dotenv.config();

import express from 'express'
import { getUserByEmail,migrate } from './data_base/index.js';
import { user } from './data_base/users.model.js';
import { activity } from './data_base/activities.model.js';
import { expressjwt } from "express-jwt";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET;

const app=express();
app.use(express.json());
migrate();

app.use(expressjwt({
    secret:jwtSecret,
    algorithms:['HS256']
}).unless({
    path:['/login'] //endpointuri excluse
}));

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(req.body);

    // Verificăm dacă email-ul și parola au fost furnizate
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Căutăm utilizatorul în baza de date după email
        const foundUser = await user.findOne({ where: { email } });

        if (!foundUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verificăm dacă parola introdusă corespunde cu parola din baza de date
        // Dacă parolele sunt criptate, folosim bcrypt.compare() pentru a le compara
        // Aici presupunem că parola din baza de date este deja criptată cu bcrypt
        const isPasswordValid = await bcrypt.compare(password, foundUser.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Incorrect password' });
        }

        // Generăm un JWT
        const token = jwt.sign(
            { userId: foundUser.userId, role: foundUser.role }, // Payload-ul JWT
            process.env.JWT_SECRET,                             // Secretul pentru semnătura JWT
            { expiresIn: '1h' }                                // Expirarea token-ului
        );

        // Trimiterea JWT către client
        return res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

app.get('/:email/user', async (req,res)=>{
        const userEmail=req.params.email;
        const user=await getUserByEmail(userEmail);
        if(!user)
        {
            res.status(404).json({error: 'Email not found'});
        }
        else{
            res.status(200).json({user:user});
        }
});

app.listen(3001,()=>{
    console.log('has started');
});