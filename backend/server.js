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

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const foundUser = await user.findOne({ where: { email } });

        if (!foundUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, foundUser.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Incorrect password' });
        }

        // Generăm un JWT
        const token = jwt.sign(
            { userId: foundUser.userId, role: foundUser.role }, 
            process.env.JWT_SECRET,                             
            { expiresIn: '1h' }                              
        );

        
        return res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

app.post('/activities',async (req,res)=>{

    const {title,description,start_date,end_date}=req.body;
    if(!title || !description || !start_date || !end_date)
    {
        return res.status(400).json('All fields are required');
    }
    
    try{
    
        if(!req.auth || req.auth.role!=='teacher')
        {
            return res.status(403).json({error:'Only teachers can create activities.'})
        }

        const lastActivity = await activity.findOne({ order: [['code', 'DESC']] });
        const nextCode = lastActivity ? lastActivity.code + 1 : 1;
        
        const newActivity=await activity.create({
            title,
            description,
            code:nextCode,
            start_date,
            end_date,
            teacherId:req.auth.userId
        });
     
        return res.status(201).json({message:'Activity created successfully ',activity:newActivity});
    }
    catch(e)
    {
        console.error('Error creating activity:',e);
        return res.status(500).json({ error: e.message });
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