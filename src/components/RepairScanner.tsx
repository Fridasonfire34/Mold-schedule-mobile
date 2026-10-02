import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import ScanFrame, { ScannedCode } from './ScanFrame';
import PanelInfo from './PanelInfo';
import { BigButton, Card, Divider, Notice, Row } from './ui';
import { Operator } from '../api/auth';
import DefectPicker from './DefectPicker';
import DefectPhotoCard from './DefectPhotoCard';
import UnitChooser from './UnitChooser';
import {
  DefectSelection,
  RepairDecision,
  RepairLookupResult,
  RepairSaveResult,
  RepairUnit,
  defectPhotoUrl,
  lookupRepair,
  saveRepairDecision,
} from '../api/repairs';
import { PanelLabel, parsePanelLabel } from '../labels';
import { colors } from '../theme';

interface Props {
  operator: Operator;
  // Mold users: they can only send a panel to reorder, not mark it repaired.
  reorderOnly?: boolean;
}

const DECISION_TEXT: Record<RepairDecision, { done: string; icon: string }> = {
  REPAIRED: { done: 'Repaired · marked complete', icon: 'checkmark-done-circle' },
  REORDER: { done: 'Sent to reorder', icon: 'refresh-circle' },
};

// Which piece it is (only when several units of the panel are in repair),
// then confirm (or change) its defect — which saves it.
type Step = 'unit' | 'defect';

const NO_DEFECT: DefectSelection = { defectTypeIds: [], note: '' };

