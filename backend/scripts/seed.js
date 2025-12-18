const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const seedAdmin = async () => {
    try {
        // Connect to MongoDB
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/movieticket';
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@movieticket.com' });
        
        if (existingAdmin) {
            console.log('Admin user already exists');
            await mongoose.connection.close();
            return;
        }

        // Create admin user
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@movieticket.com',
            password: 'admin123',
            role: 'admin'
        });

        console.log('Admin user created successfully:');
        console.log('Email: admin@movieticket.com');
        console.log('Password: admin123');
        console.log('Role: admin');

        await mongoose.connection.close();
        console.log('Database connection closed');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();

