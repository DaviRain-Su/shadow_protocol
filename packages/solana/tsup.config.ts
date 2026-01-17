import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['@px402/core', '@solana/web3.js', '@solana/spl-token', 'privacycash'],
});
