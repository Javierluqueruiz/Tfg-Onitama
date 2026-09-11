process.env.NODE_ENV ??= 'test';
process.env.JWT_SECRET ??= 'test-secret-para-vitest';
process.env.JWT_EXPIRES_IN ??= '1h';

// Solo por su efecto secundario: config/db.ts activa mongoose.set('sanitizeFilter', true)
// en cuanto se importa. Los tests conectan a Mongo por su cuenta (mongodb-memory-server),
// sin pasar nunca por connectDB() -- sin este import, esa protección nunca se activaría
// en el entorno de test, aunque sí lo esté en producción vía server.ts.
//
// Nota sobre orden: los `import` de nivel superior se "elevan" por encima de las tres
// líneas de arriba, así que este import se ejecuta antes de que se fijen los valores de
// repuesto. Ya no importa -- env.ts lee `process.env` con getters, no lo captura de una
// vez al importarse, así que da igual en qué momento se importe.
import '../src/config/db';
