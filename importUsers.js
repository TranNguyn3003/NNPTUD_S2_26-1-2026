const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const User = require('./schemas/users');
const Role = require('./schemas/roles');

// Setup Nodemailer based on existing utils/mailHandler.js config
const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 25,
    secure: false, // Use true for port 465, false for port 587
    auth: {
        user: "a7e1d7e3ad0f39",
        pass: "573606fc04147f",
    },
});

// Function to generate a random 16-character string password
function generatePassword() {
    // 8 bytes = 16 hex characters
    return crypto.randomBytes(8).toString('hex');
}

// Utility to prevent Mailtrap rate limiting
const delay = ms => new Promise(res => setTimeout(res, ms));

async function importUsers() {
    try {
        console.log("Connecting to database...");
        await mongoose.connect('mongodb://localhost:27017/NNPTUD-S2');
        console.log("Connected to database.");

        // We need an existing role ID to assign to new users
        let defaultRole = await Role.findOne({ name: 'User' });
        if (!defaultRole) {
            defaultRole = await Role.findOne();
        }
        if (!defaultRole) {
            console.log("No role found! Creating a dummy default role...");
            defaultRole = await Role.create({ name: 'User', description: 'Default user role' });
        }

        console.log("Reading the excel file...");
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile('/Users/tranngyn/Downloads/23:03:2026/user.xlsx');
        const worksheet = workbook.worksheets[0];

        const usersData = [];
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber === 1) return; // skip header row
            
            const username = row.getCell(1).value;
            let email = row.getCell(2).value;

            // Handle various ExcelJS object representations (hyperlink, formula result, rich text)
            if (email && typeof email === 'object') {
                if (email.result) {
                    email = email.result; // Formula result
                } else if (email.text) {
                    email = email.text; // Hyperlink
                } else if (email.richText) {
                    email = email.richText.map(t => t.text).join(''); // Rich text
                }
            }

            if (username && email) {
                usersData.push({ 
                    username: username.toString().trim(), 
                    email: email.toString().trim() 
                });
            }
        });

        console.log(`Found ${usersData.length} records to import. Starting import...`);

        let successCount = 0;
        let skippedCount = 0;

        for (const userData of usersData) {
            const { username, email } = userData;

            // Check if user already exists
            const existingUser = await User.findOne({
                $or: [{ username: username }, { email: email }]
            });

            if (!existingUser) {
                const password = generatePassword();

                // Because of userSchema.pre('save'), this plain password will be auto-hashed on save
                const newUser = new User({
                    username: username,
                    email: email,
                    password: password,
                    role: defaultRole._id,
                    status: true // Optional: activate the user right away
                });

                await newUser.save();
                successCount++;

                // Send email to the user with the generated raw password
                try {
                    await transporter.sendMail({
                        from: 'admin@heha.com',
                        to: email,
                        subject: "Your New Account Details",
                        text: `Hello ${username},\n\nYour account has been successfully created.\n\nYour username: ${username}\nYour password: ${password}\n\nPlease keep it safe.`,
                        html: `<p>Hello <b>${username}</b>,</p><p>Your account has been successfully created.</p><p><b>Username:</b> ${username}</p><p><b>Password:</b> ${password}</p><p>Please keep it safe and remember to change it later.</p>`,
                    });
                    console.log(`[Success] Imported ${username} and sent email to ${email}`);
                } catch (mailErr) {
                    console.log(`[Warning] Imported ${username} but email failed:`, mailErr.message);
                } finally {
                    await delay(3500); // Wait 3.5s before next email to avoid Mailtrap rate limit
                }
            } else {
                skippedCount++;
                console.log(`[Skipped] User ${username} or ${email} already exists.`);
            }
        }

        console.log(`\nImport Process Done!`);
        console.log(`Total Successful: ${successCount}`);
        console.log(`Total Skipped: ${skippedCount}`);

    } catch (err) {
        console.error("Error occurred during the import process:", err);
    } finally {
        mongoose.disconnect();
        console.log("Disconnected from database.");
    }
}

importUsers();
