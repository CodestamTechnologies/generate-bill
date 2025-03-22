"use client"
import React, { useState, useEffect } from 'react';
import {
  Document,
  Page,
  StyleSheet,
  Text,
  PDFDownloadLink,
  Font,
} from '@react-pdf/renderer';

// Register fonts
Font.register({
  family: 'CourierPrime',
  fonts: [
    {
      src: '/fonts/CourierPrime-Regular.ttf',
      fontWeight: 'normal',
    },
    {
      src: '/fonts/CourierPrime-Bold.ttf',
      fontWeight: 'bold',
    },
  ],
});

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
    fontFamily: 'CourierPrime',
    lineHeight: 1.5,
  },
});

// Interface for slip data
interface SlipData {
  rstNo: string;
  partyName: string;
  phoneNo: string;
  vehicle: string;
  material: string;
  address: string;
  grossWt: string;
  tareWt: string;
  netWt: string;
  dateGross: string;
  timeGross: string;
  dateTare: string;
  timeTare: string;
  netWtWords: string;
}

// Convert number to words
const numberToWords = (num: number): string => {
  const digits = num.toString().split('');
  return digits.map(digit => {
    switch (digit) {
      case '0': return 'ZERO';
      case '1': return 'ONE';
      case '2': return 'TWO';
      case '3': return 'THREE';
      case '4': return 'FOUR';
      case '5': return 'FIVE';
      case '6': return 'SIX';
      case '7': return 'SEVEN';
      case '8': return 'EIGHT';
      case '9': return 'NINE';
      default: return '';
    }
  }).join(' ') + ' Kg';
};

