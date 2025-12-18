const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Booking must belong to a user']
    },
    movie: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie',
        required: [true, 'Booking must be for a movie']
    },
    showtime: {
        type: Date,
        required: [true, 'Please provide a showtime']
    },
    seats: [{
        type: String,
        required: true
    }],
    amount: {
        type: Number,
        required: [true, 'Please provide booking amount'],
        min: [0, 'Amount cannot be negative']
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'confirmed'
    }
}, {
    timestamps: true
});

// Indexes for better query performance
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ movie: 1 });
bookingSchema.index({ showtime: 1 });

// Populate user and movie by default
bookingSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'user',
        select: 'name email'
    }).populate({
        path: 'movie',
        select: 'title poster description'
    });
    next();
});

module.exports = mongoose.model('Booking', bookingSchema);

