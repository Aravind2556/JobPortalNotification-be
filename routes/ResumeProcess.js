const Express = require('express')
const UserModel = require('../models/User')
const isAuth = require('../middleware/isAuth')
const fs = require('fs').promises;
const path = require('path');
const Candidate = require('../models/Candidate/Candidate')
const extractTextFromResume = require('../utils/Advancefilter/ExtractTextFromResume')


const ResumeProcess = Express.Router()

const IDS_DIR = path.join(__dirname, '..', 'uploads', 'ResumeIds')
const RES_DIR = path.join(__dirname, '..', 'uploads', 'Resume');

ResumeProcess.get('/process-resumes', async (req, res) => {
    // SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
    });
    res.flushHeaders();

    const send = (obj) => {
        res.write(`data: ${JSON.stringify(obj)}\n\n`);
    };

    try {
        const files = await fs.readdir(IDS_DIR);
        const resumeFiles = files.filter(f =>
            ['.pdf', '.docx'].includes(path.extname(f).toLowerCase())
        );
        send({ progress: 0, message: `Found ${resumeFiles.length} file(s).` });

        let allemails = []


        for (let i = 0; i < resumeFiles.length; i++) {
            const file = resumeFiles[i];
            const percentBase = Math.floor((i) / resumeFiles.length * 100);
            send({
                progress: percentBase,
                message: `[${i + 1}/${resumeFiles.length}] Processing “${file}”…`
            });

            const fullPath = path.join(IDS_DIR, file);
            let text
            try {
                text = await extractTextFromResume(path.relative(process.cwd(), fullPath));
            }
            catch (parseErr) {
                console.log(`Error parsing ${file}:`, parseErr);
                send({
                    progress: null,
                    message: `⚠ Parse error in ${file}: ${parseErr.message}`
                });
                continue;
            }

            if (!text) {
                send({ progress: null, message: `✖ No text; skipping ${file}.` });
                continue;
            }
            send({ progress: null, message: `✔ Text extracted.` });

            // const emails = extractGmailsFromResume(text);


            const fetchEmails = await fetch(`http://127.0.0.1:8000/data/`, {
                method: 'post',
                headers: {
                    "Content-type": "application/json",
                    Accept: "application/json"
                },
                body: JSON.stringify({ resumeText: text })
            })

            if (!fetchEmails) {
                send({ progress: null, message: `✖ Failed to fetch 8000/data API; skipping ${file}.` });
                continue;
            }

            const res = await fetchEmails.json()

            if (!res.received_data) {
                send({ progress: null, message: `✖ Failed to handle 8000/data API response; skipping ${file}.` });
                continue;
            }

            const emails = res.received_data

            console.log("EMail found:", i, emails)

            if (!emails.length) {
                send({ progress: null, message: `✖ No Gmail found; skipping ${file}.` });
                continue;
            }
            send({ progress: null, message: `✔ Found: ${emails.join(', ')}.` });

            allemails.push(...emails);

            // Check DB
            const statuses = await Promise.all(
                emails.map(async email => ({
                    mail: email,
                    status: Boolean(await Candidate.exists({ emailAddress: email.toLowerCase().trim() }))
                }))
            );



            const matches = statuses.filter(s => s.status);
            if (matches.length !== 1) {
                send({ progress: null, message: `✖ ${matches.length} DB matches; skipping.` });
                continue;
            }

            const chosenMail = matches[0].mail;
            // // Sanitize the encrypted name
            // let nameHash = encryptFilename(file).replace(/[:\/\\]/g, '');
            // const encryptedName = nameHash + path.extname(file);

            // // Try moving the file
            try {
                await fs.rename(fullPath, path.join(RES_DIR, file));
            } catch (mvErr) {
                console.log(`Error moving ${file}:`, mvErr);
                send({ progress: null, message: `⚠ Move failed: ${mvErr.message}` });
                continue;
            }



            send({
                progress: Math.floor((i + 1) / resumeFiles.length * 100),
                message: `✔ ${file} → ${file} (linked to ${chosenMail}).`
            });
        }


        // Afer process all resume files, check for candidates not in the email lists.
        const isNotCandiadateExist = await Candidate.find(
            { emailAddress: { $nin: allemails.map(e => e.toLowerCase().trim()) } }, // ✅ use $nin not $ne
            { applicantID: 1 }
        );

        console.log('isNotCandiadateExist', isNotCandiadateExist);

        for (const user of isNotCandiadateExist) {
            try {
                await fs.appendFile("resumet.txt", user.applicantID + "\n");
            } catch (err) {
                console.log("Error in writing file:", err);
            }
        }


        send({ progress: 100, message: 'All resumes processed.' });
        res.end();
    } catch (err) {
        console.log("Error in processing Resume:", err)
        send({ progress: null, message: `⚠ Error: ${err.message}` });
        res.end();
    }
});

module.exports = ResumeProcess