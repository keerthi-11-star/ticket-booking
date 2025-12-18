const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a movie title'],
        trim: true,
        index: true
    },
    poster: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    showtimes: [{
        type: Date,
        required: true
    }],
    price: {
        type: Number,
        required: [true, 'Please provide a price'],
        min: [0, 'Price cannot be negative']
    }
}, {
    timestamps: true
});

// Index on title for faster searches
movieSchema.index({ title: 1 });

module.exports = mongoose.model('Movie', movieSchema);

