import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const InicioScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mold Schedule</Text>
      <Text style={styles.subtitle}>Programa de moldes</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f6f8',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#6b7280',
  },
});

export default InicioScreen;
