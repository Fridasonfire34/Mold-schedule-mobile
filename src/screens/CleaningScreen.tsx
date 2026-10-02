import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import ProcessLayout from '../components/ProcessLayout';
import PanelScanner from '../components/PanelScanner';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Cleaning'>;

// Cleaning: scan a panel, then mark it good (completes it) or pick its
// defect (it stays pending to be re-poured).
const CleaningScreen: React.FC<Props> = ({ route }) => (
  <ProcessLayout
    title="Cleaning"
    operator={route.params.operator}
  >
    <PanelScanner operator={route.params.operator} inspect />
  </ProcessLayout>
);

export default CleaningScreen;
