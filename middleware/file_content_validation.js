const fs = require('fs');

const validateFileContent = async (req, res, next) => {
    try {
        // If no file was uploaded, continue
        if (!req.file) {
            return next();
        }

        // Read the uploaded file
        const buffer = fs.readFileSync(req.file.path);

        // Check file magic bytes manually for common image formats
        const isJPEG = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
        const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;

        if (!isJPEG && !isPNG) {
            // Delete the invalid file
            fs.unlinkSync(req.file.path);

            return res.status(400).json({
                message: 'Invalid file content',
                error: 'File content does not match the expected image format'
            });
        }

        // File is valid, continue
        next();

    } catch (error) {
        // If anything goes wrong, delete the file and return error
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting invalid file:', unlinkError);
            }
        }

        return res.status(400).json({
            message: 'File validation failed',
            error: error.message
        });
    }
};

module.exports = { validateFileContent }; 