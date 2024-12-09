import { defineConfig, type Options } from 'tsup'

const defaultConfig: Options = {
  clean: true,
  dts: true,
  target: 'esnext',
  format: ['cjs', 'esm'],
}

export default defineConfig(defaultConfig)