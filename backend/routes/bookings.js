const express = require('express');
const Booking = require('../models/Booking');
const Movie = require('../models/Movie');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/bookings
// @desc    Create a booking
// @access  Private
router.post('/', protect, async (req, res, next) => {
    try {
        const { movie, showtime, seats, amount } = req.body;

        // Validation
        if (!movie || !showtime || !seats || !Array.isArray(seats) || seats.length === 0) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Verify movie exists and showtime is valid
        const movieDoc = await Movie.findById(movie);
        if (!movieDoc) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        const showtimeDate = new Date(showtime);
        const isValidShowtime = movieDoc.showtimes.some(st => 
            new Date(st).getTime() === showtimeDate.getTime()
        );

        if (!isValidShowtime) {
            return res.status(400).json({ message: 'Invalid showtime for this movie' });
        }

        // Calculate amount if not provided
        const calculatedAmount = amount || (seats.length * movieDoc.price);

        // Create booking
        const booking = await Booking.create({
            user: req.user._id,
            movie,
            showtime: showtimeDate,
            seats,
            amount: calculatedAmount
        });

        // Populate references
        await booking.populate('movie user');

        res.status(201).json(booking);
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/bookings/my
// @desc    Get user's bookings
// @access  Private
router.get('/my', protect, async (req, res, next) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate('movie');

        res.json(bookings);
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/bookings/all
// @desc    Get all bookings (admin only)
// @access  Admin only
router.get('/all', protect, adminOnly, async (req, res, next) => {
    try {
        const bookings = await Booking.find()
            .sort({ createdAt: -1 })
            .populate('user movie');

        res.json(bookings);
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/bookings/:id
// @desc    Get single booking
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Check if user owns the booking or is admin
        if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(booking);
    } catch (error) {
        next(error);
    }
});

module.exports = router;

