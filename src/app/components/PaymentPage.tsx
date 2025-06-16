'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { createPayment } from '../libs/payment';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../libs/firebase';

interface PaymentPageProps {
    amount: number;
    onPaymentComplete: () => void;
}

const PaymentPage: React.FC<PaymentPageProps> = ({ amount, onPaymentComplete }) => {
    const [paymentId, setPaymentId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [existingPaymentId, setExistingPaymentId] = useState<string | null>(null);

    useEffect(() => {
        const checkExistingPayment = async () => {
            try {
                const paymentsRef = collection(db, 'payments');
                const now = new Date();
                const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

                const q = query(
                    paymentsRef,
                    where('month', '==', currentMonth),
                    where('status', '==', 'pending')
                );

                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    setExistingPaymentId(querySnapshot.docs[0].id);
                }
            } catch (error) {
                console.error('Failed to check existing payment:', error);
            }
        };

        checkExistingPayment();
    }, []);

    const handleInitiatePayment = async () => {
        setIsProcessing(true);
        setError(null);
        try {
            const id = await createPayment(amount);
            setPaymentId(id);
        } catch (error) {
            console.error('Failed to initiate payment:', error);
            if (error instanceof Error && error.message === 'A payment for this month already exists') {
                setError('A payment for this month is already pending verification.');
            } else {
                setError('Failed to initiate payment. Please try again.');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePaymentComplete = () => {
        onPaymentComplete();
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-center mb-6 text-neutral-800 dark:text-white">
                Monthly Subscription Payment
            </h2>

            <div className="text-center mb-6">
                <p className="text-lg text-neutral-600 dark:text-neutral-300 mb-2">
                    Amount to Pay: ₹{amount}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Scan the QR code below to make the payment
                </p>
            </div>

            <div className="flex justify-center mb-6">
                <div className="relative w-64 h-64 bg-white p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <Image
                        src="/qr.jpg"
                        alt="Payment QR Code"
                        fill
                        className="object-contain"
                    />
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg">
                    <p className="text-red-800 dark:text-red-200 text-center text-sm">
                        {error}
                    </p>
                </div>
            )}

            <div className="space-y-4">
                {!paymentId && !existingPaymentId ? (
                    <button
                        onClick={handleInitiatePayment}
                        disabled={isProcessing}
                        className="w-full px-4 py-2 bg-neutral-800 hover:bg-neutral-700 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white rounded-md transition-colors disabled:opacity-50"
                    >
                        {isProcessing ? 'Processing...' : 'Start Payment Process'}
                    </button>
                ) : (
                    <button
                        onClick={handlePaymentComplete}
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                    >
                        I Have Made the Payment
                    </button>
                )}
            </div>

            <div className="mt-6 text-center">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    After making the payment, click the button above to notify us.
                    <br />
                    Your payment will be verified within 24 hours.
                </p>
            </div>
        </div>
    );
};

export default PaymentPage; 
