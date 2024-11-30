import { DataTypes } from "sequelize";
import { sequelize } from "./data_base.js";

export const user=sequelize.define('Users',{
    userId:{
        type:DataTypes.UUID,
        primaryKey:true,
        defaultValue:DataTypes.UUIDV4,
       
    },
    name:{
       type: DataTypes.STRING,
       allowNull:false,
       validate:{notEmpty:true}
    },
    email:{
        type:DataTypes.STRING,
        allowNull:false,
        unique:true,
        validate:{isEmail:true}
    },
    password:{
        type:DataTypes.STRING,
        allowNull:false,
        validate:{len:[6,255]}
    },
    role:{
       type: DataTypes.STRING,
       allowNull:false,
       validate:{isIn:[['student','teacher']]}
    }
});

