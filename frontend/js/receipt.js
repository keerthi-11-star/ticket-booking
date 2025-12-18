document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;

    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('bookingId');

    if (!bookingId) {
        window.location.href = 'dashboard.html';
        return;
    }

    await loadReceipt(bookingId);
});

async function loadReceipt(bookingId) {
    try {
        const booking = await apiRequest(`/bookings/${bookingId}`);
        displayReceipt(booking);
    } catch (error) {
        document.getElementById('receipt-container').innerHTML = 
            '<div class="alert alert-error">Receipt not found. <a href="dashboard.html">Go back</a></div>';
    }
}

function displayReceipt(booking) {
    const container = document.getElementById('receipt-container');
    const movie = booking.movie || {};
    const user = booking.user || getCurrentUser() || {};
    
    container.innerHTML = `
        <div class="booking-form" style="max-width: 600px;">
            <h2>🎟️ Booking Confirmed</h2>
            <div class="alert alert-success">
                Your booking has been confirmed! Please save this receipt.
            </div>
            
            <div style="background: var(--light-color); padding: 2rem; border-radius: 0.5rem; margin: 1.5rem 0;">
                <h3 style="margin-bottom: 1rem;">Booking Details</h3>
                <p><strong>Booking ID:</strong> ${booking._id}</p>
                <p><strong>Date:</strong> ${new Date(booking.createdAt).toLocaleString()}</p>
            </div>

            <div style="background: var(--light-color); padding: 2rem; border-radius: 0.5rem; margin: 1.5rem 0;">
                <h3 style="margin-bottom: 1rem;">Movie Information</h3>
                <p><strong>Movie:</strong> ${movie.title || 'N/A'}</p>
                <p><strong>Showtime:</strong> ${new Date(booking.showtime).toLocaleString()}</p>
                <p><strong>Seats:</strong> ${booking.seats.join(', ')}</p>
            </div>

            <div style="background: var(--light-color); padding: 2rem; border-radius: 0.5rem; margin: 1.5rem 0;">
                <h3 style="margin-bottom: 1rem;">Customer Information</h3>
                <p><strong>Name:</strong> ${user.name || 'N/A'}</p>
                <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
            </div>

            <div style="background: var(--primary-color); color: white; padding: 2rem; border-radius: 0.5rem; margin: 1.5rem 0;">
                <h3 style="margin-bottom: 1rem;">Total Amount</h3>
                <p style="font-size: 2rem; font-weight: bold;">$${booking.amount.toFixed(2)}</p>
            </div>

            <div style="margin-top: 2rem;">
                <button class="btn btn-primary" style="width: 100%;" onclick="window.print()">Print Receipt</button>
                <button class="btn btn-secondary" style="width: 100%; margin-top: 1rem;" onclick="window.location.href='dashboard.html'">
                    Back to Dashboard
                </button>
            </div>
        </div>
    `;
}

