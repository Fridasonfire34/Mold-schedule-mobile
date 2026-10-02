import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import ScanFrame, { ScannedCode } from './ScanFrame';
import LastScanCard from './LastScanCard';
import DefectForm from './DefectForm';
import InspectionDoneCard from './InspectionDoneCard';
import LabelPreview, { initialsOf } from './LabelPreview';
import MoldPicker, { PickedMold } from './MoldPicker';
import Icon from 'react-native-vector-icons/Ionicons';
import { BigButton, GOOD_COLOR, Notice } from './ui';
import { Operator } from '../api/auth';
import {
  InspectResult,
  LookupResult,
  PrintLabelData,
  PrintLabelResult,
  Verdict,
  inspectPanel,
  lookupPanel,
  printLabel,
} from '../api/panels';
import { PanelLabel, parsePanelLabel } from '../labels';
import { clearSession } from '../session';
import { useSignOut } from '../useSignOut';
import { colors } from '../theme';

interface Props {
  operator: Operator;
  // Cleaning inspects the panel (Good / Has a defect). The accepting process
  // only looks it up for now.
  inspect?: boolean;
}

// One question at a time: first confirm the mold, only then the verdict —
// so nobody jumps to Good without checking where the panel came out of.
type Step = 'mold' | 'result' | 'defect' | 'done';

