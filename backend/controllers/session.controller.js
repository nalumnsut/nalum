const Session = require("../models/auth/session.model.js");
const { generateAccessToken, verifyAccessToken } = require("./jwt.controller.js");
const crypto = require("crypto");

// Create session with JWT access token (always creates a new session)
exports.create = async (email, user_id) => {
	if (!email || !user_id) {
		return { error: true, message: "Credentials are required" };
	}
	try {
        const refresh_token = crypto.randomBytes(40).toString('hex');
        
		const session = new Session({
			email: email.toLowerCase(),
			user_id,
            refresh_token
		});
		const data = await session.save();
		const raw = data.toObject();
		// Generate JWT access token
		const accessToken = generateAccessToken({
			user_id: user_id,
			email: email,
			session_id: raw._id,
		});
		return {
			error: false,
			data: { ...raw, access_token: accessToken },
		};
	} catch (err) {
		return { error: true, message: err.message };
	}
};

// Get existing session by email or create a new one if none exists
exports.getOrCreate = async (email, user_id) => {
	if (!email || !user_id) {
		return { error: true, message: "Credentials are required" };
	}
	try {
		const lower = email.toLowerCase();
		const existing = await Session.findOne({ email: lower });

		if (existing) {
			existing.refresh_token_expires_at = new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000);
			await existing.save();
			const raw = existing.toObject();
			const accessToken = generateAccessToken({
				user_id: user_id,
				email: email,
				session_id: raw._id,
			});
			return { error: false, data: { ...raw, access_token: accessToken } };
		}

		// no existing session; create a fresh one
        const refresh_token = crypto.randomBytes(40).toString('hex');
		const session = new Session({
			email: lower,
			user_id,
            refresh_token,
            refresh_token_expires_at: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000)
		});
		const data = await session.save();
		const raw = data.toObject();
		const accessToken = generateAccessToken({
			user_id: user_id,
			email: email,
			session_id: raw._id,
		});
		return { error: false, data: { ...raw, access_token: accessToken } };
	} catch (err) {
		return { error: true, message: err.message };
	}
};

// Validate Access Token (now JWT)
exports.validateAccessToken = async (access_token) => {
	if (!access_token) {
		return { error: true, message: "Some details are missing" };
	}
	try {
		const decoded = verifyAccessToken(access_token);
        
		return {
			error: false,
			exists: true,
			expired: false,
			user_id: decoded.user_id,
			decoded,
		};
	} catch (err) {
		if (err.name === 'TokenExpiredError') {
			return { error: false, exists: true, expired: true };
		}
		return { error: true, message: err.message };
	}
};

// Update Access Token (refresh flow)
exports.updateAccessToken = async (incoming_refresh_token) => {
	if (!incoming_refresh_token) {
		return { error: true, message: "Some details are missing" };
	}
	try {
        const session = await Session.findOne({
            $or: [
                { refresh_token: incoming_refresh_token },
                { previous_refresh_token: incoming_refresh_token }
            ]
        });

		if (!session) {
			return { error: true, code: 401, message: "Invalid refresh token", exists: false };
		}

        // SCENARIO A: GRACE PERIOD REUSE
		if (session.previous_refresh_token === incoming_refresh_token) {
            const timeSinceConsumed = Date.now() - (session.consumed_at ? session.consumed_at.getTime() : 0);
			
			if (timeSinceConsumed < 20000) {
				const newAccessToken = generateAccessToken({
					user_id: session.user_id,
					email: session.email,
					session_id: session._id,
				});

				return {
					error: false,
					data: {
						access_token: newAccessToken,
						refresh_token: session.refresh_token,
						user_id: session.user_id,
					}
				};
			} else {
				await Session.deleteMany({ user_id: session.user_id });
				return { error: true, code: 401, message: "Token reuse detected. All sessions invalidated." };
			}
		}

        // SCENARIO B: FRESH REFRESH REQUEST
		if (session.refresh_token_expires_at < new Date()) {
			return { error: true, code: 401, exists: true, expired: true };
		}

		// Generate new tokens
        const new_refresh_token = crypto.randomBytes(40).toString('hex');
		const new_access_token = generateAccessToken({
			user_id: session.user_id,
			email: session.email,
			session_id: session._id,
		});

        // Rotate the tokens on the SAME document
        session.previous_refresh_token = session.refresh_token;
        session.consumed_at = Date.now();
        session.refresh_token = new_refresh_token;
        session.refresh_token_expires_at = new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000);

        await session.save();

		return {
            error: false,
            data: {
                ...session.toObject(),
                access_token: new_access_token,
            }
        };
	} catch (err) {
		return { error: true, message: err.message };
	}
};

// Delete session
exports.delete = async (refresh_token) => {
  if (!refresh_token) {
    return { error: true, message: "Some details are missing" };
  }
  try {
    const result = await Session.deleteOne({ refresh_token });
    if (result.deletedCount === 0) {
      return { error: true, message: "Session not found" };
    }
    return { error: false, message: "Session deleted successfully" };
  } catch (err) {
    return { error: true, message: err.message };
  }
};
