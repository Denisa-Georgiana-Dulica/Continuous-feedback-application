import { DataTypes } from "sequelize";
import { sequelize } from "./data_base.js";
import { user } from "./users.model.js";


export const activity=sequelize.define('Activities',{
    activitiesId:{
        type:DataTypes.UUID,
        primaryKey:true,
        defaultValue:DataTypes.UUIDV4
    },
    title:{
        type:DataTypes.STRING,
        allowNull:false,
        validate:{notEmpty:true}
    },
    description:{
        type:DataTypes.TEXT,
        allowNull:false,
        validate:{notEmpty:true}
    },
    code:{ 
        type:DataTypes.INTEGER,
        allowNull:false,
        unique:true,
    },
    start_date:{ 
        type:DataTypes.DATE,
        allowNull:false
    },
    end_date:{ 
        type:DataTypes.DATE,
        allowNull:false
    },
    teacherId:{
        type:DataTypes.UUID,
        allowNull:false,
        references:{
            model:user,
            key:'userId'
        },
        onDelete:'SET NULL',
        onUpdate:'CASCADE' 
        
    }
   
},{
    hooks: {
        beforeCreate: async function increment(new_activity) {
            try {
                const lastActivity = await activity.findOne({ order: [['code', 'DESC']] });
                if (lastActivity) {
                    new_activity.code = lastActivity.code + 1;
                } else {
                    new_activity.code = 1;  // Dacă nu există nicio activitate, setăm codul la 1
                }
            } catch (err) {
                console.error('Error in beforeCreate hook:', err);
              
            }
        }
    }
    
});

//DEFINESC RELATIA ONE TO MANY
user.hasMany(activity,{foreignKey:'teacherId'});
activity.belongsTo(user,{foreignKey:'teacherId'});

/*Un hook în Sequelize este o funcție care se execută automat înainte sau 
după un anumit eveniment (de exemplu, înainte de salvarea unui rând în baza 
de date sau după ștergerea unui rând). În acest caz, folosim beforeCreate, 
un hook care rulează înainte de a crea și salva un rând în baza de date.*/ 