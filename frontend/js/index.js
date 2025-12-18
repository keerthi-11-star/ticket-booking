// Home page script
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const movies = await apiRequest('/movies');
        displayMovies(movies);
    } catch (error) {
        console.error('Error loading movies:', error);
        document.getElementById('movies-grid').innerHTML = 
            '<p class="loading">Unable to load movies. Please try again later.</p>';
    }
});

function displayMovies(movies) {
    const grid = document.getElementById('movies-grid');
    
    if (!movies || movies.length === 0) {
        grid.innerHTML = '<p class="loading">No movies available at the moment.</p>';
        return;
    }

    grid.innerHTML = movies.map(movie => `
        <div class="movie-card" onclick="viewMovie('${movie._id}')">
            <img src="${movie.poster || 'https://via.placeholder.com/280x400?text=No+Poster'}" 
                 alt="${movie.title}" 
                 class="movie-poster"
                 onerror="this.src='https://via.placeholder.com/280x400?text=No+Poster'">
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <p class="movie-description">${movie.description || 'No description available'}</p>
                <p class="movie-price">$${movie.price || 'N/A'}</p>
            </div>
        </div>
    `).join('');
}

function viewMovie(movieId) {
    if (isAuthenticated()) {
        window.location.href = `booking.html?movieId=${movieId}`;
    } else {
        window.location.href = `login.html?redirect=booking.html?movieId=${movieId}`;
    }
}

