let currentMovie = null;
let selectedSeats = [];
let selectedShowtime = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;

    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('movieId');

    if (!movieId) {
        window.location.href = 'dashboard.html';
        return;
    }

    await loadMovie(movieId);
});

async function loadMovie(movieId) {
    try {
        const movie = await apiRequest(`/movies/${movieId}`);
        currentMovie = movie;
        displayBookingForm(movie);
    } catch (error) {
        document.getElementById('booking-container').innerHTML = 
            '<div class="alert alert-error">Movie not found. <a href="dashboard.html">Go back</a></div>';
    }
}

function displayBookingForm(movie) {
    const container = document.getElementById('booking-container');
    
    if (!movie.showtimes || movie.showtimes.length === 0) {
        container.innerHTML = '<div class="alert alert-error">No showtimes available for this movie.</div>';
        return;
    }

    container.innerHTML = `
        <div class="booking-form">
            <h2>Book Tickets: ${movie.title}</h2>
            
            <div class="form-group">
                <label>Select Showtime</label>
                <select id="showtime-select" class="form-group" required>
                    <option value="">Choose a showtime</option>
                    ${movie.showtimes.map(st => `
                        <option value="${st}">${new Date(st).toLocaleString()}</option>
                    `).join('')}
                </select>
            </div>

            <div id="seats-section" style="display: none;">
                <div class="form-group">
                    <label>Select Seats</label>
                    <p>Click on seats to select them. Selected seats are highlighted in blue.</p>
                    <div class="seats-selection" id="seats-grid"></div>
                    <p>Selected: <span id="selected-count">0</span> seat(s)</p>
                </div>

                <div class="form-group">
                    <h3>Booking Summary</h3>
                    <p><strong>Movie:</strong> ${movie.title}</p>
                    <p><strong>Showtime:</strong> <span id="selected-showtime">-</span></p>
                    <p><strong>Seats:</strong> <span id="selected-seats-list">-</span></p>
                    <p><strong>Price per ticket:</strong> $${movie.price.toFixed(2)}</p>
                    <p><strong>Total amount:</strong> $<span id="total-amount">0.00</span></p>
                </div>

                <button class="btn btn-primary" style="width: 100%;" onclick="confirmBooking()">
                    Confirm Booking
                </button>
            </div>
        </div>
    `;

    document.getElementById('showtime-select').addEventListener('change', (e) => {
        selectedShowtime = e.target.value;
        if (selectedShowtime) {
            document.getElementById('seats-section').style.display = 'block';
            selectedSeats = [];
            generateSeats();
            updateSummary();
        }
    });
}

function generateSeats() {
    const grid = document.getElementById('seats-grid');
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const seatsPerRow = 10;
    
    // For demo, we'll generate random occupied seats
    const occupiedSeats = generateRandomOccupiedSeats(rows.length * seatsPerRow);
    
    grid.innerHTML = rows.map(row => {
        let html = '';
        for (let i = 1; i <= seatsPerRow; i++) {
            const seatId = `${row}${i}`;
            const isOccupied = occupiedSeats.includes(seatId);
            const isSelected = selectedSeats.includes(seatId);
            
            html += `
                <div class="seat ${isOccupied ? 'occupied' : ''} ${isSelected ? 'selected' : ''}" 
                     data-seat="${seatId}"
                     onclick="${isOccupied ? '' : `toggleSeat('${seatId}')`}">
                    ${row}${i}
                </div>
            `;
        }
        return html;
    }).join('');
}

function generateRandomOccupiedSeats(totalSeats) {
    const occupied = [];
    const count = Math.floor(totalSeats * 0.3); // 30% occupied
    for (let i = 0; i < count; i++) {
        const row = String.fromCharCode(65 + Math.floor(Math.random() * 8)); // A-H
        const num = Math.floor(Math.random() * 10) + 1;
        const seat = `${row}${num}`;
        if (!occupied.includes(seat)) {
            occupied.push(seat);
        }
    }
    return occupied;
}

function toggleSeat(seatId) {
    const index = selectedSeats.indexOf(seatId);
    if (index > -1) {
        selectedSeats.splice(index, 1);
    } else {
        selectedSeats.push(seatId);
    }
    generateSeats();
    updateSummary();
}

function updateSummary() {
    document.getElementById('selected-count').textContent = selectedSeats.length;
    document.getElementById('selected-seats-list').textContent = selectedSeats.length > 0 ? selectedSeats.join(', ') : '-';
    
    const showtimeSelect = document.getElementById('showtime-select');
    if (showtimeSelect && selectedShowtime) {
        document.getElementById('selected-showtime').textContent = new Date(selectedShowtime).toLocaleString();
    }
    
    if (currentMovie) {
        const total = selectedSeats.length * currentMovie.price;
        document.getElementById('total-amount').textContent = total.toFixed(2);
    }
}

async function confirmBooking() {
    if (!selectedShowtime) {
        showAlert('Please select a showtime', 'error');
        return;
    }

    if (selectedSeats.length === 0) {
        showAlert('Please select at least one seat', 'error');
        return;
    }

    try {
        const booking = await apiRequest('/bookings', {
            method: 'POST',
            body: JSON.stringify({
                movie: currentMovie._id,
                showtime: selectedShowtime,
                seats: selectedSeats,
                amount: selectedSeats.length * currentMovie.price
            })
        });

        showAlert('Booking confirmed! Redirecting to receipt...', 'success');
        setTimeout(() => {
            window.location.href = `receipt.html?bookingId=${booking._id}`;
        }, 1500);

    } catch (error) {
        showAlert(error.message || 'Booking failed. Please try again.', 'error');
    }
}

function showAlert(message, type) {
    const container = document.getElementById('alert-container');
    container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

