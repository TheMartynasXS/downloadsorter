import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const buildDir = path.join(__dirname, '..', 'build');
const zipPath = path.join(buildDir, 'build.zip');

// Check if build directory exists
if (!fs.existsSync(buildDir)) {
    console.error('Build directory does not exist. Run "npm run build" first.');
    process.exit(1);
}

// Delete existing zip if it exists
if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
    console.log('Deleted existing build.zip');
}

// Create zip file
const output = fs.createWriteStream(zipPath);
const archive = archiver('zip', {
    zlib: { level: 9 }
});

output.on('close', () => {
    console.log(`Created build.zip (${archive.pointer()} bytes)`);
});

archive.on('error', (err) => {
    console.error('Error creating zip:', err);
    process.exit(1);
});

archive.pipe(output);

// Add all files in build directory to zip, excluding the zip file itself
const files = fs.readdirSync(buildDir);
files.forEach((file) => {
    if (file !== 'build.zip') {
        const filePath = path.join(buildDir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            archive.directory(filePath, file);
        } else {
            archive.file(filePath, { name: file });
        }
    }
});

archive.finalize();

