import { Colord, colord, extend } from 'colord';
import mixPlugin from 'colord/plugins/mix';
import chalk from 'chalk';
import { rgbToX256 } from './x256.js';

// @ts-ignore
extend([mixPlugin]);

const COLORS = {
    bg: '#1d2226',
    fg: '#d3c6aa',
    black: '#4b565c',
    red: '#e67e80',
    green: '#aec89f',
    yellow: '#dbbc7f',
    blue: '#aeccc6',
    magenta: '#d699b6',
    cyan: '#a2ccae',
    white: '#d3c6aa',
    gray: '#77817d',
};

function main() {
    Object.entries(COLORS).forEach(([name, value]) => {
        const darkest = colord(value).mix('#0d1011', 0.85);
        const darker = colord(value).mix(COLORS.bg, 0.6);
        const dark = colord(value).mix(COLORS.bg, 0.3);
        const light = colord(value).lighten(0.1);
        const lighter = colord(value).lighten(0.2);

        format(`${name}_darkest`, darkest);
        format(`${name}_darker`, darker);
        format(`${name}_dark`, dark);
        format(name, colord(value));
        format(`${name}_light`, light);
        format(`${name}_lighter`, lighter);
        console.log('');
    });
}

function format(name: string, value: Colord) {
    const valueHex = value.toHex();
    const valueRgb = value.toRgb();
    const cterm = rgbToX256(valueRgb.r, valueRgb.g, valueRgb.b);

    console.log(
        chalk.bgHex(valueHex)('  ') +
            chalk.reset(` ${name} = { gui = '${valueHex}', cterm= ${cterm} },`)
    );
}

main();
