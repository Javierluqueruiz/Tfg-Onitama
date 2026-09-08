process.env.NODE_ENV ??= 'test';
process.env.JWT_SECRET ??= 'test-secret-para-vitest';
process.env.JWT_EXPIRES_IN ??= '1h';

// Solo por su efecto secundario: config/db.ts activa mongoose.set('sanitizeFilter', true)
// en cuanto se importa. Los tests conectan a Mongo por su cuenta (mongodb-memory-server),
// sin pasar nunca por connectDB() -- sin este import, esa protección nunca se activaría
// en el entorno de test, aunque sí lo esté en producción vía server.ts.
import '../src/config/db';
