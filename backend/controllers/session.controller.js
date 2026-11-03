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

// Most sessions a user can hold; the least recently used are removed beyond this
const MAX_SESSIONS_PER_USER = 10;

// Start a session after a successful login. Every browser and every app
// install gets its own session, so they never share (and never invalidate)
// each other's refresh token. Signing in again from the same browser (it
// still sends its refresh cookie) or the same device (same device_id)
// replaces that session's token instead of adding another session.
exports.start = async (email, user_id, { client_type = "web", device = {}, current_refresh_token } = {}) => {
	if (!email || !user_id) {
		return { error: true, message: "Credentials are required" };
	}
	try {
		let session = null;

		// Only reuse per-browser sessions; a legacy shared session (no
		// client_type) is left to the other browsers still using it
		if (typeof current_refresh_token === "string") {
			session = await Session.findOne({
				refresh_token: current_refresh_token,
				user_id,
				client_type: { $exists: true },
			});
		}
		if (!session && device.device_id) {
			session = await Session.findOne({ user_id, client_type, device_id: device.device_id });
		}

		const fields = {
			email: email.toLowerCase(),
			user_id,
			client_type,
			refresh_token: crypto.randomBytes(40).toString('hex'),
			refresh_token_expires_at: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000),
			device_name: device.device_name,
			platform: device.platform,
			app_version: device.app_version,
			last_used_at: new Date(),
		};

		if (session) {
			// Fresh token with no grace window: the old one simply stops working
			session.set({ ...fields, previous_refresh_token: undefined, consumed_at: undefined });
		} else {
			session = new Session({ ...fields, device_id: device.device_id });
		}

		const data = await session.save();
		await pruneSessions(user_id, data._id);

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

// Delete the user's least recently used sessions beyond MAX_SESSIONS_PER_USER
const pruneSessions = async (user_id, keep_id) => {
	const stale = await Session.find({ user_id, _id: { $ne: keep_id } })
		.sort({ updatedAt: -1 })
		.skip(MAX_SESSIONS_PER_USER - 1)
		.select("_id");
	if (stale.length > 0) {
		await Session.deleteMany({ _id: { $in: stale.map((s) => s._id) } });
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
				// Revoke only the session whose token was replayed, so one
				// compromised device does not log the user out everywhere
				await Session.deleteOne({ _id: session._id });
				console.warn(`Refresh token reuse detected; revoked session ${session._id} for user ${session.user_id}`);
				return { error: true, code: 401, message: "Token reuse detected. Session invalidated." };
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
        session.last_used_at = new Date();

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
