import { user } from "./users.model.js";
import { activity } from "./activities.model.js";
import { reaction } from "./reactions.model.js";
import bcrypt from 'bcryptjs';

export async function migrate() {
    const saltRounds = 10;

    try{
    await user.sync();
    await activity.sync();
    await reaction.sync();

    const users=[
    {
        name:'Dulica Denisa',
        email:'dulica.denisa13@gmail.com',
        password:'200389099',
        role:'student'
    },

    {
        name:'Dinita Cosmina',
        email:'dinita.cosmina22@gmail.com',
        password:'2004678998',
        role:'teacher'
    },
    {
        name:'Popescu Mihaela',
        email:'popescu.mihaela22@gmail.com',
        password:'1234567',
        role:'student'
    },
    {
        name:'Dinca David',
        email:'dinca.david22@gmail.com',
        password:'20056784',
        role:'teacher'
    },
    {
        name:'Simionescu Alexandru',
        email:'simionescu.alexandru22@gmail.com',
        password:'987654321',
        role:'teacher'
    }
];

    for(const userData of users)//
    {
        try{
            const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
            await user.create({
                name:userData.name,
                email:userData.email,
                password:hashedPassword,
                role:userData.role
            });
            console.log(`User ${userData.name} created successfully`);
        }
        catch(e)
        {
            if(e.name==='SequelizeValidationError')
            {
                console.error(`Validation error for ${userData.name}:`,e.errors.map(err => err.message).join(', '));
            }
        }
    }

}
catch(e)
{
    console.error('Migration failed:',e);
}

}

export async function getUserByEmail(email){
    try{
    const user_values=await user.findOne({where: {email}});
    return user_values?.dataValues;
    }
    catch(e)
    {
        console.log(e);
    }
};





