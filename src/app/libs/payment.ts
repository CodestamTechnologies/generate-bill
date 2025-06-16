import { db } from './firebase';
import { collection, query, where, getDocs, addDoc, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { sendPaymentNotification } from './email';

export interface Payment {
    id?: string;
    amount: number;
    status: 'pending' | 'verified' | 'rejected';
    createdAt: Timestamp;
    verifiedAt?: Timestamp;
    verifiedBy?: string;
    month: string; // Format: "YYYY-MM"
}

export const checkPaymentStatus = async (): Promise<boolean> => {
    try {
        const paymentsRef = collection(db, 'payments');
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const q = query(
            paymentsRef,
            where('month', '==', currentMonth),
            where('status', '==', 'verified')
        );

        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error) {
        console.error('Error checking payment status:', error);
        return false;
    }
};

export const createPayment = async (amount: number): Promise<string> => {
    try {
        const paymentsRef = collection(db, 'payments');
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // Check if a payment already exists for this month
        const q = query(
            paymentsRef,
            where('month', '==', currentMonth)
        );

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            throw new Error('A payment for this month already exists');
        }

        const paymentData: Payment = {
            amount,
            status: 'pending',
            createdAt: Timestamp.now(),
            month: currentMonth
        };

        const docRef = await addDoc(paymentsRef, paymentData);

        // Send email notification to admins
        await sendPaymentNotification(docRef.id, amount);

        return docRef.id;
    } catch (error) {
        console.error('Error creating payment:', error);
        throw error;
    }
};

export const updatePaymentStatus = async (
    paymentId: string,
    status: 'verified' | 'rejected',
    verifiedBy: string
): Promise<void> => {
    const paymentRef = doc(db, 'payments', paymentId);
    await updateDoc(paymentRef, {
        status,
        verifiedAt: Timestamp.now(),
        verifiedBy
    });
};
