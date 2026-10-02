import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import ProcessLayout from '../components/ProcessLayout';
import PanelScanner from '../components/PanelScanner';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Accept'>;

// The process after Cleaning: accepts panels from any mold, but only ones
// Cleaning already marked complete (mockup D1–D5). For now a scan only shows
// what the label contains; accepting the panel is next.
const AcceptScreen: React.FC<Props> = ({ route }) => (
  <ProcessLayout
    title="Accept Panels"
    operator={route.params.operator}
  >
    <PanelScanner operator={route.params.operator} />
  </ProcessLayout>
);

export default AcceptScreen;