// Body of the Repairs screen. A panel Cleaning marks defective goes straight
// to REPAIR; the Repairs operator scans it once they've fixed it — confirming
// or correcting its defect completes it — or once they've decided it can't be
// fixed (Reorder). Unlike Cleaning it stays signed in: after each one it
// offers the rest of that panel's units in repair, or scanning a new panel.
const RepairScanner: React.FC<Props> = ({ operator, reorderOnly = false }) => {
  const [scan, setScan] = useState<ScannedCode | null>(null);
  const [label, setLabel] = useState<PanelLabel | null>(null);
  // undefined while the lookup is running (or for codes that aren't labels).
  const [lookup, setLookup] = useState<RepairLookupResult | undefined>(undefined);
  const [step, setStep] = useState<Step>('defect');
  // The unit in repair being finished.
  const [unit, setUnit] = useState<RepairUnit | null>(null);
  const [defect, setDefect] = useState<DefectSelection>(NO_DEFECT);
  const [defectValid, setDefectValid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<RepairSaveResult | null>(null);
  const done = saved?.status === 'saved';
  // The same panel looked up again right after saving: its units still
  // DEFECTIVE ("Back to the list").
  const [afterSave, setAfterSave] = useState<RepairLookupResult | null>(null);
  const remaining = afterSave?.status === 'found' ? afterSave.units.length : 0;

  const reset = () => {
    setLookup(undefined);
    setStep('defect');
    setUnit(null);
    setDefect(NO_DEFECT);
    setDefectValid(false);
    setSaved(null);
    setAfterSave(null);
  };

  // Shows a lookup: straight to the defect when there's a single DEFECTIVE
  // unit, the list to pick from when there are more.
  const showLookup = (found: RepairLookupResult) => {
    if (found.status === 'found') {
      if (found.units.length === 1) pickUnit(found.units[0]);
      else setStep('unit');
    }
    setLookup(found);
  };

  // Starts the defect step from what Cleaning checked on that unit.
  const pickUnit = (picked: RepairUnit) => {
    setUnit(picked);
    setDefect({ defectTypeIds: picked.defectTypeIds, note: picked.defectNote ?? '' });
    setSaved(null);
    setStep('defect');
  };

  const handleScan = async (code: ScannedCode) => {
    const parsed = parsePanelLabel(code.value);
    setScan(code);
    setLabel(parsed);
    reset();
    if (parsed) showLookup(await lookupRepair(parsed));
  };

  const backToList = () => {
    if (!afterSave) return;
    const next = afterSave;
    reset();
    showLookup(next);
  };

  const scanNext = () => {
    setScan(null);
    setLabel(null);
    reset();
  };

  const save = async (decision: RepairDecision) => {
    if (!unit) return;
    setSaving(true);
    const result = await saveRepairDecision(unit.idOk, decision, operator.id, {
      defectTypeIds: defect.defectTypeIds,
      note: defect.note.trim(),
    });
    if (result.status === 'saved' && label) setAfterSave(await lookupRepair(label));
    setSaving(false);
    setSaved(result);
  };

  if (!scan) {
    return <ScanFrame hint="Point at the defective panel's label" onScan={handleScan} />;
  }

  const renderLookup = () => {
    if (!label) return null;
    if (!lookup) {
      return (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.navy} />
          <Text style={styles.loadingText}>Looking up the panel…</Text>
        </View>
      );
    }
    switch (lookup.status) {
      case 'found': {
        // The defect itself is confirmed in the Defect card below.
        return <Row label="In repair" value={`${lookup.defectUnits} of ${lookup.assignedUnits}`} />;
      }
      case 'not_found':
        return (
          <Notice
            icon="help-circle-outline"
            text="This panel isn't in Mold Schedule. Check the job number on the label."
          />
        );
      case 'not_assigned':
        return <Notice icon="alert-circle-outline" text="This panel isn't assigned to a mold yet." />;
      // Repairs only works on panels Cleaning marked defective.
      case 'none_pending':
        return (
          <Notice
            icon="alert-circle-outline"
            text={
              lookup.reorderUnits > 0
                ? `No piece of this panel is in repair (${lookup.reorderUnits} sent to reorder). If this one has a defect, please ask the cleaner to mark it first.`
                : 'This panel is not marked as defective. Please ask the cleaner to mark its defect first.'
            }
          />
        );
      case 'error':
        return <Notice icon="cloud-offline-outline" text={lookup.message} />;
    }
  };

  // Same table as Cleaning's scan result, whether or not it can be classified
  // (before a unit is picked, the first one: same panel, same measures).
  const lookupPanel =
    unit ??
    (lookup?.status === 'found' ? lookup.units[0] : lookup?.status === 'none_pending' ? lookup.panel : null);
  const decisionText = done ? DECISION_TEXT[saved.decision] : null;
  const units = lookup?.status === 'found' ? lookup.units : [];
  const canDecide = !!unit && !done && step !== 'unit';

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Card>
        {decisionText ? (
          <View style={styles.top}>
            <View style={[styles.iconCircle, styles.iconDone]}>
              <Icon name={decisionText.icon} size={30} color={colors.navy} />
            </View>
            <View style={styles.texts}>
              <Text style={styles.doneTitle}>{decisionText.done}</Text>
              <Text style={styles.small}>Saved</Text>
            </View>
          </View>
        ) : (
          <View style={styles.top}>
            <View style={[styles.iconCircle, !label && styles.iconWarn]}>
              <Icon
                name={label ? 'barcode-outline' : 'alert-circle-outline'}
                size={24}
                color={label ? colors.navy : colors.danger}
              />
            </View>
            <View style={styles.texts}>
              <Text style={styles.small}>Label read</Text>
              <Text style={styles.raw} selectable>
                {scan.value}
              </Text>
            </View>
          </View>
        )}

        <Divider />

        {label ? (
          <>
            <PanelInfo
              jobNumber={label.jobNumber}
              panel={label.panel}
              hgt={lookupPanel?.hgt}
              width={lookupPanel?.width}
              moldName={lookupPanel?.moldName}
            />
            <Divider />
            {renderLookup()}
          </>
        ) : (
          <Text style={styles.warn}>This is not a panel label. Scan the code on the panel's label.</Text>
        )}
      </Card>

      {saved?.status === 'error' && <Notice icon="alert-circle-outline" text={saved.message} />}

      {step === 'unit' && label && !done && (
        <UnitChooser jobNumber={label.jobNumber} panel={label.panel} units={units} onPick={pickUnit} />
      )}

      {canDecide && units.length > 1 && step === 'defect' && (
        <BigButton
          label="Pick another piece"
          icon="list-outline"
          variant="outline"
          onPress={() => setStep('unit')}
        />
      )}

      {canDecide && (
        <DefectPicker
          key={`defect-${unit.idOk}`}
          value={defect}
          onChange={setDefect}
          onValidChange={setDefectValid}
          disabled={saving}
          canAdd={!reorderOnly}
        />
      )}

      {canDecide && unit.hasPhoto && <DefectPhotoCard key={`photo-${unit.idOk}`} uri={defectPhotoUrl(unit.idOk)} />}

      {/* Confirming the defect (as is or changed) means it was fixed: the
          unit is completed right away. Reorder is for pieces that can't be. */}
      {canDecide && (
        <View style={styles.actions}>
          {!reorderOnly && (
            <BigButton
              label="Confirm defect · Repaired"
              icon="checkmark-done"
              variant="good"
              loading={saving}
              disabled={!defectValid}
              onPress={() => save('REPAIRED')}
            />
          )}
          <BigButton
            label={reorderOnly ? 'Confirm defect · Send to reorder' : "Can't be fixed · Reorder"}
            icon="refresh-outline"
            variant="defect"
            loading={reorderOnly && saving}
            disabled={saving || !defectValid}
            onPress={() => save('REORDER')}
          />
        </View>
      )}

      {done ? (
        <View style={styles.actions}>
          {remaining > 0 && label ? (
            <BigButton
              label={`Back to the list: ${remaining} more ${label.panel} in repair`}
              icon="list-outline"
              variant="primary"
              onPress={backToList}
            />
          ) : (
            <Text style={styles.allDoneNote}>
              {label ? `No more ${label.panel} from ${label.jobNumber} in repair.` : ''}
            </Text>
          )}
          <BigButton
            label="Scan a new panel"
            icon="scan-outline"
            variant={remaining > 0 ? 'outline' : 'primary'}
            onPress={scanNext}
          />
        </View>
      ) : (
        <BigButton
          label="Scan next panel"
          icon="scan-outline"
          variant={canDecide ? 'outline' : 'primary'}
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
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.navySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWarn: {
    backgroundColor: '#FDECEA',
  },
  iconDone: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  texts: {
    flex: 1,
  },
  small: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  raw: {
    marginTop: 2,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  doneTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.navy,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  loadingText: {
    fontSize: 15,
    color: colors.muted,
  },
  spaced: {
    marginTop: 10,
  },
  warn: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.danger,
  },
  allDoneNote: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
});

export default RepairScanner;
