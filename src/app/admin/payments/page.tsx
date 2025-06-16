'use client';
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../libs/firebase';
import { updatePaymentStatus, Payment } from '../../libs/payment';

const AdminPaymentsPage = () => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const paymentsRef = collection(db, 'payments');
                const q = query(
                    paymentsRef,
                    where('status', '==', 'pending')
                );
                const querySnapshot = await getDocs(q);
                const paymentData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Payment[];
                setPayments(paymentData);
            } catch (error) {
                console.error('Failed to fetch payments:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPayments();
    }, []);

    const handleVerifyPayment = async (paymentId: string, status: 'verified' | 'rejected') => {
        try {
            await updatePaymentStatus(paymentId, status, 'admin123'); // Replace with actual admin ID
            setPayments(prev => prev.filter(p => p.id !== paymentId));
        } catch (error) {
            console.error('Failed to update payment status:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neutral-800 dark:border-white"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6 text-neutral-800 dark:text-white">
                Pending Payments
            </h1>

            {payments.length === 0 ? (
                <p className="text-neutral-600 dark:text-neutral-400">
                    No pending payments to verify.
                </p>
            ) : (
                <div className="space-y-4">
                    {payments.map((payment) => (
                        <div
                            key={payment.id}
                            className="bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700"
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-neutral-800 dark:text-white">
                                        User ID: {payment.userId}
                                    </p>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        Amount: ₹{payment.amount}
                                    </p>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        Date: {payment.createdAt.toDate().toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="space-x-2">
                                    <button
                                        onClick={() => handleVerifyPayment(payment.id, 'verified')}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                                    >
                                        Verify
                                    </button>
                                    <button
                                        onClick={() => handleVerifyPayment(payment.id, 'rejected')}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminPaymentsPage; 
