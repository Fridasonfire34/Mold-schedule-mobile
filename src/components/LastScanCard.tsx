import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { ScannedCode } from './ScanFrame';
import PanelInfo from './PanelInfo';
import { Card, Divider, Notice, Row } from './ui';
import { LookupResult } from '../api/panels';
import { parsePanelLabel } from '../labels';
import { colors } from '../theme';

interface Props {
  scan: ScannedCode;
  // undefined while the lookup is running.
  lookup: LookupResult | undefined;
}

// What the camera read from the label (split into Job Number and Panel) and
// the panel unit it matches in Mold Schedule.
const LastScanCard: React.FC<Props> = ({ scan, lookup }) => {
  const label = parsePanelLabel(scan.value);
  const found = lookup?.status === 'found' ? lookup.panel : null;

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
        const { panel, assignedUnits, completeUnits } = lookup;
        return (
          <>
            <Row label="Complete" value={`${completeUnits} of ${assignedUnits}`} />
            {panel.defect ? (
              <View style={styles.spaced}>
                <Notice
                  icon="refresh-circle-outline"
                  tone="warn"
                  text={`Re-poured piece: this unit was sent to reorder (${panel.defect}).`}
                />
              </View>
            ) : null}
          </>
        );
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
      case 'in_repair':
        return (
          <Notice
            icon="construct-outline"
            tone="warn"
            text={
              lookup.repairUnits === 1
                ? 'This panel is in Repairs. Repairs completes it once it is fixed.'
                : `The ${lookup.repairUnits} pending units of this panel are in Repairs. Repairs completes them once they are fixed.`
            }
          />
        );
      case 'all_complete':
        return (
          <Notice
            icon="checkmark-done-outline"
            text={`All ${lookup.assignedUnits} units of this panel are already complete.`}
          />
        );
      case 'error':
        return <Notice icon="cloud-offline-outline" text={lookup.message} />;
    }
  };

  return (
    <Card>
      <View style={styles.top}>
        <View style={[styles.iconCircle, !label && styles.iconCircleWarn]}>
          <Icon
            name={label ? 'barcode-outline' : 'alert-circle-outline'}
            size={24}
            color={label ? colors.navy : colors.danger}
          />
        </View>
        <View style={styles.texts}>
          <Text style={styles.label}>Label read</Text>
          <Text style={styles.raw} selectable>
            {scan.value}
          </Text>
        </View>
      </View>

      <Divider />

      {label ? (
        <>
          <PanelInfo
            jobNumber={label.jobNumber}
            panel={label.panel}
            hgt={found?.hgt}
            width={found?.width}
            moldName={found?.moldName}
          />
          <Divider />
          {renderLookup()}
        </>
      ) : (
        <Text style={styles.warn}>
          This is not a panel label. Scan the code on the panel's label.
        </Text>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
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
  iconCircleWarn: {
    backgroundColor: '#FDECEA',
  },
  texts: {
    flex: 1,
  },
  label: {
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
});

export default LastScanCard;
