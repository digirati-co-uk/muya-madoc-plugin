import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import compiler from '@ampproject/rollup-plugin-closure-compiler';

const isProduction = process.env.NODE_ENV === 'production';

export default {
    input: 'src/plugin.ts',
    output: [
        {
            dir: 'dist',
            format: 'umd',
            globals: {
                react: 'React',
                '@madoc.io/types': 'Madoc',
            },
        },
    ],
    external: ['react', '@madoc.io/types', 'react-router-dom', 'react-query'],
    plugins: [
        typescript({ target: 'es5' }),
        resolve({ browser: true }), // so Rollup can find `ms`
        isProduction && compiler(),
    ].filter(Boolean),
};
