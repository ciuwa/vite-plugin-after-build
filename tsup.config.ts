import { defineConfig, type Options } from 'tsup'
import autoVersion from './plugin/autoVersion'

const defaultConfig: Options = {
  esbuildPlugins: [
    autoVersion()
  ],
  clean: true,
  dts: true,
  target: 'esnext',
  format: ['cjs', 'esm'],
}

export default defineConfig(defaultConfig)