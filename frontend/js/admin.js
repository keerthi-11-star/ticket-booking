document.addEventListener('DOMContentLoaded', () => {
    if (!requireAdmin()) return;
    loadMovies();
    
    document.getElementById('movie-form').addEventListener('submit', handleMovieSubmit);
});

async function loadMovies() {
    try {
        const movies = await apiRequest('/movies');
        displayMovies(movies);
    } catch (error) {
        showAlert('Error loading movies: ' + error.message, 'error');
    }
}

function displayMovies(movies) {
    const content = document.getElementById('admin-content');
    
    if (!movies || movies.length === 0) {
        content.innerHTML = '<p>No movies found.</p>';
        return;
    }

    content.innerHTML = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Price</th>
                        <th>Showtimes</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${movies.map(movie => `
                        <tr>
                            <td>${movie.title}</td>
                            <td>$${movie.price.toFixed(2)}</td>
                            <td>${movie.showtimes ? movie.showtimes.length : 0} showtime(s)</td>
                            <td>
                                <button class="btn btn-secondary" onclick="editMovie('${movie._id}')">Edit</button>
                                <button class="btn btn-danger" onclick="deleteMovie('${movie._id}')">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function loadUsers() {
    try {
        const users = await apiRequest('/users');
        displayUsers(users);
    } catch (error) {
        showAlert('Error loading users: ' + error.message, 'error');
    }
}

function displayUsers(users) {
    const content = document.getElementById('admin-content');
    
    if (!users || users.length === 0) {
        content.innerHTML = '<p>No users found.</p>';
        return;
    }

    content.innerHTML = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Created</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.name}</td>
                            <td>${user.email}</td>
                            <td>${user.role}</td>
                            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function loadAllBookings() {
    try {
        const bookings = await apiRequest('/bookings/all');
        displayAllBookings(bookings);
    } catch (error) {
        showAlert('Error loading bookings: ' + error.message, 'error');
    }
}

function displayAllBookings(bookings) {
    const content = document.getElementById('admin-content');
    
    if (!bookings || bookings.length === 0) {
        content.innerHTML = '<p>No bookings found.</p>';
        return;
    }

    content.innerHTML = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Movie</th>
                        <th>Showtime</th>
                        <th>Seats</th>
                        <th>Amount</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${bookings.map(booking => `
                        <tr>
                            <td>${booking.user ? booking.user.name : 'N/A'}</td>
                            <td>${booking.movie ? booking.movie.title : 'N/A'}</td>
                            <td>${new Date(booking.showtime).toLocaleString()}</td>
                            <td>${booking.seats.join(', ')}</td>
                            <td>$${booking.amount.toFixed(2)}</td>
                            <td>${new Date(booking.createdAt).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function showAddMovieModal() {
    document.getElementById('modal-title').textContent = 'Add Movie';
    document.getElementById('movie-id').value = '';
    document.getElementById('movie-form').reset();
    document.getElementById('movie-modal').classList.add('show');
}

async function editMovie(movieId) {
    try {
        const movie = await apiRequest(`/movies/${movieId}`);
        document.getElementById('modal-title').textContent = 'Edit Movie';
        document.getElementById('movie-id').value = movie._id;
        document.getElementById('movie-title').value = movie.title;
        document.getElementById('movie-poster').value = movie.poster || '';
        document.getElementById('movie-description').value = movie.description || '';
        document.getElementById('movie-price').value = movie.price;
        document.getElementById('movie-showtimes').value = movie.showtimes ? movie.showtimes.map(st => new Date(st).toISOString()).join(', ') : '';
        document.getElementById('movie-modal').classList.add('show');
    } catch (error) {
        showAlert('Error loading movie: ' + error.message, 'error');
    }
}

function closeMovieModal() {
    document.getElementById('movie-modal').classList.remove('show');
}

async function handleMovieSubmit(e) {
    e.preventDefault();
    
    const movieId = document.getElementById('movie-id').value;
    const title = document.getElementById('movie-title').value;
    const poster = document.getElementById('movie-poster').value;
    const description = document.getElementById('movie-description').value;
    const price = parseFloat(document.getElementById('movie-price').value);
    const showtimesStr = document.getElementById('movie-showtimes').value;
    
    const showtimes = showtimesStr.split(',').map(st => st.trim()).filter(st => st).map(st => new Date(st).toISOString());
    
    const movieData = {
        title,
        poster,
        description,
        price,
        showtimes
    };

    try {
        if (movieId) {
            await apiRequest(`/movies/${movieId}`, {
                method: 'PUT',
                body: JSON.stringify(movieData)
            });
            showAlert('Movie updated successfully!', 'success');
        } else {
            await apiRequest('/movies', {
                method: 'POST',
                body: JSON.stringify(movieData)
            });
            showAlert('Movie added successfully!', 'success');
        }
        
        closeMovieModal();
        loadMovies();
    } catch (error) {
        showAlert('Error saving movie: ' + error.message, 'error');
    }
}

async function deleteMovie(movieId) {
    if (!confirm('Are you sure you want to delete this movie?')) return;
    
    try {
        await apiRequest(`/movies/${movieId}`, {
            method: 'DELETE'
        });
        showAlert('Movie deleted successfully!', 'success');
        loadMovies();
    } catch (error) {
        showAlert('Error deleting movie: ' + error.message, 'error');
    }
}

function showAlert(message, type) {
    const container = document.getElementById('alert-container');
    container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