// PDF Document Component
const SlipPDF: React.FC<SlipData> = ({
  rstNo,
  partyName,
  phoneNo,
  vehicle,
  material,
  address,
  grossWt,
  tareWt,
  netWt,
  dateGross,
  timeGross,
  dateTare,
  timeTare,
  netWtWords,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text>
        <Text style={{ fontSize: 21, fontWeight: '600', textAlign: 'center' }}>          WEIGHBRIDGESLIP{"\n\n"}</Text>
        <Text style={{ fontSize: 20, fontWeight: '500', textAlign: 'center' }}>        FULLY COMPUTERISED JHARKHAND{"\n"}</Text>
        {"\n\n\n"}

        <Text style={{ display: 'flex', flexDirection: 'row' }}>
          <Text style={{ width: '40%' }}>
            RST. NO     : {rstNo}{"\n"}
            PARTY NAME  : {partyName}{"\n"}
            PHONE NO   : {phoneNo}{"\n"}
          </Text>
          <Text style={{ width: '50%' }}>
            VEHICLE    : {vehicle}{"\n"}
            MATERIAL   : {material}{"\n"}
            ADDRESS    : {address}{"\n"}
          </Text>
        </Text>
        ----------------------------------------------------------------------{"\n"}
        <Text style={{ display: 'flex', flexDirection: 'row' }}>
          <Text style={{ width: '50%' }}>
            GROSS Wt.  : {grossWt}Kg.   Date : {dateGross}   Time : {timeGross}{"\n"}
            TARE Wt.   : {tareWt }Kg.   Date : {dateTare }   Time : {timeTare}{"\n"}
            NET Wt.    : {netWt}  {netWtWords}{"\n"}
          </Text>
        </Text>
        ----------------------------------------------------------------------{"\n"}
        OPERATOR&apos;S SIGNATURE:{"\n"}
        ----------------------------------------------------------------------{"\n"}
        {"\n"}
        <Text style={{ textAlign: 'right' }}>
          Contact for Repair sattel no.{"\n"}
          WELCOME
        </Text>
      </Text>
    </Page>
  </Document>
);

// Main component with form
const WeighbridgeSlip: React.FC = () => {
  const getCurrentDateTime = () => {
    const now = new Date();
    const date = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const time = `${formattedHours}:${minutes.toString().padStart(2, '0')}${ampm}`;
    
    return { date, time };
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

  // Calculate net weight whenever gross or tare weight changes
  useEffect(() => {
    if (formData.grossWt && formData.tareWt) {
      const gross = parseInt(formData.grossWt.replace(/\D/g, ''), 10);
      const tare = parseInt(formData.tareWt.replace(/\D/g, ''), 10);
      
      if (!isNaN(gross) && !isNaN(tare) && gross >= tare) {
        const net = gross - tare;
        setFormData(prev => ({
          ...prev,
          netWt: `${net}Kg.`,
          netWtWords: numberToWords(net),
        }));
      }
    }
  }, [formData.grossWt, formData.tareWt]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const processedValue = value.toUpperCase();
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  const updateDateTime = (type: 'gross' | 'tare') => {
    const { date, time } = getCurrentDateTime();
    if (type === 'gross') {
      setFormData(prev => ({
        ...prev,
        dateGross: date,
        timeGross: time,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        dateTare: date,
        timeTare: time,
      }));
    }
  };

  const isFormValid = () => {
    return (
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

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-center mb-8 text-blue-700">Weighbridge Slip Generator</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">RST Number</label>
            <input
              type="text"
              name="rstNo"
              value={formData.rstNo}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ENTER RST NUMBER"
            />
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Party Name</label>
            <input
              type="text"
              name="partyName"
              value={formData.partyName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ENTER PARTY NAME"
            />
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="text"
              name="phoneNo"
              value={formData.phoneNo}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ENTER PHONE NUMBER"
            />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="block text-sm font-medium text-gray-700">Gross Weight (Kg)</label>
              <button 
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
                onClick={() => updateDateTime('gross')}
              >
                Update Time
              </button>
            </div>
            <input
              type="text"
              name="grossWt"
              value={formData.grossWt}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ENTER GROSS WEIGHT"
            />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="block text-sm font-medium text-gray-700">Tare Weight (Kg)</label>
              <button 
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
                onClick={() => updateDateTime('tare')}
              >
                Update Time
              </button>
            </div>
            <input
              type="text"
              name="tareWt"
              value={formData.tareWt}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ENTER TARE WEIGHT"
            />
          </div>
        </div>
        
        {/* Right Column */}
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Vehicle Number</label>
            <input
              type="text"
              name="vehicle"
              value={formData.vehicle}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ENTER VEHICLE NUMBER"
            />
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Material</label>
            <input
              type="text"
              name="material"
              value={formData.material}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ENTER MATERIAL"
            />
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ENTER ADDRESS"
            />
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Gross Date & Time</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                name="dateGross"
                value={formData.dateGross}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="DD/MM/YYYY"
              />
              <input
                type="text"
                name="timeGross"
                value={formData.timeGross}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="HH:MMAM/PM"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Tare Date & Time</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                name="dateTare"
                value={formData.dateTare}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="DD/MM/YYYY"
              />
              <input
                type="text"
                name="timeTare"
                value={formData.timeTare}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="HH:MMAM/PM"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Calculated values display */}
      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="font-semibold text-lg mb-2">Calculated Results:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-700"><span className="font-medium">Net Weight:</span> {formData.netWt || "Waiting for weights..."}</p>
          </div>
          <div>
            <p className="text-sm text-gray-700"><span className="font-medium">In Words:</span> {formData.netWtWords || "Waiting for weights..."}</p>
          </div>
        </div>
      </div>
      
      {/* PDF Download Button */}
      <div className="mt-8 flex justify-center">
        {isFormValid() ? (
          <PDFDownloadLink
            document={<SlipPDF {...formData} />}
            fileName="weighbridge_slip.pdf"
            className={`px-6 py-3 text-white font-medium rounded-md transition-colors shadow-md ${
              isFormValid() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {({ loading }) =>
              loading ? 'Generating PDF...' : 'Download Weighbridge Slip'
            }
          </PDFDownloadLink>
        ) : (
          <button 
            disabled 
            className="px-6 py-3 bg-gray-400 text-white font-medium rounded-md cursor-not-allowed"
          >
            Please Complete All Required Fields
          </button>
        )}
      </div>
    </div>
  );
};

export default WeighbridgeSlip;
