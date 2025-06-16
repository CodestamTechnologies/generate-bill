import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';


export const getAdminEmails = async (): Promise<string[]> => {
    try {
        const adminsRef = collection(db, 'admins');
        const q = query(adminsRef, where('role', '==', 'admin'));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => doc.data().email);
    } catch (error) {
        console.error('Error fetching admin emails:', error);
        return [];
    }
};

export const sendPaymentNotification = async (paymentId: string, amount: number) => {
    try {
        const adminEmails = await getAdminEmails();
        if (adminEmails.length === 0) {
            console.warn('No admin emails found to send notification');
            return;
        }

        const emailContent = {
            to: adminEmails.join(','),
            subject: 'New Payment Requires Verification',
            text: `A new payment of ₹${amount} has been made and requires verification.
                  Payment ID: ${paymentId}
                  Please verify the payment in the admin dashboard.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">New Payment Requires Verification</h2>
                    <p>A new payment has been made and requires your verification.</p>
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Amount:</strong> ₹${amount}</p>
                        <p style="margin: 5px 0;"><strong>Payment ID:</strong> ${paymentId}</p>
                    </div>
                    <p>Please verify the payment in the admin dashboard.</p>
                    <p style="color: #666; font-size: 0.9em; margin-top: 20px;">
                        This is an automated message. Please do not reply to this email.
                    </p>
                </div>
            `
        };

        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailContent),
        });

        if (!response.ok) {
            throw new Error('Failed to send email notification');
        }

        const result = await response.json();
        console.log('Email notification sent:', result);

    } catch (error) {
        console.error('Error sending payment notification:', error);
    }
}; 
