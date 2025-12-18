const express = require('express');
const Movie = require('../models/Movie');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/movies
// @desc    Get all movies
// @access  Public
router.get('/', async (req, res, next) => {
    try {
        const movies = await Movie.find().sort({ createdAt: -1 });
        res.json(movies);
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/movies/:id
// @desc    Get single movie
// @access  Public
router.get('/:id', async (req, res, next) => {
    try {
        const movie = await Movie.findById(req.params.id);
        
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        res.json(movie);
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/movies
// @desc    Create a movie
// @access  Admin only
router.post('/', protect, adminOnly, async (req, res, next) => {
    try {
        const { title, poster, description, showtimes, price } = req.body;

        if (!title || !price) {
            return res.status(400).json({ message: 'Please provide title and price' });
        }

        // Convert showtimes strings to Date objects if needed
        const formattedShowtimes = showtimes && Array.isArray(showtimes) 
            ? showtimes.map(st => new Date(st))
            : [];

        const movie = await Movie.create({
            title,
            poster,
            description,
            showtimes: formattedShowtimes,
            price
        });

        res.status(201).json(movie);
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/movies/:id
// @desc    Update a movie
// @access  Admin only
router.put('/:id', protect, adminOnly, async (req, res, next) => {
    try {
        const { title, poster, description, showtimes, price } = req.body;

        const movie = await Movie.findById(req.params.id);

        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        // Update fields
        if (title) movie.title = title;
        if (poster !== undefined) movie.poster = poster;
        if (description !== undefined) movie.description = description;
        if (price !== undefined) movie.price = price;
        
        if (showtimes && Array.isArray(showtimes)) {
            movie.showtimes = showtimes.map(st => new Date(st));
        }

        await movie.save();

        res.json(movie);
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/movies/:id
// @desc    Delete a movie
// @access  Admin only
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
    try {
        const movie = await Movie.findById(req.params.id);

        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        await movie.deleteOne();

        res.json({ message: 'Movie deleted successfully' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

