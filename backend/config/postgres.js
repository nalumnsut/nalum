const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.POSTGRESQL_DATABASE_URL;

if (!connectionString && process.env.NODE_ENV === 'production') {
	throw new Error('POSTGRESQL_DATABASE_URL is not set');
}

const pool = connectionString
	? new Pool({
		connectionString,
		ssl: process.env.PGSSLMODE === 'require' || process.env.NODE_ENV === 'production'
			? { rejectUnauthorized: false }
			: false,
	})
	: null;

function describeConnection() {
	try {
		const u = new URL(connectionString);
		const db = u.pathname.replace(/^\//, '') || 'postgres';
		const host = u.hostname || 'localhost';
		const port = u.port || '5432';
		return `${host}:${port}/${db}`;
	} catch (_) {
		return 'postgres';
	}
}

if (pool) {
	console.log(`Postgres pool initialized for ${describeConnection()}`);

	pool.on('error', (err) => {
		console.error('Postgres pool error (idle client):', err.message);
	});
} else {
	console.warn('POSTGRESQL_DATABASE_URL not set — Postgres disabled for this run. Postgres-backed features (alumni database admin tools, some image uploads) will not work until a connection string is provided.');
}

async function initPostgres() {
	if (!pool) {
		return true;
	}

	const start = Date.now();
	console.log('Checking Postgres connection...');
	let client;
	try {
		client = await pool.connect();
		const res = await client.query('SELECT NOW()');
		const ms = Date.now() - start;
		console.log(`Postgres connected to ${describeConnection()} (t=${ms}ms)`);
		return res.rows?.[0]?.now ?? true;
	} catch (err) {
		console.error('Postgres connection check failed:', err.message);
		return false;
	} finally {
		if (client) client.release();
	}
}

module.exports.pool = pool;
module.exports.initPostgres = initPostgres;
