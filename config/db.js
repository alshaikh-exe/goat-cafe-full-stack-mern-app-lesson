import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();    

mongoose.connect(process.env.MONGO_URI)

mongoose.connection.once('open', () => {
    console.log('Mongo is showing us love')
})