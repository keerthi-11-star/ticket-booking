const mongoose = require('mongoose');

const connectDB = async () => {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/movieticket';
    
    const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    };

    try {
        await mongoose.connect(mongoURI, options);
        console.log('MongoDB connected successfully');

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });

    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        
        // Retry connection
        let retries = 5;
        while (retries > 0) {
            console.log(`Retrying MongoDB connection... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            try {
                await mongoose.connect(mongoURI, options);
                console.log('MongoDB connected successfully after retry');
                return;
            } catch (retryError) {
                retries--;
                if (retries === 0) {
                    throw new Error('Failed to connect to MongoDB after multiple attempts');
                }
            }
        }
    }
};

module.exports = connectDB;