// Body of a process screen: the camera until a label is read; then the
// panel it matches, the mold it actually came out of (confirmed first), the
// operator's verdict (Good / Has a defect → pick the defects), and the saved
// result — until the operator scans the next one.
const PanelScanner: React.FC<Props> = ({ operator, inspect = false }) => {
  const [scan, setScan] = useState<ScannedCode | null>(null);
  const [label, setLabel] = useState<PanelLabel | null>(null);
  // undefined while the lookup is running (or for codes that aren't labels).
  const [lookup, setLookup] = useState<LookupResult | undefined>(undefined);
  // "Completed in" — starts on the mold the unit was assigned to.
  const [completedMold, setCompletedMold] = useState<PickedMold | null>(null);
  const [step, setStep] = useState<Step>('mold');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<InspectResult | null>(null);
  const signOut = useSignOut();
  // The label, once saved: printing stays on this screen (to reprint);
  // Done leaves it.
  const [printing, setPrinting] = useState(false);
  const [printed, setPrinted] = useState<PrintLabelResult | null>(null);

  const print = async (data: PrintLabelData) => {
    setPrinting(true);
    setPrinted(await printLabel(data));
    setPrinting(false);
  };

  const handleScan = async (code: ScannedCode) => {
    const parsed = parsePanelLabel(code.value);
    setScan(code);
    setLabel(parsed);
    setLookup(undefined);
    setCompletedMold(null);
    setStep('mold');
    setSaved(null);
    if (parsed) {
      const found = await lookupPanel(parsed);
      setLookup(found);
      if (found.status === 'found') {
        setCompletedMold({ code: found.panel.mold, name: found.panel.moldName });
      }
    }
  };

  const scanNext = () => {
    setScan(null);
    setLabel(null);
    setLookup(undefined);
    setCompletedMold(null);
    setStep('mold');
    setSaved(null);
  };

  const submit = async (verdict: Verdict) => {
    if (!label || !completedMold) return;
    setSaving(true);
    const result = await inspectPanel(label, verdict, operator.id, completedMold.code);
    setSaving(false);
    setSaved(result);
    if (result.status === 'saved') {
      // Every panel is signed by whoever enters their code next, so the
      // session ends right here (even if the app is closed before Done).
      await clearSession();
      setStep('done');
    }
  };

  if (!scan) {
    return <ScanFrame hint="Point at the panel label" onScan={handleScan} />;
  }

  const canInspect = inspect && lookup?.status === 'found';
  const saveError = saved?.status === 'error' ? saved.message : null;

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {step === 'done' && saved?.status === 'saved' && label ? (
        // The label to print comes first — it's what the cleaner finished
        // with; the saved result's details follow.
        <>
          <LabelPreview
            jobNumber={label.jobNumber}
            partNumber={label.panel}
            initials={initialsOf(operator.name)}
            good={saved.result === 'GOOD'}
            defect={saved.defect}
          />
          <InspectionDoneCard
            result={saved.result}
            defect={saved.defect}
            photoSaved={saved.photoSaved}
            jobNumber={label.jobNumber}
            panel={label.panel}
            moldName={saved.moldName}
            assignedUnits={saved.assignedUnits}
            completeUnits={saved.completeUnits}
          />
        </>
      ) : (
        <LastScanCard scan={scan} lookup={lookup} />
      )}

      {saveError && <Notice icon="alert-circle-outline" text={saveError} />}

      {step !== 'done' && canInspect && lookup?.status === 'found' && completedMold && (
        <MoldPicker
          value={completedMold}
          assignedCode={lookup.panel.mold}
          panelIdentifier={lookup.panel.panelIdentifier}
          onChange={setCompletedMold}
          confirmed={step !== 'mold'}
          onEdit={() => {
            setSaved(null);
            setStep('mold');
          }}
          disabled={saving}
        />
      )}

      {step === 'mold' && canInspect && (
        <BigButton
          label="Confirm mold"
          icon="checkmark"
          variant="primary"
          onPress={() => setStep('result')}
        />
      )}

      {step === 'result' && canInspect && (
        <View style={styles.actions}>
          <BigButton
            label="Good"
            icon="checkmark-circle"
            variant="good"
            loading={saving}
            onPress={() => submit({ result: 'GOOD' })}
          />
          <BigButton
            label="Has a defect"
            icon="alert-circle"
            variant="defect"
            disabled={saving}
            onPress={() => setStep('defect')}
          />
        </View>
      )}

      {step === 'defect' && (
        <DefectForm
          saving={saving}
          onSubmit={(defectTypeIds, note, photoBase64) =>
            submit({
              result: 'DEFECT',
              defectTypeIds,
              note: note || undefined,
              photoBase64: photoBase64 ?? undefined,
            })
          }
          onCancel={() => {
            setSaved(null);
            setStep('result');
          }}
        />
      )}

      {step === 'done' && saved?.status === 'saved' && label && (
        <View style={styles.actions}>
          {printed?.status === 'printed' && (
            <View style={styles.printedNote}>
              <Icon name="checkmark-circle" size={20} color={GOOD_COLOR} />
              <Text style={styles.printedText}>Label sent to the printer</Text>
            </View>
          )}
          {printed?.status === 'error' && <Notice icon="print-outline" text={printed.message} />}
          <BigButton
            label={printed?.status === 'printed' ? 'Print again' : 'Print label'}
            icon="print-outline"
            variant={printed?.status === 'printed' ? 'outline' : 'primary'}
            loading={printing}
            onPress={() =>
              print({
                jobNumber: label.jobNumber,
                partNumber: label.panel,
                initials: initialsOf(operator.name),
                good: saved.result === 'GOOD',
                defect: saved.defect,
              })
            }
          />
        </View>
      )}

      {step === 'done' && (
        <View style={styles.actions}>
          <BigButton
            label="Done"
            icon="log-out-outline"
            variant={printed?.status === 'printed' ? 'primary' : 'outline'}
            disabled={printing}
            onPress={signOut}
          />
          <Text style={styles.signOutNote}>
            Tap Done when you're finished. The next panel needs your code again.
          </Text>
        </View>
      )}

      {step !== 'defect' && step !== 'done' && (
        <BigButton
          label="Scan next panel"
          icon="scan-outline"
          variant={canInspect && (step === 'mold' || step === 'result') ? 'outline' : 'primary'}
          disabled={saving}
          onPress={scanNext}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    gap: 14,
    paddingBottom: 12,
  },
  actions: {
    gap: 12,
  },
  printedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  printedText: {
    fontSize: 16,
    fontWeight: '700',
    color: GOOD_COLOR,
  },
  signOutNote: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
});

export default PanelScanner;
