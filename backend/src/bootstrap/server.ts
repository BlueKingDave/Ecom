import { buildApp } from './app';

async function start() {
  const app = await buildApp();

  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || '0.0.0.0';

  await app.listen({ port, host });

  console.log(`🚀 Server listening on http://${host}:${port}`);
  console.log(`📚 API Documentation: http://${host}:${port}/docs`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
