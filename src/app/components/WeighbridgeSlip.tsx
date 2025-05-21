'use client';
import React, { useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import SlipPDF, { SlipData } from './SlipPDF';
import { numberToWords } from '../utils/numberToWords';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../libs/firebase';

const WeighbridgeSlip: React.FC = () => {
  const getCurrentDateTime = (): { date: string; time: string } => {
    const now = new Date();
    const date = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const time = `${hours}:${minutes}`; // 24-hour format (e.g., 14:30)
    return { date, time };
  };

  // Initialize formData with data from localStorage or default values
  const getInitialFormData = (): SlipData => {
    const savedDraft = localStorage.getItem('weighbridgeDraft');
    const defaultDateTime = getCurrentDateTime();
    if (savedDraft) {
      try {
        return JSON.parse(savedDraft);
      } catch (error) {
        console.error('Failed to parse saved draft:', error);
      }
    }
    return {
      rstNo: '',
      partyName: '',
      phoneNo: '',
      vehicle: '',
      material: '',
      address: '',
      grossWt: '',
      tareWt: '',
      netWt: '',
      dateGross: defaultDateTime.date,
      timeGross: defaultDateTime.time,
      dateTare: defaultDateTime.date,
      timeTare: defaultDateTime.time,
      netWtWords: '',
    };
  };

  const [formData, setFormData] = useState<SlipData>({
    rstNo: '',
    partyName: '',
    phoneNo: '',
    vehicle: '',
    material: '',
    address: '',
    grossWt: '',
    tareWt: '',
    netWt: '',
    dateGross: getCurrentDateTime().date,
    timeGross: getCurrentDateTime().time,
    dateTare: getCurrentDateTime().date,
    timeTare: getCurrentDateTime().time,
    netWtWords: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | null }>({
    message: '',
    type: null,
  });

  useEffect(() => {
    setFormData(getInitialFormData())
  }, [])
  // Calculate net weight whenever gross or tare weight changes
  useEffect(() => {
    if (formData.grossWt && formData.tareWt) {
      const gross = parseInt(formData.grossWt.replace(/\D/g, ''), 10);
      const tare = parseInt(formData.tareWt.replace(/\D/g, ''), 10);
      if (!isNaN(gross) && !isNaN(tare) && gross >= tare) {
        const net = gross - tare;
        setFormData((prev) => {
          const updatedData = {
            ...prev,
            netWt: `${net}Kg.`,
            netWtWords: numberToWords(net),
          };
          // Save updated data to localStorage
          localStorage.setItem('weighbridgeDraft', JSON.stringify(updatedData));
          return updatedData;
        });
      }
    }
  }, [formData.grossWt, formData.tareWt]);

  // Handle input changes and save to localStorage
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const processedValue = value.toUpperCase();

    setFormData((prev) => {
      const updatedData = {
        ...prev,
        [name]: processedValue,
      };
      // Save to localStorage on every input change
      try {
        localStorage.setItem('weighbridgeDraft', JSON.stringify(updatedData));
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }
      return updatedData;
    });
  };

  const saveToFirestore = async () => {
    try {
      await addDoc(collection(db, 'weighbridgeSlips'), {
        ...formData,
        createdAt: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error('Error saving to Firestore:', error);
      return false;
    }
  };

  const updateDateTime = (type: 'gross' | 'tare') => {
    const { date, time } = getCurrentDateTime();
    setFormData((prev) => {
      const updatedData = {
        ...prev,
        ...(type === 'gross' ? { dateGross: date, timeGross: time } : { dateTare: date, timeTare: time }),
      };
      // Save to localStorage
      localStorage.setItem('weighbridgeDraft', JSON.stringify(updatedData));
      return updatedData;
    });
  };

  // Save draft explicitly (optional, since we're saving on every change)
  const saveDraft = () => {
    setLoading(true);
    try {
      localStorage.setItem('weighbridgeDraft', JSON.stringify(formData));
      setNotification({
        message: 'Draft saved successfully!',
        type: 'success',
      });
      setTimeout(() => setNotification({ message: '', type: null }), 3000);
    } catch (error) {
      console.error(error);
      setNotification({
        message: 'Failed to save draft.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load draft (optional, since we load on mount)
  const loadDraft = () => {
    setLoading(true);
    try {
      const savedDraft = localStorage.getItem('weighbridgeDraft');
      if (savedDraft) {
        setFormData(JSON.parse(savedDraft));
        setNotification({
          message: 'Draft loaded successfully!',
          type: 'success',
        });
      } else {
        setNotification({
          message: 'No draft found.',
          type: 'error',
        });
      }
    } catch (error) {
      console.error(error);
      setNotification({
        message: 'Failed to load draft.',
        type: 'error',
      });
    } finally {
      setLoading(false);
      setTimeout(() => setNotification({ message: '', type: null }), 3000);
    }
  };

  const isFormValid = (): boolean => {
    return Boolean(
      formData.rstNo &&
      formData.partyName &&
      formData.vehicle &&
      formData.material &&
      formData.address &&
      formData.grossWt &&
      formData.tareWt &&
      formData.netWt
    );
  };

  const clearForm = (): void => {
    const { date, time } = getCurrentDateTime();
    const clearedData = {
      rstNo: '',
      partyName: '',
      phoneNo: '',
      vehicle: '',
      material: '',
      address: '',
      grossWt: '',
      tareWt: '',
      netWt: '',
      dateGross: date,
      timeGross: time,
      dateTare: date,
      timeTare: time,
      netWtWords: '',
    };
    setFormData(clearedData);
    // Clear localStorage
    localStorage.setItem('weighbridgeDraft', JSON.stringify(clearedData));
    setNotification({
      message: 'Form cleared!',
      type: 'success',
    });
    setTimeout(() => setNotification({ message: '', type: null }), 3000);
  };

  const handleDownloadPDF = async () => {
    if (isFormValid()) {
      const success = await saveToFirestore();
      setNotification({
        message: success ? 'Slip saved to Firestore!' : 'Failed to save to Firestore.',
        type: success ? 'success' : 'error',
      });
      setTimeout(() => setNotification({ message: '', type: null }), 3000);
    }
  };
  
  return (
    <div className="mx-auto p-8 dark:bg-neutral-900 shadow-lg border border-neutral-100 dark:border-neutral-800">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-neutral-800 dark:text-white mb-2">
          Weighbridge Slip Generator
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          Create and download professional weighbridge slips in seconds
        </p>
      </div>

      {/* Notification */}
      {notification.type && (
        <div
          className={`mb-6 p-4 rounded-lg text-sm font-medium ${notification.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30'
            : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30'
            }`}
        >
          {notification.message}
        </div>
      )}

      {/* Draft Buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={saveDraft}
          disabled={loading}
          className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white rounded-md transition-colors flex items-center gap-2 disabled:opacity-70"
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
          Save Draft
        </button>
        <button
          onClick={loadDraft}
          disabled={loading}
          className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-md transition-colors flex items-center gap-2 border border-neutral-200 dark:border-neutral-700 disabled:opacity-70"
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
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Load Draft
        </button>
        <button
          onClick={clearForm}
          disabled={loading}
          className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-md transition-colors flex items-center gap-2 border border-neutral-200 dark:border-neutral-700 disabled:opacity-70"
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
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          </svg>
          Clear Form
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">RST Number</label>
            <input
              type="text"
              name="rstNo"
              value={formData.rstNo}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 dark:text-white text-black focus:ring-neutral-500 dark:focus:ring-neutral-400 transition-colors"
              placeholder="Enter RST number"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Party Name</label>
            <input
              type="text"
              name="partyName"
              value={formData.partyName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 dark:text-white text-black focus:ring-neutral-500 dark:focus:ring-neutral-400 transition-colors"
              placeholder="Enter party name"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Phone Number</label>
            <input
              type="text"
              name="phoneNo"
              value={formData.phoneNo}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 dark:text-white text-black focus:ring-neutral-500 dark:focus:ring-neutral-400 transition-colors"
              placeholder="Enter phone number"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Gross Weight (Kg)</label>
              <button
                className="text-xs bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-3 py-1.5 rounded-md transition-colors border border-neutral-200 dark:border-neutral-700 flex items-center gap-1"
                onClick={() => updateDateTime('gross')}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Update Time
              </button>
            </div>
            <input
              type="text"
              name="grossWt"
              value={formData.grossWt}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 dark:text-white text-black focus:ring-neutral-500 dark:focus:ring-neutral-400 transition-colors"
              placeholder="Enter gross weight"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Tare Weight (Kg)</label>
              <button
                className="text-xs bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-3 py-1.5 rounded-md transition-colors border border-neutral-200 dark:border-neutral-700 flex items-center gap-1"
                onClick={() => updateDateTime('tare')}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Update Time
              </button>
            </div>
            <input
              type="text"
              name="tareWt"
              value={formData.tareWt}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 dark:text-white text-black focus:ring-neutral-500 dark:focus:ring-neutral-400 transition-colors"
              placeholder="Enter tare weight"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Vehicle Number</label>
            <input
              type="text"
              name="vehicle"
              value={formData.vehicle}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 dark:text-white text-black focus:ring-neutral-500 dark:focus:ring-neutral-400 transition-colors"
              placeholder="Enter vehicle number"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Material</label>
            <input
              type="text"
              name="material"
              value={formData.material}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 dark:text-white text-black focus:ring-neutral-500 dark:focus:ring-neutral-400 transition-colors"
              placeholder="Enter material"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 dark:text-white text-black focus:ring-neutral-500 dark:focus:ring-neutral-400 transition-colors"
              placeholder="Enter address"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Gross Date & Time</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                name="dateGross"
                value={formData.dateGross}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 dark:text-white text-black focus:ring-neutral-500 dark:focus:ring-neutral-400 transition-colors"
                placeholder="DD/MM/YYYY"
              />
              <input
                type="text"
                name="timeGross"
                value={formData.timeGross}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 dark:text-white text-black focus:ring-neutral-500 dark:focus:ring-neutral-400 transition-colors"
                placeholder="HH:MM"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Tare Date & Time</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                name="dateTare"
                value={formData.dateTare}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 dark:text-white text-black focus:ring-neutral-500 dark:focus:ring-neutral-400 transition-colors"
                placeholder="DD/MM/YYYY"
              />
              <input
                type="text"
                name="timeTare"
                value={formData.timeTare}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 dark:text-white text-black focus:ring-neutral-500 dark:focus:ring-neutral-400 transition-colors"
                placeholder="HH:MM"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Calculated values display */}
      <div className="mt-8 p-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-100 dark:border-neutral-800">
        <h3 className="font-medium text-lg mb-4 text-neutral-800 dark:text-neutral-200">Calculated Results</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Net Weight</p>
            <p className="text-xl font-medium text-neutral-800 dark:text-neutral-200">{formData.netWt || '—'}</p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">In Words</p>
            <p className="text-lg font-medium text-neutral-800 dark:text-neutral-200">{formData.netWtWords || '—'}</p>
          </div>
        </div>
      </div>

      {/* PDF Download Button */}
      <div className="mt-10 flex justify-center">
        {isFormValid() ? (
          <PDFDownloadLink
            document={<SlipPDF {...formData} />}
            fileName="weighbridge_slip.pdf"
            className="px-6 py-3 bg-neutral-900 hover:bg-black dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white font-medium rounded-lg transition-colors shadow-md flex items-center gap-2"
            onClick={handleDownloadPDF}
          >
            {({ loading: pdfLoading }) => (
              <>
                {pdfLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <span>Download Weighbridge Slip</span>
                  </>
                )}
              </>
            )}
          </PDFDownloadLink>
        ) : (
          <div className="relative">
            <button
              disabled
              className="px-6 py-3 bg-neutral-300 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-500 font-medium rounded-lg cursor-not-allowed flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Download Weighbridge Slip</span>
            </button>
            <div className="absolute -bottom-8 w-full text-center text-sm text-red-500 dark:text-red-400">
              Please complete all required fields
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeighbridgeSlip;
