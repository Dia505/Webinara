const mongoose = require("mongoose");

const connectDb =  async() => {
    try{
        await mongoose.connect("mongodb://localhost:27017/webinara_db");
        console.log("MongoDb connected");
    }
    catch(e) {
        console.log("MongoDb not connected");
    }
}

module.exports = connectDb;