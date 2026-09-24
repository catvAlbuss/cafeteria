import fs from 'node:fs';
import path from 'node:path';

const emojiRe = /[\p{Extended_Pictographic}]/u;
const out = [];
function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.tsx?$/.test(e.name)) {
            const lines = fs.readFileSync(p, 'utf8').split('\n');
            lines.forEach((line, i) => {
                const t = line.split('//')[0];
                if (emojiRe.test(t) && !/console\.log/.test(t))
                    out.push(
                        `${path.relative('resources/js', p).split(path.sep).join('/')}:${i + 1}: ${t.trim()}`,
                    );
            });
        }
    }
}
walk('resources/js');
console.log(out.join('\n'));
console.log('\nTOTAL:', out.length);