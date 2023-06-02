/**
 * Find the closest X256 to the given RGB color.
 * https://stackoverflow.com/a/41978310
 */
export function rgbToX256(r: number, g: number, b: number): number {
    // Calculate the nearest 0-based color index at 16 .. 231
    const v2ci = (v: number) => {
        if (v < 48) {
            return 0;
        } else if (v < 115) {
            return 1;
        } else {
            return Math.trunc((v - 35) / 40);
        }
    };

    const ir = v2ci(r);
    const ig = v2ci(g);
    const ib = v2ci(b);
    const colorIndex = 36 * ir + 6 * ig + ib;

    // Calculate the nearest 0-based gray index at 232 .. 255
    const average = Math.trunc((r + g + b) / 3);
    const grayIndex = average > 238 ? 23 : Math.trunc((average - 3) / 10);

    // Calculate the represented colors back from the index
    const i2cv = [0, 0x5f, 0x87, 0xaf, 0xd7, 0xff];
    const cr = i2cv[ir];
    const cg = i2cv[ig];
    const cb = i2cv[ib];
    const gv = 8 + 10 * grayIndex;

    // Return the one which is nearer to the original input rgb value
    const distSquare = (
        A: number,
        B: number,
        C: number,
        a: number,
        b: number,
        c: number
    ) => {
        return (A - a) * (A - a) + (B - b) * (B - b) + (C - c) * (C - c);
    };

    const colorErr = distSquare(cr, cg, cb, r, g, b);
    const grayErr = distSquare(gv, gv, gv, r, g, b);

    return colorErr <= grayErr ? 16 + colorIndex : 232 + grayIndex;
}
