import nodemailer from 'nodemailer'


const emailClient = {
    send: async (email, link) => {

        /// code to send email
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: "contact@nightz.app",
                pass: "wsskcqyriyesgdwo",
            },
        });

        // Message object
        let message = {
            from: 'CarpathianCMS password reset link <sender@carpathian.com>',
            to: `Recipient <${email}>`,
            subject: 'Password Reset Link',
            text: `Here is your password reset link: ${link}`,
            html: `<p>Here is your password reset link: <a href="${link}">${link}</a></p>`,
        };

        let info = await transporter.sendMail(message);

        console.log('Message sent successfully as %s', info.messageId);
    }
};

export default emailClient