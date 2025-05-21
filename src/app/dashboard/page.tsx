'use client';
import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import Link from 'next/link';
import { PDFDownloadLink } from '@react-pdf/renderer';
import SlipPDF, { SlipData } from '../components/SlipPDF';
import { db } from '../libs/firebase';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend);

interface WeighbridgeSlip extends SlipData {
    id: string;
    createdAt: string;
}

const WeighbridgeDashboard: React.FC = () => {
    const [slips, setSlips] = useState<WeighbridgeSlip[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>('');
    const [materialFilter, setMaterialFilter] = useState<string>('');
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
    const [sortField, setSortField] = useState<keyof SlipData | 'createdAt'>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [selectedSlip, setSelectedSlip] = useState<WeighbridgeSlip | null>(null);

    // Statistics state
    const [stats, setStats] = useState<{
        totalSlips: number;
        totalNetWeight: number;
        averageNetWeight: number;
        uniqueParties: number;
        uniqueMaterials: number;
    }>({ totalSlips: 0, totalNetWeight: 0, averageNetWeight: 0, uniqueParties: 0, uniqueMaterials: 0 });

    // Fetch slips from Firestore
    useEffect(() => {
        const fetchSlips = async () => {
            try {
                setLoading(true);
                const querySnapshot = await getDocs(collection(db, 'weighbridgeSlips'));
                const slipsData: WeighbridgeSlip[] = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                } as WeighbridgeSlip));
                setSlips(slipsData);

                // Calculate statistics
                const totalNetWeight = slipsData.reduce(
                    (sum, slip) => sum + (parseInt(slip.netWt.replace(/\D/g, ''), 10) || 0),
                    0
                );
                const uniqueParties = new Set(slipsData.map((slip) => slip.partyName)).size;
                const uniqueMaterials = new Set(slipsData.map((slip) => slip.material)).size;
                setStats({
                    totalSlips: slipsData.length,
                    totalNetWeight,
                    averageNetWeight: slipsData.length ? totalNetWeight / slipsData.length : 0,
                    uniqueParties,
                    uniqueMaterials,
                });
                setError(null);
            } catch (err) {
                console.error('Error fetching slips:', err);
                setError('Failed to load weighbridge slips.');
            } finally {
                setLoading(false);
            }
        };
        fetchSlips();
    }, []);

    // Handle delete slip
    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this slip?')) {
            try {
                await deleteDoc(doc(db, 'weighbridgeSlips', id));
                setSlips(slips.filter((slip) => slip.id !== id));
                setError(null);
            } catch (err) {
                console.error('Error deleting slip:', err);
                setError('Failed to delete slip.');
            }
        }
    };

    // Handle sorting
    const handleSort = (field: keyof SlipData | 'createdAt') => {
        const isSameField = field === sortField;
        const newOrder = isSameField && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortOrder(newOrder);

        setSlips((prevSlips) =>
            [...prevSlips].sort((a, b) => {
                const aValue = a[field] || '';
                const bValue = b[field] || '';
                if (field === 'netWt') {
                    const aNum = parseInt(aValue.replace(/\D/g, ''), 10) || 0;
                    const bNum = parseInt(bValue.replace(/\D/g, ''), 10) || 0;
                    return newOrder === 'asc' ? aNum - bNum : bNum - aNum;
                }
                if (field === 'createdAt') {
                    return newOrder === 'asc'
                        ? new Date(aValue).getTime() - new Date(bValue).getTime()
                        : new Date(bValue).getTime() - new Date(aValue).getTime();
                }
                return newOrder === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            })
        );
    };

    // Filter slips
    const filteredSlips = slips.filter((slip) => {
        const matchesText =
            slip.rstNo.toLowerCase().includes(filter.toLowerCase()) ||
            slip.partyName.toLowerCase().includes(filter.toLowerCase());
        const matchesMaterial = materialFilter ? slip.material === materialFilter : true;
        const matchesDateRange =
            dateRange.start && dateRange.end
                ? new Date(slip.dateGross.split('/').reverse().join('-')) >= new Date(dateRange.start) &&
                new Date(slip.dateGross.split('/').reverse().join('-')) <= new Date(dateRange.end)
                : true;
        return matchesText && matchesMaterial && matchesDateRange;
    });

    // Get unique materials for filter dropdown
    const uniqueMaterials = Array.from(new Set(slips.map((slip) => slip.material))).sort();

    // Chart data for material distribution (Pie chart)
    const materialCounts = slips.reduce((acc, slip) => {
        acc[slip.material] = (acc[slip.material] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const pieChartData = {
        labels: Object.keys(materialCounts),
        datasets: [
            {
                data: Object.values(materialCounts),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
            },
        ],
    };

    // Chart data for net weight trend (Line chart)
    const weightByDate = slips.reduce((acc, slip) => {
        const date = slip.dateGross;
        const netWt = parseInt(slip.netWt.replace(/\D/g, ''), 10) || 0;
        acc[date] = (acc[date] || 0) + netWt;
        return acc;
    }, {} as Record<string, number>);
    const lineChartData = {
        labels: Object.keys(weightByDate).sort(),
        datasets: [
            {
                label: 'Net Weight (Kg)',
                data: Object.keys(weightByDate)
                    .sort()
                    .map((date) => weightByDate[date]),
                borderColor: '#36A2EB',
                fill: false,
            },
        ],
    };

    // Chart data for top parties by net weight (Bar chart)
    const weightByParty = slips.reduce((acc, slip) => {
        const netWt = parseInt(slip.netWt.replace(/\D/g, ''), 10) || 0;
        acc[slip.partyName] = (acc[slip.partyName] || 0) + netWt;
        return acc;
    }, {} as Record<string, number>);
    const topParties = Object.entries(weightByParty)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5); // Top 5 parties
    const barChartData = {
        labels: topParties.map(([party]) => party),
        datasets: [
            {
                label: 'Total Net Weight (Kg)',
                data: topParties.map(([, weight]) => weight),
                backgroundColor: '#FF6384',
            },
        ],
    };

    // Export to CSV
    const exportToCSV = () => {
        const headers = [
            'RST No.',
            'Party Name',
            'Phone No.',
            'Vehicle',
            'Material',
            'Address',
            'Gross Weight',
            'Tare Weight',
            'Net Weight',
            'Net Weight (Words)',
            'Gross Date',
            'Gross Time',
            'Tare Date',
            'Tare Time',
            'Created At',
        ];
        const rows = filteredSlips.map((slip) => [
            slip.rstNo,
            slip.partyName,
            slip.phoneNo,
            slip.vehicle,
            slip.material,
            slip.address,
            slip.grossWt,
            slip.tareWt,
            slip.netWt,
            slip.netWtWords,
            slip.dateGross,
            slip.timeGross,
            slip.dateTare,
            slip.timeTare,
            new Date(slip.createdAt).toLocaleString(),
        ]);
        const csvContent = [
            headers.join(','),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'weighbridge_slips.csv';
        link.click();
    };

    // Open modal for slip details
    const openSlipDetails = (slip: WeighbridgeSlip) => {
        setSelectedSlip(slip);
    };

    // Close modal
    const closeSlipDetails = () => {
        setSelectedSlip(null);
    };

    return (
        <div className="mx-auto p-8 dark:bg-neutral-900 shadow-lg border border-neutral-100 dark:border-neutral-800">
            {/* Header */}
            <div className="mb-10 text-center">
                <h1 className="text-3xl font-bold text-neutral-800 dark:text-white mb-2">
                    Weighbridge Slip Dashboard
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400">
                    View, manage, and analyze your weighbridge slips
                </p>
            </div>

            {/* Error Notification */}
            {error && (
                <div className="mb-6 p-4 rounded-lg text-sm font-medium bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30">
                    {error}
                </div>
            )}

            {/* Statistics */}
            <div className="mb-8 p-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-100 dark:border-neutral-800">
                <h3 className="font-medium text-lg mb-4 text-neutral-800 dark:text-neutral-200">Summary Statistics</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Slips</p>
                        <p className="text-xl font-medium text-neutral-800 dark:text-neutral-200">{stats.totalSlips}</p>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Net Weight (Kg)</p>
                        <p className="text-xl font-medium text-neutral-800 dark:text-neutral-200">{stats.totalNetWeight}</p>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Average Net Weight (Kg)</p>
                        <p className="text-xl font-medium text-neutral-800 dark:text-neutral-200">
                            {stats.averageNetWeight.toFixed(2)}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Unique Parties</p>
                        <p className="text-xl font-medium text-neutral-800 dark:text-neutral-200">{stats.uniqueParties}</p>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Unique Materials</p>
                        <p className="text-xl font-medium text-neutral-800 dark:text-neutral-200">{stats.uniqueMaterials}</p>
                    </div>
                </div>
            </div>

            {/* Visualizations */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <h3 className="font-medium text-lg mb-4 text-neutral-800 dark:text-neutral-200">
                        Material Distribution
                    </h3>
                    <Pie
                        data={pieChartData}
                        options={{
                            responsive: true,
                            plugins: { legend: { position: 'top' }, tooltip: { enabled: true } },
                        }}
                    />
                </div>
                <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <h3 className="font-medium text-lg mb-4 text-neutral-800 dark:text-neutral-200">
                        Net Weight Trend
                    </h3>
                    <Line
                        data={lineChartData}
                        options={{
                            responsive: true,
                            plugins: { legend: { position: 'top' }, tooltip: { enabled: true } },
                            scales: { x: { title: { display: true, text: 'Date' } }, y: { title: { display: true, text: 'Net Weight (Kg)' } } },
                        }}
                    />
                </div>
                <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 md:col-span-2">
                    <h3 className="font-medium text-lg mb-4 text-neutral-800 dark:text-neutral-200">
                        Top Parties by Net Weight
                    </h3>
                    <Bar
                        data={barChartData}
                        options={{
                            responsive: true,
                            plugins: { legend: { position: 'top' }, tooltip: { enabled: true } },
                            scales: { x: { title: { display: true, text: 'Party' } }, y: { title: { display: true, text: 'Total Net Weight (Kg)' } } },
                        }}
                    />
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                        type="text"
                        placeholder="Filter by RST No. or Party Name"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 dark:text-white text-black focus:ring-neutral-500 dark:focus:ring-neutral-400"
                    />
                    <select
                        value={materialFilter}
                        onChange={(e) => setMaterialFilter(e.target.value)}
                        className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none dark:text-white text-black"
                    >
                        <option value="">All Materials</option>
                        {uniqueMaterials.map((material) => (
                            <option key={material} value={material}>
                                {material}
                            </option>
                        ))}
                    </select>
                    <div className="flex gap-3">
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                            className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none dark:text-white text-black"
                        />
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                            className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none dark:text-white text-black"
                        />
                    </div>
                    <Link
                        href="/"
                        className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white rounded-md transition-colors flex items-center gap-2"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        Create New Slip
                    </Link>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={sortField}
                        onChange={(e) => handleSort(e.target.value as keyof SlipData)}
                        className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none dark:text-white text-black"
                    >
                        <option value="createdAt">Date Created</option>
                        <option value="rstNo">RST Number</option>
                        <option value="partyName">Party Name</option>
                        <option value="netWt">Net Weight</option>
                    </select>
                    <button
                        onClick={() => handleSort(sortField)}
                        className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-md transition-colors border border-neutral-200 dark:border-neutral-700"
                    >
                        {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                    </button>
                    <button
                        onClick={exportToCSV}
                        className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white rounded-md transition-colors"
                    >
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                            <th className="p-3 border border-neutral-200 dark:border-neutral-700">RST No.</th>
                            <th className="p-3 border border-neutral-200 dark:border-neutral-700">Party Name</th>
                            <th className="p-3 border border-neutral-200 dark:border-neutral-700">Vehicle</th>
                            <th className="p-3 border border-neutral-200 dark:border-neutral-700">Material</th>
                            <th className="p-3 border border-neutral-200 dark:border-neutral-700">Net Weight</th>
                            <th className="p-3 border border-neutral-200 dark:border-neutral-700">Date Gross</th>
                            <th className="p-3 border border-neutral-200 dark:border-neutral-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="text-center p-4 text-neutral-500 dark:text-neutral-400">
                                    Loading...
                                </td>
                            </tr>
                        ) : filteredSlips.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center p-4 text-neutral-500 dark:text-neutral-400">
                                    No slips found.
                                </td>
                            </tr>
                        ) : (
                            filteredSlips.map((slip) => (
                                <tr key={slip.id} className="border-b border-neutral-200 dark:border-neutral-700">
                                    <td className="p-3 text-neutral-800 dark:text-neutral-200">{slip.rstNo}</td>
                                    <td className="p-3 text-neutral-800 dark:text-neutral-200">{slip.partyName}</td>
                                    <td className="p-3 text-neutral-800 dark:text-neutral-200">{slip.vehicle}</td>
                                    <td className="p-3 text-neutral-800 dark:text-neutral-200">{slip.material}</td>
                                    <td className="p-3 text-neutral-800 dark:text-neutral-200">{slip.netWt}</td>
                                    <td className="p-3 text-neutral-800 dark:text-neutral-200">{slip.dateGross}</td>
                                    <td className="p-3 flex gap-2">
                                        <button
                                            onClick={() => openSlipDetails(slip)}
                                            className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-md transition-colors"
                                        >
                                            View
                                        </button>
                                        <PDFDownloadLink
                                            document={<SlipPDF {...slip} />}
                                            fileName={`weighbridge_slip_${slip.rstNo}.pdf`}
                                            className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white rounded-md transition-colors"
                                        >
                                            Download
                                        </PDFDownloadLink>
                                        <button
                                            onClick={() => handleDelete(slip.id)}
                                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal for Slip Details */}
            {selectedSlip && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg max-w-lg w-full border border-neutral-200 dark:border-neutral-800">
                        <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">
                            Weighbridge Slip Details
                        </h2>
                        <div className="space-y-3 text-neutral-800 dark:text-neutral-200">
                            <p><strong>RST Number:</strong> {selectedSlip.rstNo}</p>
                            <p><strong>Party Name:</strong> {selectedSlip.partyName}</p>
                            <p><strong>Phone Number:</strong> {selectedSlip.phoneNo}</p>
                            <p><strong>Vehicle:</strong> {selectedSlip.vehicle}</p>
                            <p><strong>Material:</strong> {selectedSlip.material}</p>
                            <p><strong>Address:</strong> {selectedSlip.address}</p>
                            <p><strong>Gross Weight:</strong> {selectedSlip.grossWt}</p>
                            <p><strong>Tare Weight:</strong> {selectedSlip.tareWt}</p>
                            <p><strong>Net Weight:</strong> {selectedSlip.netWt}</p>
                            <p><strong>Net Weight (Words):</strong> {selectedSlip.netWtWords}</p>
                            <p><strong>Gross Date & Time:</strong> {selectedSlip.dateGross} {selectedSlip.timeGross}</p>
                            <p><strong>Tare Date & Time:</strong> {selectedSlip.dateTare} {selectedSlip.timeTare}</p>
                            <p><strong>Created At:</strong> {new Date(selectedSlip.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={closeSlipDetails}
                                className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-md transition-colors"
                            >
                                Close
                            </button>
                            <PDFDownloadLink
                                document={<SlipPDF {...selectedSlip} />}
                                fileName={`weighbridge_slip_${selectedSlip.rstNo}.pdf`}
                                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white rounded-md transition-colors"
                            >
                                Download PDF
                            </PDFDownloadLink>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WeighbridgeDashboard;
