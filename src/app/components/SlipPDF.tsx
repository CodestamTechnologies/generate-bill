import React from 'react';
import {
  Document,
  Page,
  StyleSheet,
  Text,
  Font,
  View,
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
export interface SlipData {
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
    <Page size="A4" style={styles.page} wrap>
      <Text>
        <Text style={{ fontSize: 21, fontWeight: '600', textAlign: 'center' }}>
          WEIGHBRIDGESLIP{"\n\n"}
        </Text>
        <Text style={{ fontSize: 20, fontWeight: '500', textAlign: 'center' }}>
          FULLY COMPUTERISED JHARKHAND{"\n"}
        </Text>
        {"\n\n\n"}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'column' }}>
          <Text>
            RST. NO    : {rstNo}{"\n"}
            PARTY NAME : {partyName}{"\n"}
            PHONE NO   : {phoneNo}{"\n"}
          </Text>
        </View>
        <View style={{ flexDirection: 'column' }}>
          <Text>
            VEHICLE    : {vehicle}{"\n"}
            MATERIAL   : {material}{"\n"}
            ADDRESS    : {address}{"\n"}
          </Text>
        </View>
      </View>
      <Text>----------------------------------------------------------------------------{"\n"}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'column' }}>
          <Text>
            GROSS Wt.  : {grossWt}Kg.{"\n"}
            TARE Wt.   : {tareWt}Kg.{"\n"}
          </Text>
        </View>
        <View style={{ flexDirection: 'column' }}>
          <Text>
            Date : {dateGross}{"\n"}
            Date : {dateTare}{"\n"}
          </Text>
        </View>
        <View style={{ flexDirection: 'column' }}>
          <Text>
            Time : {timeGross}{"\n"}
            Time : {timeTare}{"\n"}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'column' }}>
          <Text>
            NET Wt.    : {netWt}{"\n"}
          </Text>
        </View>
        <View style={{ flexDirection: 'column' }}>
          <Text>
            {netWtWords}{"\n"}
          </Text>
        </View>
        <View style={{ flexDirection: 'column' }}>
          <Text>
            {"\n"}
          </Text>
        </View>
        <View style={{ flexDirection: 'column' }}>
          <Text>
            {"\n"}
          </Text>
        </View>
      </View>
      <Text>----------------------------------------------------------------------------{"\n"}</Text>
      <Text>OPERATOR&apos;S SIGNATURE:{"\n"}</Text>
      <Text>----------------------------------------------------------------------------{"\n"}</Text>
      {"\n"}
      <Text style={{ textAlign: 'right' }}>
        Contact for Repair sattel no.{"\n"}
        WELCOME
      </Text>
    </Page>
  </Document>
);

export default SlipPDF;
