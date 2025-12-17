import nodemailer from 'nodemailer';

export interface EmailConfig {
  user: string;
  pass: string;
}

export interface EmailData {
  to: string;
  subject: string;
  body: string;
}

export async function sendEmail(
  config: EmailConfig,
  emailData: EmailData,
  pdfAttachment?: Buffer
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

    const mailOptions: nodemailer.SendMailOptions = {
      from: config.user,
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.body,
      html: emailData.body.replace(/\n/g, '<br>'),
    };

    // Add PDF attachment if provided
    if (pdfAttachment) {
      mailOptions.attachments = [
        {
          filename: 'CV.pdf',
          content: pdfAttachment,
          contentType: 'application/pdf',
        },
      ];
    }

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}
