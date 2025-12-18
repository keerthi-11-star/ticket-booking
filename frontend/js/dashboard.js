document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;

    loadMovies();
    loadBookings();
});

async function loadMovies() {
    try {
        const movies = await apiRequest('/movies');
        displayMovies(movies);
    } catch (error) {
        console.error('Error loading movies:', error);
        document.getElementById('movies-grid').innerHTML = 
            '<p class="loading">Unable to load movies. Please try again later.</p>';
    }
}

function displayMovies(movies) {
    const grid = document.getElementById('movies-grid');
    
    if (!movies || movies.length === 0) {
        grid.innerHTML = '<p class="loading">No movies available at the moment.</p>';
        return;
    }

    grid.innerHTML = movies.map(movie => `
        <div class="movie-card" onclick="viewBooking('${movie._id}')">
            <img src="${movie.poster || 'https://via.placeholder.com/280x400?text=No+Poster'}" 
                 alt="${movie.title}" 
                 class="movie-poster"
                 onerror="this.src='https://via.placeholder.com/280x400?text=No+Poster'">
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <p class="movie-description">${movie.description || 'No description available'}</p>
                <p class="movie-price">$${movie.price || 'N/A'}</p>
                <button class="btn btn-primary" style="width: 100%; margin-top: 0.5rem;" onclick="event.stopPropagation(); viewBooking('${movie._id}')">
                    Book Now
                </button>
            </div>
        </div>
    `).join('');
}

function viewBooking(movieId) {
    window.location.href = `booking.html?movieId=${movieId}`;
}

async function loadBookings() {
    try {
        const bookings = await apiRequest('/bookings/my');
        displayBookings(bookings);
    } catch (error) {
        console.error('Error loading bookings:', error);
        document.getElementById('bookings-table').innerHTML = 
            '<tr><td colspan="6">Unable to load bookings. Please try again later.</td></tr>';
    }
}

function displayBookings(bookings) {
    const tbody = document.getElementById('bookings-table');
    
    if (!bookings || bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No bookings yet.</td></tr>';
        return;
    }

    tbody.innerHTML = bookings.map(booking => {
        const movie = booking.movie || {};
        const showtime = new Date(booking.showtime).toLocaleString();
        
        return `
            <tr>
                <td>${movie.title || 'N/A'}</td>
                <td>${showtime}</td>
                <td>${booking.seats.join(', ')}</td>
                <td>$${booking.amount.toFixed(2)}</td>
                <td><span style="color: var(--success-color);">Confirmed</span></td>
                <td>
                    <button class="btn btn-secondary" onclick="viewReceipt('${booking._id}')">
                        View Receipt
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function viewReceipt(bookingId) {
    window.location.href = `receipt.html?bookingId=${bookingId}`;
}

