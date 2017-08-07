import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import uglify from 'rollup-plugin-uglify';
import { version } from './package.json';

const target = process.env.TARGET || 'esm';
const env = process.env.NODE_ENV || 'development';
const isProd = env === 'production';
const banner =`/*
 * @license
 * @noflux/state v${version}
 * (c) 2017-${new Date().getFullYear()} Malash <i@malash.me>
 * Released under the MIT License.
 */`;

const config =  {
  entry: 'src/index.js',
  format: target,
  moduleName: 'NofluxState',
  banner,
  plugins: [
    resolve(),
    babel({
      babelrc: false,
      exclude: 'node_modules/**',
      // .babelrc
      presets: [
        ['es2015', { modules: false }],
        'stage-0'
      ],
      plugins: ['external-helpers'],
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify(env),
    }),
  ],
  dest: `dist/noflux-state.${target}.${isProd ? 'min.js' : 'js'}`,
};

if (isProd) {
  config.plugins.push(
    uglify({
      output: {
        comments: (node, { value, type }) => type === "comment2" && /@preserve|@license|@cc_on/i.test(value),
      },
    }),
  );
}

export default config;
