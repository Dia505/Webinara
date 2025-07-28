const mongoose = require("mongoose");

const connectDb =  async() => {
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDb connected");
    }
    catch(e) {
        console.log("MongoDb not connected");
    }
}

module.exports = connectDb;