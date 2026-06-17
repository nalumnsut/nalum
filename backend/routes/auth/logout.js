const express = require('express');
const router = express.Router();
const sessions = require('../../controllers/session.controller');
const { clearCookieOptions } = require('../../utils/authCookies.js');

router.post('/', async (req, res) => {
    try {
        // Get refresh token from cookie
        const refreshToken = req.cookies.refresh_token;

        if (refreshToken) {
            // Delete the session from database using the refresh token
            const result = await sessions.delete(refreshToken);
            
            if (result.error && result.message !== "Session not found") {
                console.error('Error deleting session:', result.message);
            }
        }

        // Clear the refresh token and access token cookies
        res.clearCookie('refresh_token', clearCookieOptions());
        res.clearCookie('access_token', clearCookieOptions());
        
        
        
        res.status(200).json({
            error: false,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        
        // Even if there's an error, clear the cookies
        res.clearCookie('refresh_token', clearCookieOptions());
        res.clearCookie('access_token', clearCookieOptions());
        
        res.status(200).json({
            error: false,
            message: 'Logged out successfully'
        });
    }
});

module.exports = router;
