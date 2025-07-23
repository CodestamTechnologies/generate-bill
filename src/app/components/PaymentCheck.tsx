'use client';
import React, { useEffect, useState } from 'react';
import { checkPaymentStatus } from '../libs/payment';
import PaymentPage from './PaymentPage';
import WeighbridgeSlip from './WeighbridgeSlip';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../libs/firebase';

const PaymentCheck: React.FC = () => {
    const [isVerified, setIsVerified] = useState<boolean | null>(null);
    const [isPending, setIsPending] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                // First check for verified payment
                const verified = await checkPaymentStatus();
                if (verified) {
                    setIsVerified(true);
                    setIsPending(false);
                    setIsLoading(false);
                    return;
                }

                // If no verified payment, check for pending payment
                const paymentsRef = collection(db, 'payments');
                const now = new Date();
                const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

                const q = query(
                    paymentsRef,
                    where('month', '==', currentMonth),
                    where('status', '==', 'pending')
                );

                // Set up real-time listener for payment status
                const unsubscribe = onSnapshot(q, (snapshot) => {
                    const hasPendingPayment = !snapshot.empty;
                    setIsPending(hasPendingPayment);
                    setIsVerified(false);
                    setIsLoading(false);
                });

                return () => unsubscribe();
            } catch (error) {
                console.error('Error checking payment status:', error);
                setIsLoading(false);
            }
        };

        checkStatus();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-800 dark:border-white"></div>
            </div>
        );
    }

    if (!isVerified) {
        return <WeighbridgeSlip />;
    }

    if (isPending) {
        return (
            <div className="space-y-8">
                <PaymentPage amount={333} onPaymentComplete={() => { }} />
                <div className="max-w-md mx-auto p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-center mb-6 text-neutral-800 dark:text-white">
                        Payment Status
                    </h2>
                    <div className="text-center">
                        <p className="text-lg text-neutral-600 dark:text-neutral-300 mb-4">
                            Your payment is pending verification. Please wait for admin approval.
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            This may take up to 24 hours.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return <PaymentPage amount={333} onPaymentComplete={() => setIsPending(true)} />;
};

export default PaymentCheck; 
