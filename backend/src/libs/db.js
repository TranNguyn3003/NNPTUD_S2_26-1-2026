const mongoose = require('mongoose')
exports.connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL)
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.log('MongoDB connection error:', error);
        process.exit(1);
    }
}